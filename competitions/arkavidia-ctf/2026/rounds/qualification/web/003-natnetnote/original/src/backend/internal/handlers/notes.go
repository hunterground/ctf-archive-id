package handlers

import (
	"database/sql"
	"strconv"
	"net/http"
	"math"
	"backend/internal/auth"
	"github.com/gin-gonic/gin"
)

type NotesHandler struct{ db *sql.DB }

func NewNotesHandler(db *sql.DB) *NotesHandler {
	return &NotesHandler{db: db}
}

func paginate(c *gin.Context) (limit, offset, page int) {
	limit = 10
	page = 1

	if l, _ := strconv.Atoi(c.Query("limit")); l > 0 {
		limit = l
	}
	if p, _ := strconv.Atoi(c.Query("page")); p > 1 {
		page = p
	}

	offset = (page - 1) * limit
	return
}


func (h *NotesHandler) List(c *gin.Context) {
	limit, offset, page := paginate(c)

	userID := c.GetInt(auth.CtxUserID)
	role := c.GetString(auth.CtxRole)

	countQuery := `SELECT COUNT(*) FROM notes`
	countArgs := []any{}

	if role != "admin" {
		countQuery += ` WHERE user_id = ?`
		countArgs = append(countArgs, userID)
	}

	var total int
	if err := h.db.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
		c.JSON(500, gin.H{"error": "count failed"})
		return
	}

	query := `SELECT id, user_id, title, content, created_at FROM notes`
	args := []any{}

	if role != "admin" {
		query += ` WHERE user_id = ?`
		args = append(args, userID)
	}

	query += ` LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(500, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()

	var data []gin.H
	data = make([]gin.H, 0)
	for rows.Next() {
		var id, uid int
		var t, ctt, crt string
		if err := rows.Scan(&id, &uid, &t, &ctt, &crt); err != nil {
			c.JSON(500, gin.H{"error": "scan failed"})
			return
		}
		data = append(data, gin.H{
			"id":      id,
			"userId": uid,
			"title":   t,
			"content": ctt,
			"createdAt": crt,
		})
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))

	c.JSON(200, gin.H{
		"data":       data,
		"total":     total,
		"page":      page,
		"limit":     limit,
		"totalPages": totalPages,
	})
}


func (h *NotesHandler) Get(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	userID := c.GetInt(auth.CtxUserID)
	role := c.GetString(auth.CtxRole)

	query := `SELECT user_id, title, content, created_at FROM notes WHERE id = ?`
	args := []any{req.ID}
	if role != "admin" {
		query += ` AND user_id = ?`
		args = append(args, userID)
	}

	var uid int
	var t, ctt, crt string
	if err := h.db.QueryRow(query, args...).Scan(&uid, &t, &ctt, &crt); err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}

	c.JSON(200, gin.H{"id": req.ID, "userId": uid, "title": t, "content": ctt, "createdAt": crt})
}

func (h *NotesHandler) Create(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
	}
	c.ShouldBindJSON(&req)

	h.db.Exec(
		`INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)`,
		c.GetInt(auth.CtxUserID), req.Title, req.Content,
	)
	c.JSON(201, gin.H{"success": true})
}

func (h *NotesHandler) Edit(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		Title   string `json:"title"`
		Content string `json:"content"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	userID := c.GetInt(auth.CtxUserID)
	role := c.GetString(auth.CtxRole)

	query := `UPDATE notes SET title = ?, content = ? WHERE id = ?`
	args := []any{req.Title, req.Content, req.ID}
	if role != "admin" {
		query += ` AND user_id = ?`
		args = append(args, userID)
	}

	res, _ := h.db.Exec(query, args...)
	if n, _ := res.RowsAffected(); n == 0 {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}

func (h *NotesHandler) Delete(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	userID := c.GetInt(auth.CtxUserID)
	role := c.GetString(auth.CtxRole)

	query := `DELETE FROM notes WHERE id = ?`
	args := []any{req.ID}
	if role != "admin" {
		query += ` AND user_id = ?`
		args = append(args, userID)
	}

	res, _ := h.db.Exec(query, args...)
	if n, _ := res.RowsAffected(); n == 0 {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}
