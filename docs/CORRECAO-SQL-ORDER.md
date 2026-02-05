# Correção - Erro SQL com palavra reservada "order"

## Problema Identificado

**Erro:** `ERROR: syntax error at or near "order" (SQLSTATE 42601)`

**Causa:** A palavra `order` é uma palavra reservada no PostgreSQL. O código estava usando backticks `` `order` `` (sintaxe MySQL) ao invés de aspas duplas `"order"` (sintaxe PostgreSQL).

## Testes Executados

### ✅ Teste 1: Criar Fanfic - PASSOU
- Fanfic criada com sucesso (ID: 14)
- Backend funcionando corretamente para criação de fanfics

### ❌ Teste 2: Criar Capítulo - FALHOU
- Erro ao executar query SQL
- Problema: backticks ao invés de aspas duplas

### ⏳ Teste 3: Publicar Fanfic - NÃO EXECUTADO
- Dependia do teste 2

## Correções Aplicadas

### Arquivo: `backend/chapter/repository.go`

Substituí todas as ocorrências de `` `order` `` por `"order"`:

1. **GetByFanficID** - linha ~68
   ```go
   // ANTES
   Order("`order` ASC")
   
   // DEPOIS
   Order("\"order\" ASC")
   ```

2. **GetMaxOrder** - linha ~103
   ```go
   // ANTES
   Select("COALESCE(MAX(`order`), 0)")
   
   // DEPOIS
   Select("COALESCE(MAX(\"order\"), 0)")
   ```

3. **UpdateOrdersAfterDelete** - linha ~113
   ```go
   // ANTES
   Where("fanfic_id = ? AND `order` > ?", fanficID, deletedOrder).
   Update("`order`", gorm.Expr("`order` - 1"))
   
   // DEPOIS
   Where("fanfic_id = ? AND \"order\" > ?", fanficID, deletedOrder).
   Update("\"order\"", gorm.Expr("\"order\" - 1"))
   ```

4. **UpdateOrder** - linha ~125
   ```go
   // ANTES
   Update("`order`", newOrder)
   
   // DEPOIS
   Update("\"order\"", newOrder)
   ```

## Por que isso aconteceu?

- **MySQL** usa backticks `` `column` `` para escapar palavras reservadas
- **PostgreSQL** usa aspas duplas `"column"` para escapar palavras reservadas
- O código foi escrito para MySQL mas o projeto usa PostgreSQL

## Como Testar Agora

### Passo 1: Reiniciar o Backend
```bash
# Pare o backend (Ctrl+C)
cd backend
go run main.go
```

### Passo 2: Executar Teste E2E Novamente
1. Abra `http://localhost:3000/tests/fanfic-creation-e2e.test.html`
2. Clique em "🗑️ Limpar Resultados"
3. Clique em "▶️ Executar Todos os Testes"
4. Todos os 3 testes devem passar agora:
   - ✅ Criar Fanfic
   - ✅ Criar Capítulo
   - ✅ Publicar Fanfic

### Passo 3: Testar Manualmente
1. Vá para o Dashboard
2. Clique em "Nova Fanfic"
3. Preencha e salve
4. Clique na fanfic criada
5. Clique em "Adicionar Capítulo"
6. Preencha e salve
7. Deve funcionar sem erros!

## Resultado Esperado

Após reiniciar o backend, o teste E2E deve mostrar:

```
✅ Criar Fanfic
Fanfic criada com sucesso! ID: X

✅ Criar Capítulo
Capítulo criado com sucesso! ID: Y

✅ Publicar Fanfic
Fanfic publicada com sucesso!

✅ Fluxo Completo
Todos os testes passaram! Sistema funcionando corretamente.
```

## Outras Palavras Reservadas

Se encontrar erros similares com outras palavras, use aspas duplas:
- `"order"` ✅
- `"user"` ✅
- `"group"` ✅
- `"table"` ✅
- `"select"` ✅

## Verificação Adicional

Se ainda houver problemas, verifique:
1. Backend está usando PostgreSQL (não MySQL)
2. String de conexão está correta
3. Banco de dados está acessível
4. Migrations foram executadas

## Próximos Passos

1. ✅ Reinicie o backend
2. ✅ Execute o teste E2E
3. ✅ Verifique se todos passam
4. ✅ Teste manualmente no dashboard
5. ✅ Confirme que tudo funciona

## Arquivos Modificados

- `backend/chapter/repository.go` - 4 funções corrigidas
