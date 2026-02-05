# Implementation Plan: Homepage Redesign

## Overview

Implementação do redesenho completo da homepage com header moderno, menu de categorias, área de autenticação integrada, hero section com fanfic em destaque, e seção de trending com carousel. O foco é criar uma experiência visual atraente e funcional inspirada no FicVerse.

## Tasks

- [x] 1. Criar estrutura HTML do novo header
  - Criar header com logo, search bar, categories button, notification bell e auth area
  - Adicionar classes CSS apropriadas para estilização
  - Garantir estrutura semântica com elementos HTML5
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Escrever testes unitários para estrutura do header

  - Testar que todos os elementos principais estão presentes
  - Testar ordem correta dos elementos
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implementar componente de área de autenticação
  - [x] 2.1 Criar lógica para exibir botões login/register quando não autenticado
    - Renderizar botões "Entrar" e "Cadastrar"
    - Adicionar links para páginas de login e registro
    - _Requirements: 1.5, 3.1_

  - [ ]* 2.2 Escrever teste de propriedade para consistência do estado de autenticação
    - **Property 1: Auth State Display Consistency**
    - **Validates: Requirements 1.5, 1.6, 3.1, 3.4**

  - [x] 2.3 Criar lógica para exibir avatar quando autenticado
    - Renderizar avatar do usuário
    - Adicionar dropdown menu com opções de perfil
    - _Requirements: 1.6, 3.4, 3.5_

  - [ ]* 2.4 Escrever teste de propriedade para toggle do menu de usuário
    - **Property 5: User Menu Toggle Behavior**
    - **Validates: Requirements 3.5**

- [x] 3. Implementar menu dropdown de categorias
  - [x] 3.1 Criar estrutura HTML do dropdown
    - Adicionar lista de categorias (Todos, Interativos, K-Pop, Romance, etc.)
    - Adicionar botão de toggle
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Implementar lógica de abertura/fechamento do menu
    - Toggle ao clicar no botão
    - Fechar ao clicar fora do menu
    - _Requirements: 2.1, 2.4_

  - [ ]* 3.3 Escrever teste de propriedade para comportamento do toggle
    - **Property 3: Categories Menu Toggle Behavior**
    - **Validates: Requirements 2.1, 2.4**

  - [x] 3.4 Implementar filtro de fanfics por categoria
    - Filtrar lista de fanfics ao selecionar categoria
    - Atualizar estado da aplicação
    - _Requirements: 2.3_

  - [ ]* 3.5 Escrever teste de propriedade para aplicação de filtro
    - **Property 4: Category Filter Application**
    - **Validates: Requirements 2.3, 6.4**

- [x] 4. Implementar componente de notificações
  - [x] 4.1 Criar estrutura do notification bell
    - Adicionar ícone de sino
    - Adicionar badge de contagem
    - _Requirements: 1.4, 9.1_

  - [ ]* 4.2 Escrever teste de propriedade para visibilidade do bell
    - **Property 19: Notification Bell Visibility**
    - **Validates: Requirements 9.1**

  - [x] 4.3 Implementar lógica de contagem de notificações
    - Buscar notificações não lidas da API
    - Atualizar badge com contagem
    - _Requirements: 9.2_

  - [ ]* 4.4 Escrever teste de propriedade para precisão do badge
    - **Property 20: Notification Badge Count Accuracy**
    - **Validates: Requirements 9.2**

  - [x] 4.5 Criar dropdown de notificações
    - Listar notificações recentes
    - Adicionar botão "Marcar todas como lidas"
    - Implementar navegação ao clicar em notificação
    - _Requirements: 9.3, 9.4_

  - [ ]* 4.6 Escrever testes de propriedade para dropdown de notificações
    - **Property 21: Notifications Dropdown Toggle**
    - **Property 22: Notification Click Navigation**
    - **Validates: Requirements 9.3, 9.4**

- [x] 5. Checkpoint - Verificar header completo
  - Garantir que todos os testes passam
  - Verificar visualmente o header em diferentes estados
  - Perguntar ao usuário se há dúvidas

