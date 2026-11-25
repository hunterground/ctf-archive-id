package main

import (
	"fmt"
	"net/http"
)

const WEB_PORT = "1337"

func main() {
	mux := http.NewServeMux()

	// Static files
	mux.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	// Pages
	mux.HandleFunc("/", handleIndex)
	mux.HandleFunc("/editor", handleEditor)

	// API endpoints
	mux.HandleFunc("/api/templates", handleTemplates)
	mux.HandleFunc("/api/preview", handlePreview)
	mux.HandleFunc("/api/export", handleExport)
	mux.HandleFunc("/api/render", WAFMiddleware(handleRender))
	mux.HandleFunc("/api/health", handleHealth)

	fmt.Printf("CraftedVitae server started on port %s\n", WEB_PORT)
	http.ListenAndServe(":"+WEB_PORT, mux)
}
