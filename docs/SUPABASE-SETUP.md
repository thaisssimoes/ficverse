# 🚀 Configuração Completa do Supabase

## ✅ Passo 1: Pegar a Connection String

### 1.1 Acesse seu projeto no Supabase
- Vá para: https://supabase.com/dashboard
- Clique no seu projeto

### 1.2 Navegue até Database Settings
1. No menu lateral esquerdo, clique no ícone de **engrenagem** (Settings)
2. Clique em **"Database"**

### 1.3 Copie a Connection String
1. Role a página até encontrar **"Connection string"**
2. Clique na aba **"URI"** (não use "Session mode")
3. Você verá algo assim:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```
4. **Clique no ícone de copiar** (📋) ao lado da string
5. **⚠️ IMPORTANTE:** A string tem `[YOUR-PASSWORD]` - você precisa substituir isso pela senha real!

### 1.4 Encontre sua senha
- Se você **anotou a senha** quando criou o projeto, use ela
- Se você **esqueceu a senha**:
  1. Vá em "Database" → "Database Password"
  2. Clique em "Reset Database Password"
  3. Anote a nova senha!

---

## ✅ Passo 2: Configurar o Backend

### 2.1 Abra o arquivo .env

O arquivo já foi criado em: `backend/.env`

Abra ele em um editor de texto (Notepad, VS Code, etc.)

### 2.2 Cole sua Connection String

Substitua a linha `DATABASE_URL=...` pela sua connection string do Supabase.

**Exemplo ANTES (não funciona):**
```env
DATABASE_URL=postgresql://postgres.xxxxx:[SUA-SENHA-AQUI]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Exemplo DEPOIS (funciona):**
```env
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:MinhaSenh@123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2.3 Salve o arquivo

Salve e feche o editor.

---

## ✅ Passo 3: Testar a Conexão

### 3.1 Abra um terminal na pasta do projeto

```bash
cd backend
```

### 3.2 Execute o backend

```bash
go run main.go
```

### 3.3 Verifique os logs

Você deve ver algo como:
```
2026/02/01 23:45:00 Database connected successfully
2026/02/01 23:45:00 Running migrations...
2026/02/01 23:45:01 Server starting on :8080
```

✅ **Se você viu "Database connected successfully", está funcionando!**

❌ **Se você viu um erro**, veja a seção de troubleshooting abaixo.

---

## ✅ Passo 4: Iniciar o Frontend

### 4.1 Abra um NOVO terminal

Deixe o backend rodando e abra outro terminal.

### 4.2 Navegue até a pasta frontend

```bash
cd frontend
```

### 4.3 Inicie o servidor

```bash
python -m http.server 3000
```

### 4.4 Acesse no navegador

Abra: **http://localhost:3000**

---

## ✅ Passo 5: Testar a Aplicação

### 5.1 Teste o backend

Em outro terminal ou navegador:
```bash
curl http://localhost:8080/health
```

Deve retornar:
```json
{"status":"ok"}
```

### 5.2 Teste o frontend

1. Acesse: http://localhost:3000
2. Clique em "Register"
3. Crie uma conta:
   - Username: `teste`
   - Email: `teste@email.com`
   - Password: `senha123`
4. Faça login
5. Crie uma fanfic!

---

## ❌ Troubleshooting

### Erro: "failed to connect to database"

**Causa:** Connection string incorreta ou senha errada.

**Solução:**
1. Verifique se você substituiu `[YOUR-PASSWORD]` pela senha real
2. Verifique se não tem espaços extras na string
3. Tente resetar a senha no Supabase:
   - Settings → Database → Reset Database Password

### Erro: "pq: password authentication failed"

**Causa:** Senha incorreta.

**Solução:**
1. Vá no Supabase: Settings → Database
2. Clique em "Reset Database Password"
3. Copie a nova senha
4. Atualize o `.env` com a nova senha
5. Reinicie o backend

### Erro: "dial tcp: lookup ... no such host"

**Causa:** Connection string incompleta ou incorreta.

**Solução:**
1. Volte no Supabase
2. Copie a connection string novamente
3. Certifique-se de copiar a string COMPLETA
4. Cole no `.env` substituindo a linha inteira

### Erro: "too many connections"

**Causa:** Muitas conexões abertas (raro no plano gratuito).

**Solução:**
1. Feche todos os terminais com o backend rodando
2. Aguarde 1 minuto
3. Inicie o backend novamente

---

## 🎯 Checklist Final

- [ ] Copiei a connection string do Supabase
- [ ] Substituí `[YOUR-PASSWORD]` pela senha real
- [ ] Colei no arquivo `backend/.env`
- [ ] Salvei o arquivo
- [ ] Executei `go run main.go` e vi "Database connected successfully"
- [ ] Iniciei o frontend com `python -m http.server 3000`
- [ ] Acessei http://localhost:3000 e funciona
- [ ] Consegui criar uma conta e fazer login

**🎉 Se todos os itens estão marcados, está tudo funcionando!**

---

## 💡 Dicas

### Ver as tabelas criadas no Supabase

1. Vá no Supabase Dashboard
2. Clique em "Table Editor" no menu lateral
3. Você verá todas as tabelas criadas automaticamente:
   - users
   - fanfics
   - chapters
   - questions
   - answers
   - comments
   - pending_questions

### Executar queries SQL

1. Vá em "SQL Editor" no Supabase
2. Você pode executar queries diretamente:
   ```sql
   SELECT * FROM users;
   SELECT * FROM fanfics;
   ```

### Backup automático

O Supabase faz backup automático! Você não precisa se preocupar.

---

## 🔗 Links Úteis

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentação Supabase:** https://supabase.com/docs
- **Supabase Status:** https://status.supabase.com/

---

## 📞 Precisa de Ajuda?

Se algo não funcionar:
1. Verifique os logs do backend (terminal onde rodou `go run main.go`)
2. Verifique se a connection string está correta
3. Tente resetar a senha no Supabase
4. Leia a seção de Troubleshooting acima