- [x] 6. Criar hero section com fanfic em destaque
  - [x] 6.1 Criar estrutura HTML da hero section
    - Adicionar container para background image
    - Adicionar overlay escuro
    - Adicionar conteúdo (título, subtítulo, badge, botão)
    - Adicionar setas de navegação
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

  - [x] 6.2 Implementar lógica de exibição de fanfic em destaque
    - Buscar fanfics em destaque da API
    - Renderizar informações do fanfic atual
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 6.3 Escrever teste de propriedade para consistência da imagem de fundo
    - **Property 6: Hero Background Image Consistency**
    - **Validates: Requirements 4.1**

  - [x] 6.4 Implementar navegação entre fanfics em destaque
    - Adicionar handlers para setas prev/next
    - Implementar transição suave entre fanfics
    - Desabilitar setas nos limites
    - _Requirements: 4.7_

  - [ ]* 6.5 Escrever teste de propriedade para limites de navegação
    - **Property 7: Featured Fanfic Navigation Bounds**
    - **Validates: Requirements 4.7**

- [x] 7. Implementar barra de busca funcional
  - [x] 7.1 Adicionar input de busca com placeholder
    - Criar input field
    - Adicionar ícone de busca
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Implementar sugestões de busca
    - Adicionar debounce para input
    - Buscar sugestões da API
    - Exibir dropdown com sugestões
    - _Requirements: 5.3_

  - [ ]* 7.3 Escrever teste de propriedade para exibição de sugestões
    - **Property 8: Search Suggestions Display**
    - **Validates: Requirements 5.3**

  - [x] 7.4 Implementar navegação para resultados de busca
    - Adicionar handler para Enter key
    - Redirecionar para página de resultados
    - _Requirements: 5.4_

  - [ ]* 7.5 Escrever teste de propriedade para comportamento responsivo
    - **Property 9: Search Bar Responsive Behavior**
    - **Validates: Requirements 5.5**

- [x] 8. Criar filtros rápidos de categoria
  - [x] 8.1 Criar estrutura HTML dos filtros
    - Adicionar botões para categorias principais
    - Marcar "Todos" como ativo por padrão
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 8.2 Implementar lógica de seleção de filtro
    - Adicionar/remover classe active ao clicar
    - Garantir apenas um filtro ativo por vez
    - _Requirements: 6.3_

  - [ ]* 8.3 Escrever teste de propriedade para estado ativo do filtro
    - **Property 10: Quick Filter Active State**
    - **Validates: Requirements 6.3**

- [x] 9. Implementar seção "Bombando Hoje"
  - [x] 9.1 Criar estrutura HTML da seção
    - Adicionar título "Bombando Hoje 🔥"
    - Criar container para carousel
    - Adicionar setas de navegação
    - _Requirements: 7.1, 7.2_

  - [x] 9.2 Implementar grid de fanfic cards
    - Buscar fanfics trending da API
    - Renderizar cards com cover, título, autor, stats
    - _Requirements: 7.3_

  - [ ]* 9.3 Escrever teste de propriedade para exibição de cover
    - **Property 11: Fanfic Card Cover Display**
    - **Validates: Requirements 7.3**

  - [x] 9.4 Adicionar badges aos cards
    - Exibir "📖 LEITURA" ou "⚡ INTERATIVO" baseado no tipo
    - _Requirements: 7.4_

  - [ ]* 9.5 Escrever teste de propriedade para precisão do badge
    - **Property 12: Interactive Badge Accuracy**
    - **Validates: Requirements 7.4**

  - [x] 9.6 Implementar navegação ao clicar em card
    - Adicionar click handler
    - Redirecionar para página de detalhes
    - _Requirements: 7.5_

  - [ ]* 9.7 Escrever teste de propriedade para navegação de cards
    - **Property 13: Fanfic Card Click Navigation**
    - **Validates: Requirements 7.5**

  - [x] 9.8 Implementar scroll horizontal do carousel
    - Adicionar suporte para scroll/swipe em mobile
    - Adicionar handlers para setas de navegação
    - _Requirements: 7.6_

  - [ ]* 9.9 Escrever teste de propriedade para scroll em mobile
    - **Property 14: Carousel Scroll Behavior on Mobile**
    - **Validates: Requirements 7.6**

