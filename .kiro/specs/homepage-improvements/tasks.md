# Implementation Plan: Homepage Improvements

## Overview

Este plano implementa melhorias na homepage do FicVerse, incluindo correção do menu do perfil, adição de seção "Minhas Leituras", e remoção de seções desnecessárias.

## Tasks

- [x] 1. Corrigir Menu do Perfil (User Dropdown)
  - Verificar e corrigir event listeners em `auth-area.js`
  - Corrigir CSS positioning do `.user-dropdown`
  - Testar abertura/fechamento do menu
  - Testar fechamento ao clicar fora
  - Testar fechamento com tecla Escape
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Remover Seções Desnecessárias
  - Remover seção "Como Funciona" do HTML (`index.html`)
  - Remover seção "Pronto para sua história" do HTML (`index.html`)
  - Remover CSS relacionado às seções removidas
  - Verificar que outras seções continuam funcionando
  - _Requirements: 3.1, 3.2, 4.1, 4.2_

- [x] 3. Implementar Backend - Endpoint Reading List
  - [x] 3.1 Criar handler `GET /api/reading-list`
    - Criar arquivo `backend/routes/reading_list_handler.go`
    - Implementar lógica para buscar progresso de leitura do usuário
    - Juntar com dados das fanfics
    - Calcular porcentagem de progresso
    - Ordenar por última leitura
    - Retornar JSON com lista de fanfics
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Adicionar rota ao router
    - Registrar rota em `backend/routes/routes.go`
    - Adicionar middleware de autenticação
    - _Requirements: 2.1_

  - [ ]* 3.3 Testar endpoint
    - Testar com usuário autenticado
    - Testar com usuário sem leituras
    - Testar com usuário não autenticado
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implementar Frontend - API Client
  - Adicionar método `getReadingList()` em `frontend/js/api.js`
  - Implementar tratamento de erros
  - Adicionar headers de autenticação
  - _Requirements: 2.1_

- [x] 5. Implementar Frontend - Reading List Section
  - [x] 5.1 Criar função `loadReadingList()` em `homepage.js`
    - Verificar se usuário está autenticado
    - Chamar API para buscar lista de leitura
    - Tratar erros e estados vazios
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 5.2 Criar função `renderReadingListSection()`
    - Renderizar seção com título "Sua Lista de Leitura 📚"
    - Renderizar cards de fanfics
    - Renderizar estado vazio se não houver leituras
    - Mostrar progresso de leitura em cada card
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.3 Criar função `renderReadingListCard()`
    - Renderizar card individual com cover, título, categoria
    - Mostrar progresso (capítulo X de Y)
    - Adicionar link para continuar leitura
    - _Requirements: 2.2, 2.4_

  - [x] 5.4 Integrar na função `loadHomepage()`
    - Carregar reading list após hero section
    - Inserir seção no DOM após quick filters
    - Manter carregamento assíncrono
    - _Requirements: 2.1_

- [ ] 6. Implementar CSS - Reading List Section
  - Criar estilos para `.reading-list-section`
  - Criar estilos para `.reading-list-carousel`
  - Criar estilos para `.empty-reading-list`
  - Criar estilos para cards de leitura com progresso
  - Adicionar estilos responsivos (mobile/tablet/desktop)
  - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2, 5.3_

- [ ] 7. Checkpoint - Testar Funcionalidades Básicas
  - Verificar que menu do perfil abre e fecha corretamente
  - Verificar que seções foram removidas
  - Verificar que reading list aparece para usuários autenticados
  - Verificar que reading list não aparece para usuários não autenticados
  - Testar em diferentes navegadores
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implementar Melhorias de UX

  - Adicionar loading state para reading list
  - Adicionar animações de transição
  - Adicionar feedback visual ao hover
  - Melhorar acessibilidade (ARIA labels, keyboard navigation)
  - _Requirements: 5.4, 5.5_

- [ ] 9. Testes Responsivos

  - Testar layout em desktop (1920px, 1440px, 1024px)
  - Testar layout em tablet (768px)
  - Testar layout em mobile (375px, 414px)
  - Verificar que não há scroll horizontal
  - Verificar que todos os elementos são clicáveis/tocáveis
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 10. Testes de Integração

  - Testar fluxo completo: Login → Ver reading list → Clicar fanfic
  - Testar fluxo: Login → Abrir menu → Clicar perfil
  - Testar fluxo: Logout → Verificar reading list oculta
  - Testar tratamento de erros de API
  - Testar com diferentes estados de dados (vazio, parcial, completo)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 11. Final Checkpoint - Verificação Completa

  - Executar todos os testes
  - Verificar performance (tempo de carregamento)
  - Verificar acessibilidade (screen readers, keyboard)
  - Verificar cross-browser compatibility
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requirements específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Foco em funcionalidade core primeiro, melhorias de UX depois
- Backend deve ser implementado antes do frontend para permitir testes integrados
