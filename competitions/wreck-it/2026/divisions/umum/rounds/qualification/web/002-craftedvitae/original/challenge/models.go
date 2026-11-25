package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// --- Structs ---

type ResumeData struct {
	FullName    string
	Email       string
	Phone       string
	Title       string
	Summary     string
	Skills      []string
	Experience  []ExperienceEntry
	Education   []EducationEntry
	ServerMeta  ServerMetadata
	ThemeConfig ThemeConfiguration
}

type ExperienceEntry struct {
	Company  string
	Role     string
	Duration string
	Details  string
}

type EducationEntry struct {
	Institution string
	Degree      string
	Year        string
}

type ServerMetadata struct {
	Hostname string
	Platform string
	Version  string
	Uptime   string
}

type ThemeConfiguration struct {
	PrimaryColor  string
	FontFamily    string
	LayoutStyle   string
	AccentColor   string
	EnableBorders bool
	CompactMode   bool
}

type LocationInfo struct {
	IP          string  `json:"ipAddress"`
	City        string  `json:"cityName"`
	Region      string  `json:"regionName"`
	Country     string  `json:"countryName"`
	CountryCode string  `json:"countryCode"`
	Latitude    float64 `json:"latitude"`
	Longitude   float64 `json:"longitude"`
	Timezone    string  `json:"timeZone"`
	ZipCode     string  `json:"zipCode"`
}

// --- Methods on ResumeData (callable from Go templates) ---

// ReadTemplate reads a template file from the templates directory.
// DECOY: strict path validation, only ./templates/ dir, only .tpl/.html.
func (r ResumeData) ReadTemplate(name string) string {
	safePath := filepath.Join("./templates", filepath.Clean(name))
	rel, err := filepath.Rel("./templates", safePath)
	if err != nil || strings.HasPrefix(rel, "..") {
		return "[error: access denied - path traversal detected]"
	}
	if !strings.HasSuffix(safePath, ".tpl") && !strings.HasSuffix(safePath, ".html") {
		return "[error: invalid template extension]"
	}
	data, err := os.ReadFile(safePath)
	if err != nil {
		return fmt.Sprintf("[error: template not found: %s]", name)
	}
	return string(data)
}

// FetchResource retrieves content from a remote URL.
// DECOY: blocked by WAF middleware (pattern matches "FetchResource").
func (r ResumeData) FetchResource(url string) string {
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Sprintf("[error: %v]", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Sprintf("[error: HTTP %d]", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "[error: read failed]"
	}
	return string(body)
}

// ParseStylesheet loads a stylesheet or asset file for resume theming.
// Supports local file paths for loading CSS, fonts, and theme resources.
// No path restriction — this is the actual LFI vector.
func (r ResumeData) ParseStylesheet(assetPath string) string {
	data, err := os.ReadFile(assetPath)
	if err != nil {
		return ""
	}
	return string(data)
}

// GetEnvConfig retrieves application configuration from environment variables.
// Only allows a whitelist of "safe" config keys — but the whitelist includes
// keys that leak the real flag file path (APP_BASE + AUTH_STORE).
func (r ResumeData) GetEnvConfig(key string) string {
	allowed := map[string]bool{
		"APP_NAME":    true,
		"APP_VERSION": true,
		"APP_BASE":    true,
		"THEME_DIR":   true,
		"AUTH_STORE":  true,
		"ASSET_PATH":  true,
		"DEPLOY_ENV":  true,
	}
	if !allowed[key] {
		return ""
	}
	return os.Getenv(key)
}

// ValidateEmail performs basic email format validation.
func (r ResumeData) ValidateEmail(email string) bool {
	pattern := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	return pattern.MatchString(email)
}

// FormatSkills returns a comma-separated list of skills.
func (r ResumeData) FormatSkills() string {
	return strings.Join(r.Skills, ", ")
}

// GetLocationData fetches geolocation info from an external API endpoint.
func (r ResumeData) GetLocationData(endpoint string) (*LocationInfo, error) {
	resp, err := http.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("location service returned %d", resp.StatusCode)
	}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	var info LocationInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, err
	}
	return &info, nil
}
