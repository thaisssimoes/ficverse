@echo off
echo ========================================
echo   Property-Based Tests
echo ========================================
echo.
echo Executando todos os property-based tests...
echo (100 iteracoes por propriedade)
echo.

cd backend
go test ./... -v -run Property -count=1
cd ..

echo.
echo ========================================
echo   Property tests completos!
echo ========================================
