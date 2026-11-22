package main

import (
	"log"
	"net/http"

	"backend/internal/db"
	"backend/internal/router"
)

func main() {
	database := db.Open()
	db.Migrate(database)

	r := router.Setup(database)

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
