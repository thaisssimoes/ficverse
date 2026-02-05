# Setup Sem Docker - PostgreSQL Local

Este guia mostra como configurar a aplicação **sem usar Docker**, instalando o PostgreSQL diretamente no Windows.

## 📥 Passo 1: Instalar PostgreSQL

### Opção 1: Instalador Oficial (Recomendado)

1. **Baixe o PostgreSQL:**
   - Acesse: https://www.postgresql.org/download/windows/
   - Clique em "Download the installer"
   - Baixe a versão 14 ou superior (64-bit)

2. **Execute o instalador:**
   - Clique duas vezes no arquivo baixado
   - Clique em "Next" nas telas iniciais

3. **Configuração importante:**
   - **Password:** Digite uma senha (ex: `postgres`)
   - **⚠️ ANOTE ESSA SENHA!** Você vai precisar dela
   - **Port:** Deixe `5432` (padrão)
   - **Locale:** Deixe o padrão

4. **Finalize a instalação:**
   - Clique em "Next" até o final
   - Desmarque "Launch Stack Builder" no final
   - Clique em "Finish"

### Opção 2: Chocolatey (Se você usa)

```powershell
choco install postgresql14
```

---

## 🔧 Passo 2: Verificar Instalação

Abra um novo terminal (PowerShell ou CMD):

```bash
# Verificar se PostgreSQL está instalado
psql --version
```

Deve mostrar algo como:
```
psql (PostgreSQL) 14.x
```

Se não funcionar, adicione ao PATH:
- Procure por "Variáveis de Ambiente" no Windows
- Adicione: `C:\Program Files\PostgreSQL\14\bin`

---

## 🗄️ Passo 3: Criar o Banco de Dados

### Método 1: Usando pgAdmin (Interface Gráfica)

1. **Abra o pgAdmin 4:**
   - Procure "pgAdmin 4" no menu Iniciar
   - Digite a senha que você criou na instalação

2. **Crie o banco:**
   - Clique com botão direito em "Databases"
   - Selecione "Create" → "Database"
   - Nome: `fanfic_platform`
   - Clique em "Save"

### Método 2: Usando Terminal (Linha de Comando)

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar o banco de dados
CREATE DATABASE fanfic_platform;

# Verificar se foi criado
\l

# Sair
\q
```

Se pedir senha, use a senha que você definiu na instalação.

---

## ⚙️ Passo 4: Configurar o Backend

1. **Navegue até a pasta backend:**
   ```bash
   cd backend
   ```

2. **Verifique se existe o arquivo `.env`:**
   ```bash
   dir .env
   ```

3. **Se NÃO existir, crie a partir do exemplo:**
   ```bash
   copy .env.example .env
   ```

4. **Edite o arquivo `.env`:**
   
   Abra `backend/.env` em um editor de texto e atualize:

   ```env
   # Substitua 'postgres' pela senha que você definiu
   DATABASE_URL=postgres://postgres:SUA_SENHA_AQUI@localhost:5432/fanfic_platform?sslmode=disable
   
   JWT_SECRET=meu-super-secret-key-change-in-production
   PORT=8080
   ```

   **Exemplo:**
   ```env
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/fanfic_platform?sslmode=disable
   JWT_SECRET=meu-super-secret-key-change-in-production
   PORT=8080
   ```

---

## 🚀 Passo 5: Iniciar a Aplicação

### Terminal 1: Backend

```bash
cd backend
go run main.go
```

Você deve ver:
```
2026/02/01 23:30:00 Database connected successfully
2026/02/01 23:30:00 Running migrations...
2026/02/01 23:30:00 Server starting on :8080
```

✅ **Backend rodando em http://localhost:8080**

### Terminal 2: Frontend

Abra um **novo terminal**:

```bash
cd frontend
python -m http.server 3000
```

✅ **Frontend rodando em http://localhost:3000**

---

## ✅ Passo 6: Testar

1. **Teste o backend:**
   ```bash
   curl http://localhost:8080/health
   ```
   
   Deve retornar:
   ```json
   {"status":"ok"}
   ```

2. **Teste o frontend:**
   - Abra: http://localhost:3000
   - Deve mostrar a página inicial

3. **Crie uma conta:**
   - Clique em "Register"
   - Preencha os dados
   - Teste o login

---

## 🛑 Como Parar

### Parar Backend e Frontend
Nos terminais onde estão rodando:
- Pressione `Ctrl + C`

### Parar PostgreSQL (Opcional)
Se quiser parar o PostgreSQL:

**Opção 1: Services**
1. Pressione `Win + R`
2. Digite: `services.msc`
3. Procure por "postgresql-x64-14"
4. Clique com botão direito → "Stop"

**Opção 2: Terminal (como Admin)**
```bash
net stop postgresql-x64-14
```

Para iniciar novamente:
```bash
net start postgresql-x64-14
```

---

## 🔄 Reiniciar PostgreSQL

Se o PostgreSQL parar de funcionar:

```bash
# Parar
net stop postgresql-x64-14

# Aguardar 2 segundos
timeout /t 2

# Iniciar
net start postgresql-x64-14
```

---

## 🧪 Executar Testes

Com o PostgreSQL local, os testes funcionam normalmente:

```bash
cd backend
go test ./... -v
```

---

## ❌ Problemas Comuns

### "psql: command not found"

**Solução:** Adicione ao PATH:
1. Procure "Variáveis de Ambiente" no Windows
2. Edite "Path" nas variáveis do sistema
3. Adicione: `C:\Program Files\PostgreSQL\14\bin`
4. Reinicie o terminal

### "password authentication failed"

**Solução:** Verifique a senha no `.env`:
```env
DATABASE_URL=postgres://postgres:SUA_SENHA_CORRETA@localhost:5432/fanfic_platform?sslmode=disable
```

### "database does not exist"

**Solução:** Crie o banco:
```bash
psql -U postgres
CREATE DATABASE fanfic_platform;
\q
```

### "could not connect to server"

**Solução:** Inicie o serviço PostgreSQL:
```bash
net start postgresql-x64-14
```

### "port 5432 already in use"

**Solução:** Algo já está usando a porta. Verifique:
```bash
netstat -ano | findstr :5432
```

---

## 📊 Comparação: Docker vs Local

| Aspecto | Docker | PostgreSQL Local |
|---------|--------|------------------|
| Instalação | Mais complexa | Mais simples |
| Uso de recursos | Mais pesado | Mais leve |
| Isolamento | Melhor | Menor |
| Facilidade | Requer Docker Desktop | Direto no Windows |
| **Recomendação** | Produção/Equipes | Desenvolvimento solo |

---

## ✅ Checklist Final

- [ ] PostgreSQL instalado
- [ ] Banco `fanfic_platform` criado
- [ ] Arquivo `.env` configurado com senha correta
- [ ] Backend inicia sem erros
- [ ] Frontend carrega no navegador
- [ ] Consegue criar conta e fazer login

**🎉 Se todos os itens estão marcados, está funcionando!**

---

## 🔗 Links Úteis

- **Download PostgreSQL:** https://www.postgresql.org/download/windows/
- **Documentação PostgreSQL:** https://www.postgresql.org/docs/
- **pgAdmin (Interface Gráfica):** Instalado junto com PostgreSQL

---

## 💡 Dica

Se você conseguir fazer o Docker funcionar no futuro, pode voltar a usá-lo. Mas para desenvolvimento, o PostgreSQL local funciona perfeitamente e é mais simples!
