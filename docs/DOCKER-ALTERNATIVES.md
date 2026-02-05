# Alternativas ao Docker

Se o Docker não está funcionando, você tem várias opções para rodar a aplicação.

## 🎯 Opção Recomendada: PostgreSQL Local

**Vantagens:**
- ✅ Mais simples de configurar
- ✅ Mais leve (não precisa do Docker Desktop)
- ✅ Funciona perfeitamente para desenvolvimento
- ✅ Mais rápido de iniciar

**Desvantagens:**
- ❌ PostgreSQL fica instalado no seu sistema
- ❌ Menos isolado que Docker

### Como Fazer

**📖 Guia Completo:** [SETUP-WITHOUT-DOCKER.md](SETUP-WITHOUT-DOCKER.md)

**Resumo:**
1. Instale PostgreSQL: https://www.postgresql.org/download/windows/
2. Crie o banco: `CREATE DATABASE fanfic_platform;`
3. Configure o `.env` com sua senha
4. Execute: `cd backend && go run main.go`

**Script de Verificação:**
```bash
check-postgres.bat
```

---

## 🔧 Opção 2: Consertar o Docker

Se você quer usar Docker, tente estas soluções:

### Solução 1: Reiniciar Docker Desktop

1. **Feche completamente o Docker Desktop:**
   - Clique com botão direito no ícone do Docker (bandeja do sistema)
   - Selecione "Quit Docker Desktop"
   - Aguarde fechar completamente

2. **Abra novamente:**
   - Procure "Docker Desktop" no menu Iniciar
   - Abra e aguarde inicializar (1-2 minutos)
   - Verifique: `docker ps`

### Solução 2: Resetar Docker Desktop

1. **Abra Docker Desktop**
2. **Vá em Settings (ícone de engrenagem)**
3. **Clique em "Troubleshoot"**
4. **Clique em "Reset to factory defaults"**
5. **Confirme e aguarde**
6. **Reinicie o computador**
7. **Abra Docker Desktop novamente**

### Solução 3: Reinstalar Docker Desktop

1. **Desinstale:**
   - Painel de Controle → Programas → Desinstalar
   - Procure "Docker Desktop"
   - Desinstale

2. **Baixe novamente:**
   - https://www.docker.com/products/docker-desktop/
   - Baixe a versão para Windows

3. **Instale:**
   - Execute o instalador
   - Siga as instruções
   - Reinicie o computador se solicitado

4. **Configure:**
   - Abra Docker Desktop
   - Aceite os termos
   - Aguarde inicializar

### Solução 4: Verificar WSL2 (Windows Subsystem for Linux)

Docker Desktop no Windows usa WSL2. Verifique se está instalado:

```powershell
wsl --list --verbose
```

Se não estiver instalado:

```powershell
# Execute como Administrador
wsl --install
```

Reinicie o computador após a instalação.

---

## 🐘 Opção 3: PostgreSQL Portátil

Se não quiser instalar PostgreSQL no sistema:

### Usando PostgreSQL Portable

1. **Baixe:**
   - https://sourceforge.net/projects/postgresqlportable/
   - Versão 14 ou superior

2. **Extraia:**
   - Extraia para uma pasta (ex: `C:\PostgreSQLPortable`)

3. **Inicie:**
   - Execute `PostgreSQLPortable.exe`
   - Aguarde inicializar

4. **Configure:**
   - Porta: 5432
   - Usuário: postgres
   - Senha: (defina uma)

5. **Crie o banco:**
   ```bash
   psql -U postgres -h localhost -p 5432
   CREATE DATABASE fanfic_platform;
   \q
   ```

6. **Configure o `.env`:**
   ```env
   DATABASE_URL=postgres://postgres:SUA_SENHA@localhost:5432/fanfic_platform?sslmode=disable
   ```

---

## 🌐 Opção 4: PostgreSQL na Nuvem (Grátis)

Se não quiser instalar nada localmente, existem várias opções gratuitas:

### Opção 4A: Supabase (Recomendado)

1. **Crie uma conta:**
   - https://supabase.com/
   - Plano gratuito: 500MB, 2 projetos

2. **Crie um projeto:**
   - Clique em "New Project"
   - Nome: fanfic-platform
   - Database Password: (crie uma senha forte)
   - Região: escolha a mais próxima

3. **Copie a connection string:**
   - Vá em "Settings" → "Database"
   - Copie a "Connection string" (modo "URI")
   - Substitua `[YOUR-PASSWORD]` pela senha que você criou

4. **Configure o `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.xxxxx.supabase.co:5432/postgres
   ```

5. **Execute:**
   ```bash
   cd backend
   go run main.go
   ```

**Vantagens:**
- ✅ 500MB gratuito (muito espaço!)
- ✅ Interface moderna e fácil
- ✅ Backup automático
- ✅ Ferramentas extras (Auth, Storage, etc.)