- [x] 10. Checkpoint - Verificar funcionalidades principais
  - Garantir que todos os testes passam
  - Testar fluxo completo de navegação
  - Perguntar ao usuário se há dúvidas

- [x] 11. Implementar estilos CSS do header
  - [x] 11.1 Estilizar header fixo
    - Adicionar position: fixed
    - Adicionar background semi-transparente com blur
    - Adicionar z-index apropriado
    - _Requirements: 1.7, 10.2_

  - [ ]* 11.2 Escrever teste de propriedade para posição fixa
    - **Property 2: Header Fixed Position Consistency**
    - **Validates: Requirements 1.7**

  - [x] 11.3 Estilizar elementos do header
    - Logo com gradiente
    - Search bar centralizada
    - Botões e ícones alinhados
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 11.4 Estilizar dropdowns
    - Categories menu
    - Notifications dropdown
    - User menu dropdown
    - _Requirements: 2.1, 9.3, 3.5_

- [x] 12. Implementar estilos CSS da hero section
  - Estilizar background image com overlay
  - Estilizar título e subtítulo
  - Estilizar badge e botão CTA
  - Estilizar setas de navegação
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

- [x] 13. Implementar estilos CSS dos fanfic cards
  - [x] 13.1 Estilizar cards com tema escuro
    - Background escuro com bordas sutis
    - Hover effect com lift e shadow
    - _Requirements: 10.4_

  - [x] 13.2 Estilizar badges dos cards
    - Posicionar no canto superior direito
    - Adicionar background semi-transparente
    - _Requirements: 7.4_

  - [x] 13.3 Garantir contraste de texto
    - Usar cores claras em backgrounds escuros
    - Verificar ratios de contraste
    - _Requirements: 10.3_

  - [ ]* 13.4 Escrever teste de propriedade para contraste de texto
    - **Property 23: Text Contrast on Dark Background**
    - **Validates: Requirements 10.3**

- [x] 14. Implementar estilos de hover para elementos interativos
  - Adicionar hover states para botões
  - Adicionar hover states para links
  - Adicionar hover states para cards
  - Garantir contraste apropriado
  - _Requirements: 10.5_

  - [x]* 14.1 Escrever teste de propriedade para hover states
    - **Property 24: Interactive Element Hover States**
    - **Validates: Requirements 10.5**

- [ ] 15. Implementar responsividade mobile
  - [x] 15.1 Adaptar header para mobile
    - Colapsar search bar em ícone
    - Manter categories menu acessível
    - Ajustar espaçamento
    - _Requirements: 8.1, 8.2_

  - [ ]* 15.2 Escrever teste de propriedade para header mobile
    - **Property 15: Mobile Header Responsiveness**
    - **Validates: Requirements 8.1, 8.2**

  - [ ] 15.3 Adaptar hero section para mobile
    - Ajustar tamanhos de imagem e texto
    - Reorganizar layout se necessário
    - _Requirements: 8.3_

  - [ ]* 15.4 Escrever teste de propriedade para hero mobile
    - **Property 16: Mobile Hero Section Responsiveness**
    - **Validates: Requirements 8.3**

  - [ ] 15.5 Adaptar fanfic cards para mobile
    - Empilhar verticalmente ou scroll horizontal
    - Ajustar tamanhos de card
    - _Requirements: 8.4_

  - [ ]* 15.6 Escrever teste de propriedade para cards mobile
    - **Property 17: Mobile Fanfic Cards Layout**
    - **Validates: Requirements 8.4**

  - [ ] 15.7 Testar em múltiplos tamanhos de viewport
    - Testar de 320px a 1920px
    - Garantir usabilidade em todos os tamanhos
    - _Requirements: 8.5_

  - [ ]* 15.8 Escrever teste de propriedade para usabilidade em todos viewports
    - **Property 18: Viewport Width Usability**
    - **Validates: Requirements 8.5**

