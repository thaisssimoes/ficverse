# Guia de Solução de Problemas

## ❌ Erro: "go.mod file not found"

### Problema
```
backend\main.go:7:2: no required module provides package github.com/gin-gonic/gin: 
go.mod file not found in current directory or any parent directory
```

### Causa
Você está executando o comando `go run` da pasta errada.

### Solução
```bash
# ❌ ERRADO - da raiz do projeto
go run .\backend\main.go

# ✅ CORRETO - de dentro da pasta backend
cd backend
go run main.go
```

---

## ❌ Erro: "failed to connect to database"

### Problema
```
failed to connect to `host=localhost user=postgres database=fanfic_platform`: 
dial error (dial tcp 127.0.0.1:5432: connectex: No connection could be made 
because the target machine actively refused it.)
```

### Causa
O PostgreSQL não está rodando.

### Solução

#### Opção 1: Usando Docker (Recomendado)

1. **Inicie o Docker Desktop:**
   - Abra o Docker Desktop
   - Aguarde até que o ícone fique verde
   - Verifique se está rodando: `docker ps`

2. **Inicie o PostgreSQL:**
   ```bash
   docker-compose up -d
   ```

3. **Verifique se está rodando:**
   ```bash
   docker ps
   ```
   
   Você deve ver algo como:
   ```
   CONTAINER ID   IMAGE                COMMAND                  STATUS
   abc123def456   postgres:14-alpine   "docker-entrypoint.s…"   Up 5 seconds
   ```

4. **Aguarde alguns segundos** para o PostgreSQL inicializar completamente

5. **Tente novamente:**
   ```bash
   cd backend
   go run main.go
   ```

#### Opção 2: PostgreSQL Local

Se você tem PostgreSQL instalado localmente:

1. **Inicie o serviço PostgreSQL:**
   - Windows: Abra "Services" e inicie "PostgreSQL"
   - Ou use: `net start postgresql-x64-14`

2. **Crie o banco de dados:**
   ```sql
   CREATE DATABASE fanfic_platform;
   ```

3. **Atualize o `.env`:**
   ```
   DATABASE_URL=postgres://postgres:sua_senha@localhost:5432/fanfic_platform?sslmode=disable
   ```

---

## ❌ Erro: "docker daemon is not running"

### Problema
```
error during connect: this error may indicate that the docker daemon is not running
```

### Causa
O Docker Desktop não está rodando.

### Solução

1. **Abra o Docker Desktop**
   - Procure por "Docker Desktop" no menu Iniciar
   - Clique para abrir

2. **Aguarde a inicialização**
   - Espere até o ícone do Docker na bandeja do sistema ficar verde
   - Pode levar 1-2 minutos

3. **Verifique se está rodando:**
   ```bash
   docker --version
   docker ps
   ```

4. **Tente novamente:**
   ```bash
   docker-compose up -d
   ```

---

## ❌ Erro: "port 5432 is already in use"

### Problema
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: Only one usage 
of each socket address (protocol/network address/port) is normally permitted.
```

### Causa
Você já tem um PostgreSQL rodando na porta 5432 (provavelmente instalado localmente).

### Solução

#### Opção 1: Usar o PostgreSQL Local

1. **Pare o Docker:**
   ```bash
   docker-compose down
   ```

2. **Use o PostgreSQL local:**
   - Certifique-se de que o serviço está rodando
   - Crie o banco: `CREATE DATABASE fanfic_platform;`
   - Atualize o `.env` com suas credenciais

#### Opção 2: Mudar a Porta do Docker

1. **Edite `docker-compose.yml`:**
   ```yaml
   ports:
     - "5433:5432"  # Mude de 5432 para 5433
   ```

2. **Atualize o `.env`:**
   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5433/fanfic_platform?sslmode=disable
   ```

3. **Reinicie:**
   ```bash
   docker-compose up -d
   ```

---

## ❌ Erro: "permission denied" ao executar scripts

### Problema
```
.\test-all.bat : File cannot be loaded because running scripts is disabled
```

### Causa
Política de execução do PowerShell.

### Solução

#### Opção 1: Executar com Bypass
```powershell
powershell -ExecutionPolicy Bypass -File .\test-all.bat
```

