package router

import (
	"database/sql"

	"backend/internal/auth"
	"backend/internal/handlers"
	"github.com/gin-gonic/gin"
)

func Setup(db *sql.DB) *gin.Engine {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	r.Use(gin.Logger()) 
	r.Use(gin.Recovery())

	authH := handlers.NewAuthHandler(db)
	noteH := handlers.NewNotesHandler(db)
	annH := handlers.NewAnnouncementHandler(db)

	r.POST("/auth/register", authH.Register)
	r.POST("/auth/login", authH.Login)

	api := r.Group("/")
	api.Use(auth.RequireAuth())

	api.GET("/notes", noteH.List)
	api.POST("/note", noteH.Get)
	api.POST("/note/create", noteH.Create)
	api.PUT("/note/edit", noteH.Edit)
	api.DELETE("/note/delete", noteH.Delete)

	r.GET("/announcements", annH.ListPublished)
	r.POST("/announcement", annH.GetPublished)
	r.POST("/report", authH.Report)
	r.GET("/flag", authH.Flag)

	admin := api.Group("/")
	admin.Use(auth.RequireAdmin())

	admin.GET("/announcement/drafts", annH.ListDrafts)
	admin.POST("/announcement/draft", annH.GetDraft)
	admin.POST("/announcement/create", annH.Create)
	admin.PUT("/announcement/draft/edit", annH.EditDraft)
	admin.DELETE("/announcement/delete", annH.Delete)

	return r
}