- [ ] 16. Implementar integração com API
  - [x] 16.1 Criar serviço para buscar fanfics em destaque
    - Endpoint: GET /api/fanfics/featured
    - Retornar lista de fanfics para hero section
    - _Requirements: 4.1_

  - [ ] 16.2 Criar serviço para buscar fanfics trending
    - Endpoint: GET /api/fanfics/trending
    - Suportar filtro por categoria
    - _Requirements: 7.2_

  - [ ] 16.3 Criar serviço para buscar notificações
    - Endpoint: GET /api/notifications
    - Retornar notificações não lidas
    - _Requirements: 9.2, 9.3_

  - [ ] 16.4 Criar serviço para buscar sugestões de busca
    - Endpoint: GET /api/search/suggestions?q=query
    - Retornar lista de sugestões
    - _Requirements: 5.3_

  - [ ]* 16.5 Escrever testes unitários para serviços de API
    - Testar chamadas de API
    - Testar tratamento de erros
    - Testar parsing de respostas

- [ ] 17. Implementar estados de loading e erro
  - Adicionar spinners de loading
  - Adicionar mensagens de erro amigáveis
  - Adicionar botões de retry
  - Implementar fallbacks para imagens quebradas
  - _Requirements: Error Handling_

- [ ] 18. Implementar otimizações de performance
  - [ ] 18.1 Adicionar lazy loading para imagens
    - Usar IntersectionObserver
    - Carregar imagens conforme entram no viewport
    - _Requirements: Performance_

  - [ ] 18.2 Adicionar debounce para busca
    - Delay de 300ms
    - Cancelar requisições anteriores
    - _Requirements: 5.3_

  - [ ] 18.3 Implementar cache de API
    - Cache de 5 minutos para fanfics
    - Usar localStorage ou sessionStorage
    - _Requirements: Performance_

- [ ] 19. Implementar acessibilidade
  - [ ] 19.1 Adicionar ARIA labels
    - Labels para ícones
    - Labels para botões sem texto
    - _Requirements: Accessibility_

  - [ ] 19.2 Implementar navegação por teclado
    - Tab navigation
    - Enter para ativar elementos
    - Escape para fechar dropdowns
    - _Requirements: Accessibility_

  - [ ] 19.3 Adicionar focus trap em dropdowns
    - Manter foco dentro do dropdown quando aberto
    - Retornar foco ao botão quando fechar
    - _Requirements: Accessibility_

  - [ ]* 19.4 Escrever testes de acessibilidade
    - Testar navegação por teclado
    - Testar ARIA labels
    - Testar contraste de cores

- [ ] 20. Checkpoint final - Garantir todos os testes passam
  - Executar todos os testes unitários
  - Executar todos os testes de propriedade
  - Executar testes de acessibilidade
  - Perguntar ao usuário se há dúvidas

- [ ] 21. Integração e ajustes finais
  - [x] 21.1 Conectar com sistema de autenticação existente
    - Verificar token JWT
    - Buscar dados do usuário
    - Atualizar estado de autenticação
    - _Requirements: 1.5, 1.6_

  - [ ] 21.2 Testar fluxo completo end-to-end
    - Testar como usuário não autenticado
    - Testar como usuário autenticado
    - Testar todas as interações
    - _Requirements: All_

  - [ ]* 21.3 Escrever testes de integração
    - Testar fluxo de login
    - Testar filtro de categorias
    - Testar navegação entre páginas

  - [ ] 21.4 Ajustes finais de UI/UX
    - Refinar animações
    - Ajustar espaçamentos
    - Polir detalhes visuais
    - _Requirements: All_

## Notes

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de correção
- Testes unitários validam exemplos específicos e casos extremos
- A implementação segue uma abordagem incremental: estrutura → funcionalidade → estilos → responsividade → otimizações
