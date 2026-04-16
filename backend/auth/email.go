package auth

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
)

// EmailService handles sending emails
type EmailService struct {
	host     string
	port     string
	user     string
	password string
}

// NewEmailService creates a new email service
func NewEmailService(host, port, user, password string) *EmailService {
	return &EmailService{
		host:     host,
		port:     port,
		user:     user,
		password: password,
	}
}

// IsConfigured returns true if SMTP credentials are set
func (s *EmailService) IsConfigured() bool {
	return s.user != "" && s.password != ""
}

// SendPasswordReset sends a password reset email
func (s *EmailService) SendPasswordReset(toEmail, toName, resetURL string) error {
	subject := "Recuperação de senha - Lollipopfics"
	body := fmt.Sprintf(`Olá, %s!

Recebemos uma solicitação para redefinir a senha da sua conta.

Clique no link abaixo para criar uma nova senha (válido por 1 hora):

%s

Se você não solicitou a redefinição de senha, ignore este email. Sua senha não será alterada.

Atenciosamente,
Equipe Lollipopfics`, toName, resetURL)

	return s.send(toEmail, subject, body)
}

// SendCommentReport notifies the site's own inbox about a reported comment.
func (s *EmailService) SendCommentReport(reporterUsername string, commentID int, commentContent, reason string) error {
	subject := fmt.Sprintf("[Lollipopfics] Denúncia de comentário #%d", commentID)
	body := fmt.Sprintf(`Uma denúncia foi registrada na plataforma Lollipopfics.

Usuário denunciante : %s
Comentário ID       : %d
Motivo              : %s

Conteúdo denunciado:
--------------------
%s
--------------------

Acesse o painel de administração para revisar e tomar providências.

Atenciosamente,
Sistema Lollipopfics`, reporterUsername, commentID, reason, commentContent)

	return s.send(s.user, subject, body)
}

func (s *EmailService) send(to, subject, body string) error {
	addr := net.JoinHostPort(s.host, s.port)

	header := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n",
		s.user, to, subject)
	message := []byte(header + body)

	auth := smtp.PlainAuth("", s.user, s.password, s.host)

	// Connect with STARTTLS (port 587)
	conn, err := net.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to connect to SMTP server: %w", err)
	}

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		return fmt.Errorf("failed to create SMTP client: %w", err)
	}
	defer client.Close()

	tlsConfig := &tls.Config{ServerName: s.host}
	if err = client.StartTLS(tlsConfig); err != nil {
		return fmt.Errorf("failed to start TLS: %w", err)
	}

	if err = client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP authentication failed: %w", err)
	}

	if err = client.Mail(s.user); err != nil {
		return fmt.Errorf("failed to set sender: %w", err)
	}

	if err = client.Rcpt(to); err != nil {
		return fmt.Errorf("failed to set recipient: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("failed to open data writer: %w", err)
	}

	if _, err = w.Write(message); err != nil {
		return fmt.Errorf("failed to write message: %w", err)
	}

	return w.Close()
}