### Opção 4B: Neon (Serverless)

1. **Crie uma conta:**
   - https://neon.tech/
   - Plano gratuito: 3GB, 1 projeto

2. **Crie um projeto:**
   - Clique em "Create Project"
   - Nome: fanfic-platform
   - Região: escolha a mais próxima

3. **Copie a connection string:**
   - Na dashboard, copie a "Connection string"

4. **Configure o `.env`:**
   ```env
   DATABASE_URL=postgresql://usuario:senha@ep-xxx.region.aws.neon.tech/neondb
   ```

**Vantagens:**
- ✅ 3GB gratuito
- ✅ Serverless (escala automaticamente)
- ✅ Muito rápido

### Opção 4C: Railway

1. **Crie uma conta:**
   - https://railway.app/
   - Plano gratuito: $5 de crédito/mês

2. **Crie um projeto:**
   - Clique em "New Project"
   - Selecione "Provision PostgreSQL"

3. **Copie as credenciais:**
   - Clique no PostgreSQL criado
   - Vá em "Connect"
   - Copie a "Postgres Connection URL"

4. **Configure o `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:senha@containers-us-west-xxx.railway.app:7432/railway
   ```

**Vantagens:**
- ✅ Fácil de usar
- ✅ Deploy automático
- ✅ Bom para protótipos

### Opção 4D: Render

1. **Crie uma conta:**
   - https://render.com/
   - Plano gratuito: 90 dias, depois expira

2. **Crie um PostgreSQL:**
   - Dashboard → "New" → "PostgreSQL"
   - Nome: fanfic-platform
   - Plano: Free

3. **Copie a connection string:**
   - Na página do banco, copie "External Database URL"

4. **Configure o `.env`:**
   ```env
   DATABASE_URL=postgresql://usuario:senha@dpg-xxx.oregon-postgres.render.com/banco
   ```

**Vantagens:**
- ✅ Simples de configurar
- ✅ Bom para testes

**Desvantagens:**
- ❌ Expira após 90 dias (precisa recriar)

---

### Comparação das Opções na Nuvem

| Serviço | Espaço Grátis | Limite de Tempo | Velocidade | Recomendação |
|---------|---------------|-----------------|------------|--------------|
| **Supabase** | 500MB | Ilimitado | ⚡⚡⚡ Rápido | **Melhor opção** |
| **Neon** | 3GB | Ilimitado | ⚡⚡⚡ Muito rápido | Excelente |
| **Railway** | $5/mês | Ilimitado | ⚡⚡ Médio | Bom |
| **Render** | Ilimitado | 90 dias | ⚡⚡ Médio | Apenas testes |

**Recomendação:** Use **Supabase** - é gratuito, tem bastante espaço, e não expira!

---

## 📊 Comparação das Opções

| Opção | Dificuldade | Velocidade | Isolamento | Espaço | Recomendado Para |
|-------|-------------|------------|------------|--------|------------------|
| **PostgreSQL Local** | ⭐ Fácil | ⚡⚡⚡ Rápido | 🔒 Médio | ∞ Ilimitado | **Desenvolvimento** |
| Docker | ⭐⭐ Médio | ⚡⚡ Médio | 🔒🔒 Alto | ∞ Ilimitado | Produção/Equipes |
| PostgreSQL Portátil | ⭐ Fácil | ⚡⚡⚡ Rápido | 🔒 Baixo | ∞ Ilimitado | Testes rápidos |
| **Supabase** | ⭐ Muito Fácil | ⚡⚡ Médio | 🔒🔒 Alto | 💾 500MB | **Protótipos/Demos** |
| Neon | ⭐ Muito Fácil | ⚡⚡⚡ Rápido | 🔒🔒 Alto | 💾 3GB | Protótipos |
| Railway | ⭐ Fácil | ⚡⚡ Médio | 🔒🔒 Alto | 💾 Variável | Testes |
| Render | ⭐ Fácil | ⚡⚡ Médio | 🔒🔒 Alto | 💾 Ilimitado | Testes curtos |

---

## 🎯 Recomendação Final

**Para você agora:**

1. **Use PostgreSQL Local** (mais simples e rápido)
   - Siga: [SETUP-WITHOUT-DOCKER.md](SETUP-WITHOUT-DOCKER.md)
   - Execute: `check-postgres.bat` para verificar

2. **Se quiser consertar o Docker:**
   - Tente as soluções acima
   - Mas não é necessário para desenvolvimento

3. **Depois que estiver funcionando:**
   - Você pode voltar ao Docker se quiser
   - Mas o PostgreSQL local funciona perfeitamente!

---

## ✅ Próximos Passos

1. **Escolha uma opção acima**
2. **Configure o PostgreSQL**
3. **Execute:** `cd backend && go run main.go`
4. **Teste:** http://localhost:8080/health

**🎉 Pronto para desenvolver!**
