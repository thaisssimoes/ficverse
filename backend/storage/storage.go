// Package storage defines a provider-agnostic interface for file uploads.
// To switch from Supabase to S3, R2, or any other backend, implement the
// StorageService interface and update the factory in New().
package storage

import (
	"context"
	"io"
)

// StorageService is the single contract all storage backends must satisfy.
// Handlers depend only on this interface, never on a concrete type.
type StorageService interface {
	// Upload stores the content of r under the given key and returns its public URL.
	// key is a slash-separated relative path, e.g. "fanfic-covers/123_1714000000.jpg"
	Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (publicURL string, err error)

	// Delete removes the file at key. A non-existent key must not return an error.
	Delete(ctx context.Context, key string) error

	// PublicURL returns the public URL for an already-stored key without performing any I/O.
	PublicURL(key string) string
}

// Config holds all parameters needed to initialise a StorageService.
// Unknown fields for the chosen provider are silently ignored.
type Config struct {
	// Provider selects the backend: "local" (default) or "supabase".
	Provider string

	// Local provider — base directory for uploads (default: "./uploads")
	LocalDir string

	// Supabase provider
	SupabaseURL    string // e.g. https://xxxx.supabase.co
	SupabaseKey    string // service_role key (never the anon key)
	SupabaseBucket string // bucket name, e.g. "lollipopfics"
}

// New returns the StorageService for the configured provider.
// Defaults to local storage if Provider is empty or unrecognised.
func New(cfg Config) StorageService {
	switch cfg.Provider {
	case "supabase":
		return NewSupabaseStorage(cfg.SupabaseURL, cfg.SupabaseKey, cfg.SupabaseBucket)
	default:
		dir := cfg.LocalDir
		if dir == "" {
			dir = "./uploads"
		}
		return NewLocalStorage(dir)
	}
}
