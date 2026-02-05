# Guia de Testes - Interactive Fanfic Platform

Este guia explica como testar a plataforma de fanfics interativas, incluindo testes automatizados e testes manuais.

## Índice

1. [Testes Backend (Go)](#testes-backend-go)
2. [Testes Frontend](#testes-frontend)
3. [Testes de Integração](#testes-de-integração)
4. [Testes Manuais](#testes-manuais)
5. [Testes de Property-Based Testing](#testes-de-property-based-testing)

---

## Testes Backend (Go)

### Pré-requisitos

Certifique-se de que o PostgreSQL está rodando:

```bash
# Usando Docker (recomendado)
docker-compose up -d

# Ou verifique se o PostgreSQL local está rodando
```

### Executar Todos os Testes

```bash
cd backend
go test ./... -v
```

### Executar Testes por Módulo

**Testes de Autenticação:**
```bash
cd backend
go test ./auth/... -v
```

**Testes de Fanfics:**
```bash
cd backend
go test ./fanfic/... -v
```

**Testes de Capítulos:**
```bash
cd backend
go test ./chapter/... -v
```

**Testes de Modo Interativo:**
```bash
cd backend
go test ./interactive/... -v
```

**Testes de Comentários:**
```bash
cd backend
go test ./comment/... -v
```

**Testes de Rotas/API:**
```bash
cd backend
go test ./routes/... -v
```

**Testes de Database:**
```bash
cd backend
go test ./database/... -v
```

### Executar Property-Based Tests

Os property-based tests estão nos arquivos `*_property_test.go`:

```bash
cd backend
go test ./... -v -run Property
```

### Executar Testes com Coverage

```bash
cd backend
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

Abra `coverage.html` no navegador para ver a cobertura de código.

### Executar Testes Específicos

```bash
# Executar um teste específico
cd backend
go test ./auth -v -run TestRegister

# Executar property test específico
go test ./auth -v -run TestProperty_ValidCredentialsCreateSessions
```

---

## Testes Frontend

Os testes frontend são arquivos HTML que você pode abrir no navegador.

### Executar Testes Frontend

1. **Inicie o servidor frontend:**
   ```bash
   cd frontend
   python -m http.server 3000
   ```

2. **Abra os testes no navegador:**
   - Homepage: http://localhost:3000/tests/homepage.test.html
   - Fanfic Detail: http://localhost:3000/tests/fanfic-detail.test.html
   - Questions Modal: http://localhost:3000/tests/questions-modal.test.html
   - Chapter Reader: http://localhost:3000/tests/chapter-reader.test.html
   - Auth Forms: http://localhost:3000/tests/auth-forms.test.html
   - Dashboard: http://localhost:3000/tests/dashboard.test.html
   - Comments: http://localhost:3000/tests/comments.test.html
   - Answer Editor: http://localhost:3000/tests/answer-editor.test.html

3. **Verifique os resultados:**
   - Cada página de teste mostrará os resultados (✓ passou / ✗ falhou)
   - Abra o console do navegador (F12) para ver logs detalhados

### Executar Todos os Testes Frontend de Uma Vez

Você pode criar um arquivo `test-runner.html` para executar todos os testes:

```html
<!DOCTYPE html>
<html>
<head>
    <title>All Frontend Tests</title>
</head>
<body>
    <h1>Frontend Test Suite</h1>
    <iframe src="tests/homepage.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/fanfic-detail.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/questions-modal.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/chapter-reader.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/auth-forms.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/dashboard.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/comments.test.html" width="100%" height="200"></iframe>
    <iframe src="tests/answer-editor.test.html" width="100%" height="200"></iframe>
</body>
</html>
```

---

## Testes de Integração

### Teste End-to-End Completo

1. **Inicie o banco de dados:**
   ```bash
   docker-compose up -d
   ```

2. **Inicie o backend:**
   ```bash
   cd backend
   go run main.go
   ```

3. **Inicie o frontend (em outro terminal):**
   ```bash
   cd frontend
   python -m http.server 3000
   ```

4. **Acesse a aplicação:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080

5. **Execute o fluxo completo:**
   - Registre um novo usuário
   - Faça login
   - Crie uma fanfic com capa, sinopse, disclaimer
   - Adicione capítulos
   - Ative o modo interativo e crie perguntas
   - Faça logout e login como outro usuário
   - Responda as perguntas interativas
   - Leia a fanfic em modo interativo
   - Adicione comentários
   - Edite suas respostas

---

## Testes Manuais

### Checklist de Funcionalidades

#### Autenticação
- [ ] Registrar novo usuário com dados válidos
- [ ] Tentar registrar com email duplicado (deve falhar)
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (deve falhar)
- [ ] Logout

#### Publicação de Fanfics
- [ ] Criar fanfic com título, sinopse, capa, disclaimer, categoria
- [ ] Validar upload de imagem (formatos válidos e inválidos)
- [ ] Editar metadados da fanfic
- [ ] Deletar fanfic

#### Gerenciamento de Capítulos
- [ ] Adicionar capítulo com título e conteúdo
- [ ] Editar capítulo existente
- [ ] Deletar capítulo
- [ ] Reordenar capítulos
- [ ] Verificar ordenação sequencial

#### Modo Interativo
- [ ] Ativar modo interativo em uma fanfic
- [ ] Criar perguntas com placeholders
- [ ] Adicionar nova pergunta a fanfic existente
- [ ] Verificar que leitores são marcados com perguntas pendentes
- [ ] Responder perguntas como leitor
- [ ] Ler capítulo com substituição de placeholders
- [ ] Editar respostas
- [ ] Ler em modo não-interativo (sem substituição)

#### Sistema de Comentários
- [ ] Adicionar comentário em fanfic
- [ ] Adicionar comentário em capítulo
- [ ] Visualizar comentários em ordem cronológica
- [ ] Deletar próprio comentário
- [ ] Autor deletar comentário de leitor

#### Dashboard do Autor
- [ ] Visualizar todas as fanfics do autor
- [ ] Editar metadados da fanfic
- [ ] Gerenciar capítulos
- [ ] Gerenciar perguntas interativas
- [ ] Visualizar comentários agrupados por capítulo

#### Homepage
- [ ] Visualizar fanfics agrupadas por categoria
- [ ] Hover sobre capa mostra sinopse
- [ ] Fanfics ordenadas por data dentro da categoria
- [ ] Clicar em "read more" vai para página de detalhes

#### Página de Detalhes
- [ ] Visualizar capa, sinopse, disclaimer
- [ ] Visualizar lista de capítulos
- [ ] Opção de modo interativo/não-interativo (se disponível)
- [ ] Visualizar comentários

---

## Testes de Property-Based Testing

Os property-based tests validam propriedades universais do sistema. Eles executam 100+ iterações com dados aleatórios.

### Propriedades Testadas

**Autenticação (Properties 1-4):**
- Credenciais válidas sempre criam sessões
- Credenciais inválidas sempre são rejeitadas
- Registro sempre cria usuários únicos
- Logout sempre termina sessões

**Fanfics (Properties 5-7):**
- Criação persiste todos os dados
- Fanfics publicadas aparecem na homepage
- Validação de imagem rejeita formatos inválidos

**Capítulos (Properties 8-11):**
- Ordenação é sempre mantida
- Updates preservam identidade
- Deleção ajusta ordenação
- Reordenação atualiza sequência

**Modo Interativo (Properties 12-15, 21-27):**
- Perguntas são persistidas com placeholders
- Novas perguntas criam status pendente
- Substituição de placeholders funciona corretamente
- Modo não-interativo mostra texto original

**Comentários (Properties 33-37):**
- Comentários são armazenados com metadata
- Ordenação cronológica é mantida
- Autorização de deleção funciona corretamente

**API (Properties 28-30):**
- Validação de input rejeita dados inválidos
- Respostas de erro incluem status codes
- Endpoints protegidos requerem autenticação

### Executar Property Tests

```bash
cd backend
go test ./... -v -run Property -count=1
```

O flag `-count=1` desabilita o cache para garantir que os testes rodem novamente.

---

## Verificação Rápida

Execute este script para verificar se tudo está funcionando:

```bash
#!/bin/bash

echo "=== Verificando Backend ==="
cd backend
go test ./... -v

echo ""
echo "=== Verificando Property Tests ==="
go test ./... -v -run Property

echo ""
echo "=== Verificando Coverage ==="
go test ./... -cover

echo ""
echo "=== Testes Completos! ==="
```

---

## Troubleshooting

### Testes Falhando por Conexão com Banco

Se os testes falharem com erro de conexão:

1. Verifique se o PostgreSQL está rodando:
   ```bash
   docker-compose ps
   ```

2. Verifique as credenciais no `.env`:
   ```
   DATABASE_URL=postgres://postgres:postgres@localhost:5432/fanfic_platform?sslmode=disable
   ```

3. Recrie o banco de dados:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Property Tests Muito Lentos

Property tests executam 100+ iterações. Para testes mais rápidos durante desenvolvimento:

```bash
# Reduzir número de iterações (edite os arquivos *_property_test.go)
# Procure por: parameters.MinSuccessfulTests(100)
# Altere para: parameters.MinSuccessfulTests(20)
```

### Frontend Tests Não Carregam

Certifique-se de que:
1. O servidor frontend está rodando
2. O backend está rodando (para testes de integração)
3. Não há erros no console do navegador (F12)

---

## Próximos Passos

Após executar todos os testes:

1. **Verifique a cobertura de código** - Objetivo: >80%
2. **Execute testes de carga** - Use ferramentas como `hey` ou `ab`
3. **Teste em diferentes navegadores** - Chrome, Firefox, Safari, Edge
4. **Teste responsividade** - Mobile, tablet, desktop
5. **Teste acessibilidade** - Use ferramentas como Lighthouse

---

## Recursos Adicionais

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Property-Based Testing Guide](https://github.com/leanovate/gopter)
- [HTTP Testing in Go](https://golang.org/pkg/net/http/httptest/)
