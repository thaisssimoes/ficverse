package storage

import (
	"context"
	"io"
	"os"
	"path/filepath"
)

// LocalStorage saves files to the local filesystem.
// Suitable for development and single-instance deployments where the
// upload directory is persistent (e.g. a mounted volume).
type LocalStorage struct {
	baseDir string // absolute or relative root, e.g. "./uploads"
}

func NewLocalStorage(baseDir string) *LocalStorage {
	return &LocalStorage{baseDir: baseDir}
}

func (s *LocalStorage) Upload(_ context.Context, key string, r io.Reader, _ int64, _ string) (string, error) {
	dst := filepath.Join(s.baseDir, filepath.FromSlash(key))

	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return "", err
	}

	f, err := os.Create(dst)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if _, err := io.Copy(f, r); err != nil {
		return "", err
	}

	return s.PublicURL(key), nil
}

func (s *LocalStorage) Delete(_ context.Context, key string) error {
	dst := filepath.Join(s.baseDir, filepath.FromSlash(key))
	err := os.Remove(dst)
	if os.IsNotExist(err) {
		return nil
	}
	return err
}

// PublicURL returns a server-relative URL, e.g. /uploads/fanfic-covers/1_xxx.jpg
// The server must serve the baseDir directory under /uploads.
func (s *LocalStorage) PublicURL(key string) string {
	return "/uploads/" + key
}
