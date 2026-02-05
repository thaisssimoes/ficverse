@echo off
echo ========================================
echo Debug - Upload de Capa
echo ========================================
echo.

echo [1] Verificando estrutura de diretorios...
if exist backend\uploads\covers (
    echo    OK - Diretorio backend\uploads\covers existe
) else (
    echo    CRIANDO - backend\uploads\covers
    mkdir backend\uploads\covers
)
echo.

echo [2] Verificando executavel do backend...
if exist backend\fanfic-platform.exe (
    echo    OK - backend\fanfic-platform.exe existe
    dir backend\fanfic-platform.exe | find "fanfic-platform.exe"
) else (
    echo    ERRO - backend\fanfic-platform.exe NAO encontrado
    echo    Execute: rebuild-backend.bat
)
echo.

echo [3] Verificando arquivos de teste...
if exist frontend\tests\cover-upload-test.html (
    echo    OK - Pagina de teste existe
) else (
    echo    ERRO - Pagina de teste NAO encontrada
)
echo.

echo [4] Listando arquivos de capa existentes...
if exist backend\uploads\covers\* (
    dir /b backend\uploads\covers
) else (
    echo    Nenhum arquivo de capa ainda
)
echo.

echo ========================================
echo Proximos Passos:
echo ========================================
echo 1. Se o executavel nao existe ou esta antigo:
echo    Execute: rebuild-backend.bat
echo.
echo 2. Inicie o backend:
echo    cd backend
echo    .\fanfic-platform.exe
echo.
echo 3. Abra a pagina de teste:
echo    frontend/tests/cover-upload-test.html
echo.
echo ========================================

pause
