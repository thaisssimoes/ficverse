@echo off
echo ========================================
echo TESTE DE CRIACAO DE FANFIC
echo ========================================
echo.
echo Este teste verifica:
echo 1. Se o formulario de criacao de fanfic esta funcionando
echo 2. Se o layout da pagina inicial esta correto
echo.
echo INSTRUCOES:
echo 1. Abra o navegador em http://localhost:3000
echo 2. Faca login com suas credenciais
echo 3. Va para o Dashboard
echo 4. Clique em "Nova Fanfic"
echo 5. Preencha o formulario:
echo    - Titulo: Teste de Criacao
echo    - Categoria: Romance
echo    - Sinopse: Esta e uma fanfic de teste
echo 6. Clique em "Salvar como Rascunho" ou "Publicar"
echo 7. Verifique se a fanfic foi salva
echo.
echo 8. Volte para a pagina inicial (index.html)
echo 9. Verifique se:
echo    - O menu do usuario NAO esta sobrepondo o carrossel
echo    - A secao "Bombando Hoje" esta exibida corretamente
echo    - Nao ha elementos sobrepostos
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause > nul
start http://localhost:3000/dashboard.html
echo.
echo Navegador aberto. Siga as instrucoes acima.
echo.
pause
