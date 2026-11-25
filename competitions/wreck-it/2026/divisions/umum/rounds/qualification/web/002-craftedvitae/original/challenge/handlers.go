package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

const TEMPLATE_DIR = "./templates"

var templateFuncs = template.FuncMap{
	"toUpper":    strings.ToUpper,
	"toLower":    strings.ToLower,
	"formatDate": func(s string) string { return s },
	"truncate": func(s string, n int) string {
		if len(s) <= n {
			return s
		}
		return s[:n] + "..."
	},
	"include": func(name string) string {
		allowed := map[string]bool{
			"header.tpl":  true,
			"footer.tpl":  true,
			"sidebar.tpl": true,
		}
		if !allowed[name] {
			return "[error: template not in whitelist]"
		}
		data, err := os.ReadFile(filepath.Join(TEMPLATE_DIR, "partials", name))
		if err != nil {
			return ""
		}
		return string(data)
	},
	"concat": func(parts ...string) string {
		return strings.Join(parts, "")
	},
	"printf": fmt.Sprintf,
}

// handleIndex redirects to the editor page.
func handleIndex(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" {
		http.NotFound(w, r)
		return
	}
	http.Redirect(w, r, "/editor", http.StatusFound)
}

// handleEditor serves the main editor page.
func handleEditor(w http.ResponseWriter, r *http.Request) {
	tmpl, err := template.ParseFiles(filepath.Join(TEMPLATE_DIR, "index.html"))
	if err != nil {
		http.Error(w, "Editor template not found", http.StatusInternalServerError)
		return
	}
	data := buildResumeData(r)
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	tmpl.Execute(w, data)
}

// handleTemplates returns a JSON list of available templates.
// Intentionally leaks base_dir path as a hint.
func handleTemplates(w http.ResponseWriter, r *http.Request) {
	type TemplateInfo struct {
		Name string `json:"name"`
		File string `json:"file"`
	}
	templates := []TemplateInfo{
		{Name: "Professional", File: "professional.tpl"},
		{Name: "Modern", File: "modern.tpl"},
		{Name: "Minimal", File: "minimal.tpl"},
		{Name: "Creative", File: "creative.tpl"},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"templates": templates,
		"base_dir":  TEMPLATE_DIR,
		"count":     len(templates),
	})
}

// handlePreview renders a whitelisted template with dummy data.
// DECOY: well-protected, only allows known template names.
func handlePreview(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("template")
	if name == "" {
		name = "professional.tpl"
	}
	allowed := map[string]bool{
		"professional.tpl": true,
		"modern.tpl":       true,
		"minimal.tpl":      true,
		"creative.tpl":     true,
	}
	if !allowed[name] {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "Template not found in approved list",
		})
		return
	}
	tmplPath := filepath.Join(TEMPLATE_DIR, name)
	tmpl, err := template.New(name).Funcs(templateFuncs).ParseFiles(tmplPath)
	if err != nil {
		http.Error(w, "Failed to parse template", http.StatusInternalServerError)
		return
	}
	data := buildResumeData(r)
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		http.Error(w, "Template execution failed", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(buf.Bytes())
}

// handleExport returns a "disabled" message -- decoy dead end.
func handleExport(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusServiceUnavailable)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "disabled",
		"message": "PDF export is temporarily disabled for maintenance",
	})
}

// handleRender is THE VULNERABLE ENDPOINT.
// source=remote&url=<url> fetches a remote Go template and executes it
// with full ResumeData context. WAF checks the raw template string only,
// not the rendered output -- so dynamically constructed paths bypass it.
func handleRender(w http.ResponseWriter, r *http.Request) {
	source := r.URL.Query().Get("source")

	switch source {
	case "remote":
		handleRenderRemote(w, r)
	case "local", "":
		handleRenderLocal(w, r)
	default:
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "invalid source, use remote or local",
		})
	}
}

