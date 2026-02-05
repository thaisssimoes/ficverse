@echo off
echo ========================================
echo Recompilando Backend com Correcoes
echo ========================================
echo.

cd backend

echo [1/3] Limpando executaveis antigos...
if exist fanfic-platform.exe del fanfic-platform.exe
if exist interactive-fanfic-platform.exe del interactive-fanfic-platform.exe

echo [2/3] Compilando novo executavel...
go build -o fanfic-platform.exe

if %ERRORLEVEL% EQU 0 (
    echo [3/3] Compilacao concluida com sucesso!
    echo.
    echo ========================================
    echo Backend recompilado!
    echo ========================================
    echo.
    echo Para iniciar o servidor:
    echo   cd backend
    echo   .\fanfic-platform.exe
    echo.
) else (
    echo.
    echo ========================================
    echo ERRO na compilacao!
    echo ========================================
    echo.
    echo Verifique os erros acima.
)

cd ..
pause
