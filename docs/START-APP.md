# Como Iniciar a Aplicação

## 🔀 Escolha Seu Método

### Opção A: Com Docker (Recomendado para quem já tem Docker)
- Requer Docker Desktop instalado e funcionando
- Mais isolado e fácil de limpar

### Opção B: Sem Docker (Mais Simples)
- Usa PostgreSQL instalado localmente no Windows
- Mais leve e direto
- **👉 Se o Docker não está funcionando, use esta opção!**

**📖 Guia completo sem Docker:** [SETUP-WITHOUT-DOCKER.md](SETUP-WITHOUT-DOCKER.md)

---

## 📋 Checklist Antes de Começar

### Para Opção A (Com Docker):
- [ ] Docker Desktop instalado e **RODANDO** (ícone verde)
- [ ] Go 1.21+ instalado
- [ ] Python instalado

### Para Opção B (Sem Docker):
- [ ] PostgreSQL instalado localmente
- [ ] Banco `fanfic_platform` criado
- [ ] Go 1.21+ instalado
- [ ] Python instalado

**💡 Dica:** Execute `check-postgres.bat` para verificar se o PostgreSQL está configurado!

---

## 🚀 Passo a Passo

---

## 🅰️ OPÇÃO A: Com Docker

### 1️⃣ Abrir Docker Desktop

**⚠️ MUITO IMPORTANTE!**

1. Procure "Docker Desktop" no menu Iniciar
2. Clique para abrir
3. **Aguarde até o ícone ficar verde** (pode levar 1-2 minutos)
4. Verifique se está rodando:
   ```bash
   docker ps
   ```
   Se aparecer uma tabela (mesmo vazia), está funcionando!

---

### 2️⃣ Iniciar PostgreSQL

Abra um terminal (PowerShell ou CMD) na pasta do projeto:

```bash
# Inicie o PostgreSQL com Docker
docker-compose up -d

# Aguarde 5 segundos para inicializar
timeout /t 5

# Verifique se está rodando
docker ps
```

Você deve ver algo como:
```
CONTAINER ID   IMAGE                COMMAND                  STATUS
abc123def456   postgres:14-alpine   "docker-entrypoint.s…"   Up 10 seconds
```

**Continue para o Passo 3️⃣**

---

## 🅱️ OPÇÃO B: Sem Docker (PostgreSQL Local)

### 1️⃣ Verificar PostgreSQL

Execute o script de verificação:

```bash
check-postgres.bat
```

Este script vai verificar:
- ✅ Se PostgreSQL está instalado
- ✅ Se o serviço está rodando
- ✅ Se o banco `fanfic_platform` existe
- ✅ Se o arquivo `.env` está configurado

### 2️⃣ Se PostgreSQL NÃO está instalado

**Siga o guia completo:** [SETUP-WITHOUT-DOCKER.md](SETUP-WITHOUT-DOCKER.md)

**Resumo rápido:**
1. Baixe: https://www.postgresql.org/download/windows/
2. Instale (anote a senha!)
3. Crie o banco:
   ```bash
   psql -U postgres
   CREATE DATABASE fanfic_platform;
   \q
   ```
4. Configure o `.env`:
   ```bash
   cd backend
   copy .env.example .env
   # Edite .env e coloque sua senha
   ```

### 2️⃣ Se PostgreSQL JÁ está instalado

Certifique-se de que está rodando:

```bash
# Verificar status
sc query postgresql-x64-14

# Se não estiver rodando, inicie:
net start postgresql-x64-14
```

**Continue para o Passo 3️⃣**

---

### 3️⃣ Iniciar Backend

**Abra um NOVO terminal** (deixe o anterior aberto):

```bash
# Entre na pasta backend
cd backend

# Execute o servidor
go run main.go
```

Você deve ver:
```
2026/02/01 23:20:00 Database connected successfully
2026/02/01 23:20:00 Server starting on :8080
```

**✅ Backend rodando em http://localhost:8080**

**⚠️ Deixe este terminal aberto!**

---

### 4️⃣ Iniciar Frontend

**Abra um NOVO terminal** (deixe os anteriores abertos):

