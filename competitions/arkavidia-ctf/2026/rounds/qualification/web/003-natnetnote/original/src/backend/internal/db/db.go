package db

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"

	_ "modernc.org/sqlite"
)

func Open() *sql.DB {
	db, err := sql.Open("sqlite", "data.db")
	if err != nil {
		log.Fatal(err)
	}
	return db
}

func GenerateUserToken(data string) string {
	timestamp := time.Now().UnixMilli()
	dataWithTimestamp := fmt.Sprintf("%s:%d", data, timestamp)
	hash := sha256.Sum256([]byte(dataWithTimestamp))
	return hex.EncodeToString(hash[:])
}

func Migrate(db *sql.DB) {
	sqlBytes, err := os.ReadFile("migrations/schema.sql")
	if err != nil {
		log.Fatal(err)
	}
	if _, err := db.Exec(string(sqlBytes)); err != nil {
		log.Fatal(err)
	}

	b := make([]byte, 64)
	rand.Read(b)
	adminPassword, _ := hex.DecodeString(hex.EncodeToString(b))

	adminEmail := "admin@atmin.com"
	passwordHash, _ := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)

	_, err = db.Exec(`
	INSERT OR IGNORE INTO users (username, email, password_hash, role, user_token)
	VALUES ('admin', ?, ?, 'admin', ?)
	`, adminEmail, string(passwordHash), GenerateUserToken("admin"))
	if err != nil {
		log.Fatal("Failed to insert admin:", err)
	}

	loss := `
⠀⠀⠀⣴⣴⡤
⠀⣠⠀⢿⠇⡇⠀⠀⠀⠀⠀⠀⠀⢰⢷⡗
⠀⢶⢽⠿⣗⠀⠀⠀⠀⠀⠀⠀⠀⣼⡧⠂⠀⠀⣼⣷⡆
⠀⠀⣾⢶⠐⣱⠀⠀⠀⠀⠀⣤⣜⣻⣧⣲⣦⠤⣧⣿⠶
⠀⢀⣿⣿⣇⠀⠀⠀⠀⠀⠀⠛⠿⣿⣿⣷⣤⣄⡹⣿⣷
⠀⢸⣿⢸⣿⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣿⣿⣿⣿⣿
⠀⠿⠃⠈⠿⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⠿⠿⠿

⠀⢀⢀⡀⠀⢀⣤⠀⠀⠀⠀⠀⠀⠀⡀⡀
⠀⣿⡟⡇⠀⠭⡋⠅⠀⠀⠀⠀⠀⢰⣟⢿
⠀⣹⡌⠀⠀⣨⣾⣷⣄⠀⠀⠀⠀⢈⠔⠌
⠰⣷⣿⡀⢐⢿⣿⣿⢻⠀⠀⠀⢠⣿⡿⡤⣴⠄⢀⣀⡀
⠘⣿⣿⠂⠈⢸⣿⣿⣸⠀⠀⠀⢘⣿⣿⣀⡠⣠⣺⣿⣷
⠀⣿⣿⡆⠀⢸⣿⣿⣾⡇⠀⣿⣿⣿⣿⣿⣗⣻⡻⠿⠁
⠀⣿⣿⡇⠀⢸⣿⣿⡇⠀⠀⠉⠉⠉⠉⠉⠉⠁
	`

	_, err = db.Exec(`
	INSERT OR IGNORE INTO announcements (title, content, is_draft)
	VALUES (?, ?, false)
	`, "Welcome!", loss)
	if err != nil {
		log.Fatal("Failed to insert announcement:", err)
	}
}
