package main

import (
	"io"
	"net"
	"net/http"
	"net/url"
	"regexp"
	"strings"
)

// blockedPatterns defines WAF rules that block obvious attack patterns.
// NOTE: Does NOT block "ParseStylesheet" or "GetEnvConfig" — these are
// considered "safe" utility methods by the WAF.
var blockedPatterns = []*regexp.Regexp{
	// Direct file path patterns
	regexp.MustCompile(`(?i)/flag`),
	regexp.MustCompile(`(?i)/etc/passwd`),
	regexp.MustCompile(`(?i)/etc/shadow`),
	regexp.MustCompile(`(?i)/proc/`),

	// Obvious method names that scream "file read"
	regexp.MustCompile(`(?i)OutFileContents`),
	regexp.MustCompile(`(?i)FetchResource`),
	regexp.MustCompile(`(?i)ReadFile`),
	regexp.MustCompile(`(?i)os\.ReadFile`),

	// Direct credential/secret keywords in template body
	regexp.MustCompile(`(?i)credential`),
	regexp.MustCompile(`(?i)secret`),
	regexp.MustCompile(`(?i)token\.key`),
	regexp.MustCompile(`(?i)\.credentials`),

	// Common path traversal
	regexp.MustCompile(`\.\.\/`),
	regexp.MustCompile(`\.\.\\`),

	// Block /opt/ direct references
	regexp.MustCompile(`(?i)/opt/`),
}

// SanitizeTemplateContent checks raw template content against WAF rules.
// Returns true if the content is safe, false if blocked.
func SanitizeTemplateContent(content string) bool {
	for _, pattern := range blockedPatterns {
		if pattern.MatchString(content) {
			return false
		}
	}
	return true
}

// isDisallowedIP reports whether ip must not be reachable via server-side fetches:
// loopback, private (RFC1918/RFC4193), link-local, or otherwise unspecified.
func isDisallowedIP(ip net.IP) bool {
	return ip.IsLoopback() ||
		ip.IsPrivate() ||
		ip.IsLinkLocalUnicast() ||
		ip.IsLinkLocalMulticast() ||
		ip.IsUnspecified()
}

// SanitizeRemoteURL validates that a remote template URL is acceptable.
// Resolves the hostname and checks the *actual* IP(s) it points to, rather
// than string-matching the URL text — this closes bypasses via alternate IP
// notation (127.1, octal/decimal, IPv6-mapped) and DNS rebinding, in addition
// to properly covering the full private/loopback/link-local ranges.
func SanitizeRemoteURL(rawURL string) bool {
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return false
	}

	// Must be HTTP or HTTPS
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return false
	}

	host := parsed.Hostname()
	if host == "" {
		return false
	}

	// If the host is a literal IP, check it directly.
	if ip := net.ParseIP(host); ip != nil {
		return !isDisallowedIP(ip)
	}

	// Otherwise resolve the hostname and check every address it maps to,
	// so a rebinding-style domain can't slip through as "just a hostname".
	ips, err := net.LookupIP(host)
	if err != nil || len(ips) == 0 {
		return false
	}
	for _, ip := range ips {
		if isDisallowedIP(ip) {
			return false
		}
	}

	return true
}

// WAFMiddleware wraps handlers with request inspection.
// Checks query parameters and POST body against blockedPatterns.
func WAFMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Check query parameters
		for _, values := range r.URL.Query() {
			for _, v := range values {
				if !SanitizeTemplateContent(v) {
					http.Error(w, "Request blocked by security policy", http.StatusForbidden)
					return
				}
			}
		}

		// For POST requests, check body content
		if r.Method == "POST" && r.Body != nil {
			body, err := io.ReadAll(r.Body)
			if err == nil {
				bodyStr := string(body)
				if !SanitizeTemplateContent(bodyStr) {
					http.Error(w, "Request blocked by security policy", http.StatusForbidden)
					return
				}
				// Reconstruct body for downstream handler
				r.Body = io.NopCloser(strings.NewReader(bodyStr))
			}
		}

		next.ServeHTTP(w, r)
	}
}
