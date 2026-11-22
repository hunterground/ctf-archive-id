package handlers

import (
	"database/sql"
	"net/http"
	"math"

	"github.com/gin-gonic/gin"
)

type AnnouncementHandler struct{ db *sql.DB }

func NewAnnouncementHandler(db *sql.DB) *AnnouncementHandler {
	return &AnnouncementHandler{db: db}
}

func (h *AnnouncementHandler) ListPublished(c *gin.Context) {
	limit, offset, page := paginate(c)

	var total int
	if err := h.db.QueryRow(
		`SELECT COUNT(*) FROM announcements WHERE is_draft = false`,
	).Scan(&total); err != nil {
		c.JSON(500, gin.H{"error": "count failed"})
		return
	}

	rows, err := h.db.Query(
		`SELECT id, title, content, created_at FROM announcements
		 WHERE is_draft = false
		 LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()

	var data []gin.H
	data = make([]gin.H, 0)
	for rows.Next() {
		var id int
		var t, ctt, crt string
		if err := rows.Scan(&id, &t, &ctt, &crt); err != nil {
			c.JSON(500, gin.H{"error": "scan failed"})
			return
		}
		data = append(data, gin.H{
			"id":      id,
			"title":   t,
			"content": ctt,
			"createdAt": crt, 
			"isDraft": false,
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


func (h *AnnouncementHandler) GetPublished(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	var t, ctt, crt string
	if err := h.db.QueryRow(
		`SELECT title, content, created_at FROM announcements 
		 WHERE id = ? AND is_draft = false`,
		req.ID,
	).Scan(&t, &ctt, &crt); err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"id": req.ID, "title": t, "content": ctt, "createdAt": crt, "isDraft": false})
}

func (h *AnnouncementHandler) ListDrafts(c *gin.Context) {
	limit, offset, page := paginate(c)

	var total int
	if err := h.db.QueryRow(
		`SELECT COUNT(*) FROM announcements WHERE is_draft = true`,
	).Scan(&total); err != nil {
		c.JSON(500, gin.H{"error": "count failed"})
		return
	}

	rows, err := h.db.Query(
		`SELECT id, title, content, created_at FROM announcements
		 WHERE is_draft = true
		 LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		c.JSON(500, gin.H{"error": "query failed"})
		return
	}
	defer rows.Close()

	var data []gin.H
	data = make([]gin.H, 0)
	for rows.Next() {
		var id int
		var t, ctt, crt string
		if err := rows.Scan(&id, &t, &ctt, &crt); err != nil {
			c.JSON(500, gin.H{"error": "scan failed"})
			return
		}
		data = append(data, gin.H{
			"id":      id,
			"title":   t,
			"content": ctt,
			"createdAt": crt, 
			"isDraft": true,
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


func (h *AnnouncementHandler) GetDraft(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	var t, ctt, crt string
	if err := h.db.QueryRow(
		`SELECT title, content, created_at FROM announcements 
		 WHERE id = ? AND is_draft = true`,
		req.ID,
	).Scan(&t, &ctt, &crt); err != nil {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"id": req.ID, "title": t, "content": ctt, "createdAt": crt, "isDraft": false})
}

func (h *AnnouncementHandler) Create(c *gin.Context) {
	var req struct {
		Title   string `json:"title"`
		Content string `json:"content"`
		IsDraft  bool `json:"isDraft"`
	}
	c.ShouldBindJSON(&req)

	h.db.Exec(
		`INSERT INTO announcements (title, content, is_draft) VALUES (?, ?, ?)`,
		req.Title, req.Content, req.IsDraft,
	)
	c.JSON(201, gin.H{"success": true})	
}

func (h *AnnouncementHandler) EditDraft(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
		Title   string `json:"title"`
		Content string `json:"content"`
		IsDraft  bool `json:"isDraft"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}

	res, _ := h.db.Exec(
		`UPDATE announcements 
		 SET title = ?, content = ?, is_draft = ?
		 WHERE id = ?`,
		req.Title, req.Content, req.IsDraft, req.ID,
	)
	if n, _ := res.RowsAffected(); n == 0 {
		c.JSON(404, gin.H{"error": "not found or not draft"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}

func (h *AnnouncementHandler) Delete(c *gin.Context) {
	var req struct {
		ID int `json:"id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
		return
	}
	
	res, _ := h.db.Exec(`DELETE FROM announcements WHERE id = ?`, req.ID)
	if n, _ := res.RowsAffected(); n == 0 {
		c.JSON(404, gin.H{"error": "not found"})
		return
	}
	c.JSON(200, gin.H{"success": true})
}