func handleRenderRemote(w http.ResponseWriter, r *http.Request) {
	remoteURL := r.URL.Query().Get("url")
	if remoteURL == "" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "missing url parameter",
		})
		return
	}

	if !SanitizeRemoteURL(remoteURL) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "URL blocked by security policy",
		})
		return
	}

	content, err := fetchRemoteTemplate(remoteURL)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadGateway)
		json.NewEncoder(w).Encode(map[string]string{
			"error": fmt.Sprintf("fetch failed: %v", err),
		})
		return
	}

	// WAF checks raw template string, not rendered output
	if !SanitizeTemplateContent(content) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "template content blocked by security policy",
		})
		return
	}

	tmpl, err := template.New("remote").Funcs(templateFuncs).Parse(content)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": fmt.Sprintf("template parse error: %v", err),
		})
		return
	}

	data := buildResumeData(r)
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{
			"error": fmt.Sprintf("template execution error: %v", err),
		})
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(buf.Bytes())
}

func handleRenderLocal(w http.ResponseWriter, r *http.Request) {
	page := r.URL.Query().Get("page")
	if page == "" {
		page = "professional"
	}

	// Validate page name: alphanumeric + hyphens only
	for _, c := range page {
		if !((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-') {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]string{
				"error": "invalid template name",
			})
			return
		}
	}

	tmplPath := filepath.Join(TEMPLATE_DIR, page+".tpl")
	absPath, err := filepath.Abs(tmplPath)
	if err != nil {
		http.Error(w, "path error", http.StatusInternalServerError)
		return
	}
	absTemplateDir, _ := filepath.Abs(TEMPLATE_DIR)
	if !strings.HasPrefix(absPath, absTemplateDir) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "access denied",
		})
		return
	}

	tmpl, err := template.New(page+".tpl").Funcs(templateFuncs).ParseFiles(tmplPath)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "template not found",
		})
		return
	}

	data := buildResumeData(r)
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		http.Error(w, "render failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write(buf.Bytes())
}

// handleHealth returns JSON health status.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"service": "craftedvitae",
		"version": os.Getenv("APP_VERSION"),
		"uptime":  getCmd("uptime -p"),
	})
}

// buildResumeData constructs a ResumeData with server info and sample CV data.
func buildResumeData(r *http.Request) *ResumeData {
	hostname, _ := os.Hostname()
	return &ResumeData{
		FullName: "John Doe",
		Email:    "john.doe@example.com",
		Phone:    "+1-555-0100",
		Title:    "Senior Software Engineer",
		Summary:  "Experienced developer passionate about scalable systems.",
		Skills:   []string{"Go", "Python", "Docker", "Kubernetes", "PostgreSQL"},
		Experience: []ExperienceEntry{
			{
				Company:  "TechCorp Inc.",
				Role:     "Senior Software Engineer",
				Duration: "2021 - Present",
				Details:  "Led backend team, designed microservices architecture.",
			},
			{
				Company:  "StartupXYZ",
				Role:     "Software Engineer",
				Duration: "2018 - 2021",
				Details:  "Built core platform, implemented CI/CD pipelines.",
			},
		},
		Education: []EducationEntry{
			{
				Institution: "State University",
				Degree:      "B.Sc. Computer Science",
				Year:        "2018",
			},
		},
		ServerMeta: ServerMetadata{
			Hostname: hostname,
			Platform: runtime.GOOS + "/" + runtime.GOARCH,
			Version:  os.Getenv("APP_VERSION"),
			Uptime:   getCmd("uptime -p"),
		},
		ThemeConfig: ThemeConfiguration{
			PrimaryColor:  "#2563eb",
			FontFamily:    "Inter, sans-serif",
			LayoutStyle:   "single-column",
			AccentColor:   "#1e40af",
			EnableBorders: true,
			CompactMode:   false,
		},
	}
}

// getCmd runs a shell command and returns its trimmed output.
func getCmd(command string) string {
	out, err := exec.Command("sh", "-c", command).Output()
	if err != nil {
		return "unknown"
	}
	return strings.TrimSpace(string(out))
}

// fetchRemoteTemplate fetches a Go template from a remote URL.
func fetchRemoteTemplate(url string) (string, error) {
	client := &http.Client{
		Timeout: 10 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 3 {
				return fmt.Errorf("too many redirects")
			}
			return nil
		},
	}

	resp, err := client.Get(url)
	if err != nil {
		return "", fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	limited := io.LimitReader(resp.Body, 1024*1024)
	body, err := io.ReadAll(limited)
	if err != nil {
		return "", fmt.Errorf("read failed: %w", err)
	}

	return string(body), nil
}
