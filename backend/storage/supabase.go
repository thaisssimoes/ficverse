package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// SupabaseStorage uploads files to Supabase Storage via the REST API.
// No external SDK required — only the standard library.
type SupabaseStorage struct {
	baseURL string // e.g. https://xxxx.supabase.co
	key     string // service_role key
	bucket  string // bucket name
	client  *http.Client
}

func NewSupabaseStorage(baseURL, key, bucket string) *SupabaseStorage {
	return &SupabaseStorage{
		baseURL: strings.TrimRight(baseURL, "/"),
		key:     key,
		bucket:  bucket,
		client:  &http.Client{},
	}
}

// Upload sends the file to Supabase Storage and returns its public URL.
// x-upsert: true means re-uploading the same key overwrites without error.
func (s *SupabaseStorage) Upload(ctx context.Context, key string, r io.Reader, size int64, contentType string) (string, error) {
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", s.baseURL, s.bucket, key)

	body, err := io.ReadAll(r)
	if err != nil {
		return "", fmt.Errorf("storage: read body: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return "", fmt.Errorf("storage: build request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.key)
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("x-upsert", "true")

	resp, err := s.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("storage: upload request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return "", fmt.Errorf("storage: supabase returned %d: %v", resp.StatusCode, errBody)
	}

	return s.PublicURL(key), nil
}

// Delete removes a file from Supabase Storage.
// Supabase treats a missing key as success when using the batch delete endpoint.
func (s *SupabaseStorage) Delete(ctx context.Context, key string) error {
	url := fmt.Sprintf("%s/storage/v1/object/%s", s.baseURL, s.bucket)

	payload, _ := json.Marshal(map[string][]string{"prefixes": {key}})
	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("storage: build delete request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.key)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("storage: delete request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("storage: supabase delete returned %d: %v", resp.StatusCode, errBody)
	}

	return nil
}

// PublicURL returns the public URL for a stored object.
// The bucket must be public in Supabase for this URL to be accessible without authentication.
func (s *SupabaseStorage) PublicURL(key string) string {
	return fmt.Sprintf("%s/storage/v1/object/public/%s/%s", s.baseURL, s.bucket, key)
}
