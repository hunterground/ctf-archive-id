package handlers

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"bytes"
    "encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/auth"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct{ db *sql.DB }

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func GenerateUserToken(data string) (string) {
	timestamp := time.Now().UnixMilli()
	dataWithTimestamp := fmt.Sprintf("%s:%d", data, timestamp)
	hash := sha256.Sum256([]byte(dataWithTimestamp))
	return hex.EncodeToString(hash[:])
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid body"})
		return
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	_, err := h.db.Exec(
		`INSERT INTO users (username, email, password_hash, role, user_token) VALUES (?, ?, ?, 'user', ?)`,
		req.Username, req.Email, hash, GenerateUserToken(req.Username),
	)
	if err != nil {
		c.JSON(409, gin.H{"error": "email exists"})
		return
	}

	c.JSON(201, gin.H{"success": true})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid body"})
		return
	}

	var id int
	var username, hash, role string
	err := h.db.QueryRow(
		`SELECT id, username, password_hash, role FROM users WHERE email = ?`,
		req.Email,
	).Scan(&id, &username, &hash, &role)

	if err != nil || bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)) != nil {
		c.JSON(401, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateJWT(id, username, role)
	if err != nil {
		c.JSON(401, gin.H{"error": "Failed to generate JWT. contact author"})
		return
	}
	c.JSON(200, gin.H{"token": token})
}

func (h *AuthHandler) Flag(c *gin.Context) {
	q := c.DefaultQuery("q", "")
	
	if q == "" {
		c.JSON(400, gin.H{"error": "missing 'q' query parameter"})
		return
	}

	if strings.Contains(os.Getenv("FLAG"), q) {
		c.JSON(200, gin.H{"success": "true"})
	} else {
		c.JSON(400, gin.H{"error": "nope"})
	}
}

func (h *AuthHandler) Report(c *gin.Context) {
	var req struct {
		Url    string `json:"url"`
		Token    *string `json:"token"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "invalid body"})
		return
	}
	
	var utoken string
	if req.Token != nil {
		var id int
		var username, role string
		err := h.db.QueryRow(
			`SELECT id, username, role FROM users WHERE user_token = ?`,
			req.Token,
		).Scan(&id, &username, &role)

		if err != nil {
			c.JSON(401, gin.H{"error": "invalid token"})
			return
		}

		if (role != "admin") {
			_, err := h.db.Exec(
				`INSERT INTO report_log (user_token, report_url, reviewed) VALUES (?, ?, ?)`,
				req.Token, req.Url, false,
			)
			if err != nil {
				c.JSON(409, gin.H{"error": "failed to log report"})
				return
			}

			c.JSON(200, gin.H{"success": "reported successfully"})
			return
		}

		utoken, err = auth.GenerateJWT(id, username, role)
		if err != nil {
			c.JSON(401, gin.H{"error": "Failed to generate JWT. Try again"})
			return
		}
	} else {
		cookie, err := c.Request.Cookie("token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		claims, err := auth.Parse(cookie.Value)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		if (claims["role"] != "admin") {
			_, err := h.db.Exec(
				`INSERT INTO report_log (user_token, report_url, reviewed) VALUES (?, ?, ?)`,
				req.Token, req.Url, false,
			)
			if err != nil {
				c.JSON(409, gin.H{"error": "failed to log report"})
				return
			}

			c.JSON(200, gin.H{"success": "reported successfully"})
			return
		}

		utoken = cookie.Value;
	}

	// send to bot
	botPayload := map[string]interface{}{
        "url": req.Url,
		"token": utoken,
    }

	jsonData, err := json.Marshal(botPayload)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to prepare bot request"})
        return
    }

    client := &http.Client{
        Timeout: 30 * time.Second,
    }

    botReq, err := http.NewRequest("POST", "http://bot:3000/", bytes.NewBuffer(jsonData))
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create bot request"})
        return
    }
    botReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(botReq)
    if err != nil {
        c.JSON(http.StatusServiceUnavailable, gin.H{"error": "bot service unavailable: "+ err.Error()})
        return
    }
    defer resp.Body.Close()

    var botResponse map[string]interface{}
    if err := json.NewDecoder(resp.Body).Decode(&botResponse); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse bot response"})
        return
    }

	if resp.StatusCode != 200 {
		 c.JSON(resp.StatusCode, botResponse)
	}

	_, err = h.db.Exec(
		`INSERT INTO report_log (user_token, report_url, reviewed) VALUES (?, ?, ?)`,
		req.Token, req.Url, true,
	)
	if err != nil {
		c.JSON(409, gin.H{"error": "failed to log report"})
		return
	}

	c.JSON(200, gin.H{"success": "reported successfully"})
}