```bash
# Entre na pasta frontend
cd frontend

# Inicie o servidor HTTP
python -m http.server 3000
```

Você deve ver:
```
Serving HTTP on :: port 3000 (http://[::]:3000/) ...
```

**✅ Frontend rodando em http://localhost:3000**

**⚠️ Deixe este terminal aberto!**

---

### 5️⃣ Acessar a Aplicação

Abra seu navegador e acesse:

**🌐 http://localhost:3000**

Você deve ver a página inicial da plataforma de fanfics!

---

## 🎯 Resumo dos Terminais

Você deve ter **3 terminais abertos**:

| Terminal | Comando | Status |
|----------|---------|--------|
| Terminal 1 | `docker-compose up -d` | ✅ Pode fechar após executar |
| Terminal 2 | `cd backend && go run main.go` | ⚠️ **Manter aberto** |
| Terminal 3 | `cd frontend && python -m http.server 3000` | ⚠️ **Manter aberto** |

---

## 🧪 Testar se Está Funcionando

### Teste 1: Backend Health Check

Abra um navegador ou terminal:
```bash
curl http://localhost:8080/health
```

Deve retornar:
```json
{"status":"ok"}
```

### Teste 2: Frontend

Acesse: http://localhost:3000

Deve mostrar a página inicial com:
- Logo/título da plataforma
- Opções de Login/Register
- Lista de fanfics (pode estar vazia)

### Teste 3: Criar Conta

1. Clique em "Register"
2. Preencha:
   - Username: `teste`
   - Email: `teste@email.com`
   - Password: `senha123`
3. Clique em "Register"
4. Deve redirecionar para login ou homepage

---

## 🛑 Como Parar Tudo

### Parar Backend e Frontend
Nos terminais onde estão rodando:
- Pressione `Ctrl + C`

### Parar PostgreSQL
```bash
docker-compose down
```

### Parar Docker Desktop
- Clique com botão direito no ícone do Docker
- Selecione "Quit Docker Desktop"

---

## 🔄 Reiniciar Tudo

Se algo der errado, reinicie tudo:

```bash
# 1. Parar tudo
docker-compose down -v

# 2. Fechar todos os terminais (Ctrl+C)

# 3. Iniciar novamente
docker-compose up -d
timeout /t 5

# 4. Backend (novo terminal)
cd backend
go run main.go

# 5. Frontend (novo terminal)
cd frontend
python -m http.server 3000
```

---

## ❌ Problemas Comuns

### "Docker daemon is not running"
**Solução:** Abra o Docker Desktop e aguarde inicializar

### "failed to connect to database"
**Solução:** 
```bash
docker-compose down -v
docker-compose up -d
timeout /t 10
```

### "go.mod file not found"
**Solução:** Certifique-se de estar na pasta `backend`:
```bash
cd backend
go run main.go
```

### "port already in use"
**Solução:** Algo já está usando a porta. Mude a porta ou pare o outro serviço:
```bash
# Para backend (porta 8080)
# Encontre o processo: netstat -ano | findstr :8080
# Mate o processo: taskkill /PID <numero> /F

# Para frontend (porta 3000)
# Use outra porta: python -m http.server 3001
```

---

## 📚 Próximos Passos

Agora que tudo está rodando:

1. **Explore a aplicação:**
   - Crie uma conta
   - Publique uma fanfic
   - Adicione capítulos
   - Teste o modo interativo

2. **Execute os testes:**
   ```bash
   test-all.bat
   ```

3. **Leia a documentação:**
   - `README.md` - Visão geral
   - `TESTING.md` - Guia de testes
   - `TROUBLESHOOTING.md` - Solução de problemas

---

## ✅ Checklist Final

- [ ] Docker Desktop aberto e rodando (ícone verde)
- [ ] PostgreSQL rodando (`docker ps` mostra container)
- [ ] Backend rodando (http://localhost:8080/health retorna OK)
- [ ] Frontend rodando (http://localhost:3000 carrega)
- [ ] Consegue criar conta e fazer login

**🎉 Se todos os itens estão marcados, está tudo funcionando!**
