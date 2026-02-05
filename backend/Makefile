# Makefile for Interactive Fanfic Platform Backend

.PHONY: help build run test clean migrate

help:
	@echo "Available commands:"
	@echo "  make build    - Build the application"
	@echo "  make run      - Run the application"
	@echo "  make test     - Run tests"
	@echo "  make clean    - Clean build artifacts"
	@echo "  make migrate  - Run database migrations"

build:
	go build -o fanfic-platform.exe main.go

run:
	go run main.go

test:
	go test ./... -v

clean:
	rm -f fanfic-platform.exe

migrate:
	@echo "Migrations run automatically on startup"
	go run main.go
