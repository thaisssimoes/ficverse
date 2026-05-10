package routes

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/interactive-fanfic-platform/models"
	"gorm.io/gorm"
)

// AdminHandler handles admin-only endpoints.
type AdminHandler struct {
	db *gorm.DB
}

func NewAdminHandler(db *gorm.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// GET /admin/stats — métricas gerais da plataforma
func (h *AdminHandler) GetStats(c *gin.Context) {
	var totalUsers, totalFanfics, totalChapters, totalComments int64

	h.db.Model(&models.User{}).Count(&totalUsers)
	h.db.Model(&models.Fanfic{}).Count(&totalFanfics)
	h.db.Model(&models.Chapter{}).Count(&totalChapters)
	h.db.Model(&models.Comment{}).Count(&totalComments)

	c.JSON(http.StatusOK, gin.H{
		"total_users":    totalUsers,
		"total_fanfics":  totalFanfics,
		"total_chapters": totalChapters,
		"total_comments": totalComments,
	})
}

// GET /admin/users — lista paginada de usuárias com busca opcional
func (h *AdminHandler) ListUsers(c *gin.Context) {
	search := c.Query("search")
	pageStr := c.DefaultQuery("page", "1")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	limit := 20
	offset := (page - 1) * limit

	query := h.db.Model(&models.User{})
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("username ILIKE ? OR email ILIKE ?", like, like)
	}

	var total int64
	query.Count(&total)

	var users []models.User
	query.Limit(limit).Offset(offset).
		Order("created_at DESC").
		Find(&users)

	c.JSON(http.StatusOK, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

// PUT /admin/users/:id/ban — bane uma usuária
func (h *AdminHandler) BanUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	var user models.User
	if err := h.db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Usuária não encontrada"}})
		return
	}

	if user.IsAdmin {
		c.JSON(http.StatusForbidden, ErrorResponse{Error: ErrorDetail{Code: "FORBIDDEN", Message: "Não é possível banir uma administradora"}})
		return
	}

	if err := h.db.Model(&user).Update("is_banned", true).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao banir usuária"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuária banida com sucesso"})
}

// DELETE /admin/users/:id/ban — desbane uma usuária
func (h *AdminHandler) UnbanUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", id).Update("is_banned", false).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao desbanir usuária"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Usuária desbanida com sucesso"})
}

// PUT /admin/users/:id/admin — concede ou revoga status de admin
func (h *AdminHandler) SetAdmin(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	var body struct {
		IsAdmin bool `json:"is_admin"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_BODY", Message: "Corpo inválido"}})
		return
	}

	if err := h.db.Model(&models.User{}).Where("id = ?", id).Update("is_admin", body.IsAdmin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao atualizar admin"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Status de admin atualizado"})
}

// GET /admin/fanfics — lista fanfics com busca opcional
func (h *AdminHandler) ListFanfics(c *gin.Context) {
	search := c.Query("search")
	pageStr := c.DefaultQuery("page", "1")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	limit := 20
	offset := (page - 1) * limit

	query := h.db.Model(&models.Fanfic{}).Preload("Author")
	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}

	var total int64
	query.Count(&total)

	var fanfics []models.Fanfic
	query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&fanfics)

	c.JSON(http.StatusOK, gin.H{
		"fanfics": fanfics,
		"total":   total,
		"page":    page,
	})
}

// DELETE /admin/fanfics/:id — remove uma fanfic e todos os capítulos
func (h *AdminHandler) DeleteFanfic(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	var fanfic models.Fanfic
	if err := h.db.First(&fanfic, id).Error; err != nil {
		c.JSON(http.StatusNotFound, ErrorResponse{Error: ErrorDetail{Code: "NOT_FOUND", Message: "Fanfic não encontrada"}})
		return
	}

	// Remove capítulos primeiro (FK)
	h.db.Where("fanfic_id = ?", id).Delete(&models.Chapter{})
	// Remove fanfic
	if err := h.db.Delete(&fanfic).Error; err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Error: ErrorDetail{Code: "DB_ERROR", Message: "Erro ao remover fanfic"}})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Fanfic removida com sucesso"})
}

// GET /admin/reports — lista denúncias de comentários pendentes
func (h *AdminHandler) ListReports(c *gin.Context) {
	type ReportRow struct {
		ID              int    `json:"id"`
		ReporterID      int    `json:"reporter_id"`
		ReporterUsername string `json:"reporter_username"`
		CommentID       int    `json:"comment_id"`
		Reason          string `json:"reason"`
		CreatedAt       string `json:"created_at"`
		Type            string `json:"type"`
	}

	var rows []ReportRow
	h.db.Raw(`
		SELECT cr.id, cr.user_id AS reporter_id, u.username AS reporter_username,
		       cr.comment_id, cr.reason, cr.created_at::text, 'comment' AS type
		FROM comment_reports cr
		JOIN users u ON u.id = cr.user_id
		ORDER BY cr.created_at DESC
		LIMIT 100
	`).Scan(&rows)

	c.JSON(http.StatusOK, rows)
}

// PUT /admin/reports/:id — resolve uma denúncia (ignora ou remove conteúdo)
func (h *AdminHandler) ResolveReport(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_ID", Message: "ID inválido"}})
		return
	}

	var body struct {
		Action string `json:"action"` // "ignore" | "delete"
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Error: ErrorDetail{Code: "INVALID_BODY", Message: "Corpo inválido"}})
		return
	}

	if body.Action == "delete" {
		// Remove o comentário alvo
		var report struct{ CommentID int }
		h.db.Raw("SELECT comment_id FROM comment_reports WHERE id = ?", id).Scan(&report)
		if report.CommentID != 0 {
			h.db.Where("id = ?", report.CommentID).Delete(&models.Comment{})
		}
	}

	// Remove a denúncia em qualquer caso
	h.db.Exec("DELETE FROM comment_reports WHERE id = ?", id)

	c.JSON(http.StatusOK, gin.H{"message": "Denúncia resolvida"})
}