#### Opção 2: Mudar Política (Permanente)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Opção 3: Executar Comandos Manualmente
```bash
docker-compose up -d
cd backend
go test ./... -v
```

---

## ❌ Frontend não carrega

### Problema
Página em branco ou erro 404 ao acessar http://localhost:3000

### Solução

1. **Verifique se o servidor está rodando:**
   ```bash
   # Deve mostrar algo como:
   # Serving HTTP on :: port 3000 (http://[::]:3000/) ...
   ```

2. **Verifique a porta:**
   - Tente http://localhost:3000
   - Se não funcionar, tente http://127.0.0.1:3000

3. **Reinicie o servidor:**
   ```bash
   # Pare com Ctrl+C
   cd frontend
   python -m http.server 3000
   ```

4. **Verifique se Python está instalado:**
   ```bash
   python --version
   # ou
   python3 --version
   ```

---

## ❌ Testes falhando

### Problema
Alguns testes estão falhando.

### Solução

1. **Recrie o banco de dados:**
   ```bash
   docker-compose down -v
   docker-compose up -d
   # Aguarde 5 segundos
   ```

2. **Limpe o cache do Go:**
   ```bash
   cd backend
   go clean -testcache
   go test ./... -v
   ```

3. **Verifique as dependências:**
   ```bash
   cd backend
   go mod tidy
   go mod download
   ```

---

## ❌ Erro: "cannot find package"

### Problema
```
cannot find package "github.com/gin-gonic/gin"
```

### Solução

```bash
cd backend
go mod download
go mod tidy
```

---

## ❌ CORS Error no Frontend

### Problema
```
Access to fetch at 'http://localhost:8080/api/...' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

### Causa
O backend não está configurado para aceitar requisições do frontend.

### Solução

Isso já deve estar configurado no código, mas se o erro persistir:

1. **Verifique se o backend está rodando:**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Reinicie o backend:**
   ```bash
   cd backend
   go run main.go
   ```

---

## ❌ Erro: "JWT token invalid"

### Problema
Requisições autenticadas retornam 401 Unauthorized.

### Solução

1. **Faça login novamente:**
   - O token pode ter expirado
   - Faça logout e login novamente

2. **Limpe o localStorage:**
   - Abra o Console (F12)
   - Digite: `localStorage.clear()`
   - Recarregue a página

---

## ❌ Imagens não carregam

### Problema
Capas de fanfics não aparecem.

### Solução

1. **Verifique a pasta de uploads:**
   ```bash
   # Deve existir: backend/uploads/
   ```

2. **Verifique permissões:**
   - A pasta `backend/uploads/` deve ter permissão de escrita

3. **Verifique o tamanho da imagem:**
   - Máximo: 5MB
   - Formatos aceitos: JPG, PNG, GIF

---

## 🔧 Comandos Úteis para Diagnóstico

### Verificar Status Geral

```bash
# Docker está rodando?
docker ps

# PostgreSQL está acessível?
docker exec -it fanfic_postgres psql -U postgres -d fanfic_platform -c "SELECT 1;"

# Backend está respondendo?
curl http://localhost:8080/health

# Frontend está servindo?
curl http://localhost:3000
```

### Logs

```bash
# Logs do PostgreSQL
docker logs fanfic_postgres

# Logs do backend (se rodando em background)
# Veja o terminal onde executou 'go run main.go'
```

### Resetar Tudo

```bash
# Parar tudo
docker-compose down -v

# Limpar cache do Go
cd backend
go clean -testcache
go clean -cache

# Reiniciar
docker-compose up -d
# Aguarde 5 segundos
go run main.go
```

---

## 📞 Ainda com Problemas?

Se nenhuma solução acima funcionou:

1. **Verifique os logs** do backend e PostgreSQL
2. **Tente os comandos de diagnóstico** acima
3. **Recrie o ambiente** do zero:
   ```bash
   docker-compose down -v
   cd backend
   go clean -cache -testcache
   cd ..
   docker-compose up -d
   # Aguarde 10 segundos
   cd backend
   go run main.go
   ```

4. **Verifique as versões:**
   ```bash
   go version        # Deve ser 1.21+
   docker --version  # Deve estar instalado
   python --version  # Deve estar instalado
   ```
