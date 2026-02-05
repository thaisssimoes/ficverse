@echo off
echo ========================================
echo   Verificando PostgreSQL
echo ========================================
echo.

echo [1/4] Verificando se PostgreSQL esta instalado...
psql --version >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] PostgreSQL esta instalado!
    psql --version
) else (
    echo [X] PostgreSQL NAO esta instalado
    echo.
    echo Para instalar:
    echo 1. Acesse: https://www.postgresql.org/download/windows/
    echo 2. Baixe o instalador
    echo 3. Execute e siga as instrucoes
    echo 4. Anote a senha que voce definir!
    echo.
    echo Ou leia: SETUP-WITHOUT-DOCKER.md
    goto :end
)
echo.

echo [2/4] Verificando se o servico esta rodando...
sc query postgresql-x64-14 | findstr "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Servico PostgreSQL esta rodando!
) else (
    echo [!] Servico PostgreSQL NAO esta rodando
    echo Tentando iniciar...
    net start postgresql-x64-14 >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Servico iniciado com sucesso!
    ) else (
        echo [X] Falha ao iniciar servico
        echo Execute como Administrador: net start postgresql-x64-14
    )
)
echo.

echo [3/4] Verificando se o banco de dados existe...
psql -U postgres -lqt | findstr "fanfic_platform" >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Banco de dados 'fanfic_platform' existe!
) else (
    echo [!] Banco de dados 'fanfic_platform' NAO existe
    echo.
    echo Para criar o banco:
    echo 1. Execute: psql -U postgres
    echo 2. Digite: CREATE DATABASE fanfic_platform;
    echo 3. Digite: \q
    echo.
    echo Ou leia: SETUP-WITHOUT-DOCKER.md
)
echo.

echo [4/4] Verificando arquivo .env...
if exist "backend\.env" (
    echo [OK] Arquivo backend\.env existe!
    echo.
    echo Verifique se a senha esta correta em backend\.env:
    type backend\.env | findstr "DATABASE_URL"
) else (
    echo [!] Arquivo backend\.env NAO existe
    echo.
    echo Para criar:
    echo 1. cd backend
    echo 2. copy .env.example .env
    echo 3. Edite .env e coloque sua senha do PostgreSQL
)
echo.

:end
echo ========================================
echo   Verificacao completa!
echo ========================================
echo.
echo Proximos passos:
echo 1. Se tudo estiver OK, execute: cd backend ^&^& go run main.go
echo 2. Se algo falhou, leia: SETUP-WITHOUT-DOCKER.md
echo.
pause
