package auth

import (
	"crypto/rand"
	"time"
	"os"

	"github.com/golang-jwt/jwt/v5"
)

var secret []byte

func init() {
	b := make([]byte, 64)
	rand.Read(b)
	secret = []byte(os.Getenv("JWT_SECRET"))
}

func GenerateJWT(userID int, username string, role string) (string, error) {
	claims := jwt.MapClaims{
		"userId": userID,
		"username": username,
		"role":    role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret)
}

func Parse(tokenStr string) (jwt.MapClaims, error) {
	claims := jwt.MapClaims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		return secret, nil
	})
	return claims, err
}


