@echo off
echo ========================================
echo   Interactive Fanfic Platform - Tests
echo ========================================
echo.

echo [1/3] Verificando PostgreSQL...
docker ps | findstr fanfic_postgres >nul
if %errorlevel% neq 0 (
    echo PostgreSQL nao esta rodando. Iniciando...
    docker-compose up -d
    timeout /t 5 /nobreak >nul
) else (
    echo PostgreSQL esta rodando!
)
echo.

echo [2/3] Executando testes do Backend...
cd backend
go test ./... -v -cover
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Alguns testes do backend falharam!
    cd ..
    exit /b 1
)
cd ..
echo.

echo [3/3] Gerando relatorio de cobertura...
cd backend
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
echo Relatorio de cobertura gerado: backend/coverage.html
cd ..
echo.

echo ========================================
echo   Todos os testes passaram! ✓
echo ========================================
echo.
echo Para testar o frontend:
echo   1. Inicie o backend: cd backend ^&^& go run main.go
echo   2. Inicie o frontend: cd frontend ^&^& python -m http.server 3000
echo   3. Abra os testes no navegador:
echo      - http://localhost:3000/tests/homepage.test.html
echo      - http://localhost:3000/tests/fanfic-detail.test.html
echo      - http://localhost:3000/tests/questions-modal.test.html
echo      - http://localhost:3000/tests/chapter-reader.test.html
echo      - http://localhost:3000/tests/auth-forms.test.html
echo      - http://localhost:3000/tests/dashboard.test.html
echo      - http://localhost:3000/tests/comments.test.html
echo      - http://localhost:3000/tests/answer-editor.test.html
echo.
