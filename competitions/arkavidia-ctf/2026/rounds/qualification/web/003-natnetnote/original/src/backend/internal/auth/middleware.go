package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	CtxUserID = "userId"
	CtxRole   = "role"
)

func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Request.Cookie("token")
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		claims, err := Parse(cookie.Value)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		c.Set(CtxUserID, int(claims["userId"].(float64)))
		c.Set(CtxRole, claims["role"].(string))
		c.Next()
	}
}

func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.GetString(CtxRole) != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
			c.Abort()
			return
		}
		c.Next()
	}
}
