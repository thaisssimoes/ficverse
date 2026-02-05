# Requirements Document

## Introduction

Este documento especifica melhorias na homepage do FicVerse para corrigir funcionalidades quebradas e adicionar novas features baseadas no design de referência de aplicativos de leitura interativa.

## Glossary

- **User_Menu**: Menu dropdown que aparece ao clicar no avatar do usuário
- **Reading_List**: Lista personalizada de fanfics que o usuário está lendo ou salvou para ler depois
- **Homepage**: Página principal do site (index.html)
- **Auth_Area**: Área de autenticação no header que mostra login/cadastro ou avatar do usuário

## Requirements

### Requirement 1: Corrigir Menu do Perfil

**User Story:** Como um usuário autenticado, eu quero clicar no meu avatar e ver um menu dropdown com opções, para que eu possa navegar facilmente para meu perfil, minhas fanfics e fazer logout.

#### Acceptance Criteria

1. WHEN um usuário autenticado clica no avatar THEN o sistema SHALL exibir um menu dropdown com as opções "Meu Perfil", "Minhas Fanfics", "Configurações" e "Sair"
2. WHEN o menu dropdown está aberto e o usuário clica fora dele THEN o sistema SHALL fechar o menu
3. WHEN o menu dropdown está aberto e o usuário pressiona a tecla Escape THEN o sistema SHALL fechar o menu
4. WHEN o usuário clica em uma opção do menu THEN o sistema SHALL navegar para a página correspondente ou executar a ação (logout)
5. WHEN o usuário não está autenticado THEN o sistema SHALL NOT exibir o avatar ou menu dropdown

### Requirement 2: Adicionar Seção "Minhas Leituras"

**User Story:** Como um usuário autenticado, eu quero ver uma seção "Minhas Leituras" na homepage, para que eu possa continuar lendo as fanfics que comecei ou salvei.

#### Acceptance Criteria

1. WHEN um usuário autenticado acessa a homepage THEN o sistema SHALL exibir uma seção "Minhas Leituras" após o hero section
2. WHEN a seção "Minhas Leituras" é exibida THEN o sistema SHALL mostrar as fanfics que o usuário está lendo atualmente
3. WHEN o usuário não tem fanfics em sua lista de leitura THEN o sistema SHALL exibir uma mensagem "Você ainda não começou nenhuma leitura"
4. WHEN o usuário clica em uma fanfic na lista de leituras THEN o sistema SHALL navegar para a página de detalhes da fanfic
5. WHEN o usuário não está autenticado THEN o sistema SHALL NOT exibir a seção "Minhas Leituras"

### Requirement 3: Remover Seção "Como Funciona"

**User Story:** Como um desenvolvedor, eu quero remover a seção "Como Funciona" da homepage, para simplificar a interface e focar no conteúdo principal.

#### Acceptance Criteria

1. WHEN a homepage é carregada THEN o sistema SHALL NOT exibir a seção "Como Funciona"
2. WHEN a homepage é carregada THEN o sistema SHALL manter todas as outras seções funcionando normalmente

### Requirement 4: Remover Seção "Pronto para sua história"

**User Story:** Como um desenvolvedor, eu quero remover a seção CTA "Pronto para sua história" da homepage, para simplificar a interface.

#### Acceptance Criteria

1. WHEN a homepage é carregada THEN o sistema SHALL NOT exibir a seção "Pronto para sua história"
2. WHEN a homepage é carregada THEN o sistema SHALL manter o footer e outras seções funcionando normalmente

### Requirement 5: Adaptar Layout para Web

**User Story:** Como um usuário, eu quero uma interface adaptada para navegador web, para que eu tenha uma experiência otimizada para desktop e mobile.

#### Acceptance Criteria

1. WHEN a homepage é exibida em desktop THEN o sistema SHALL usar um layout de grid responsivo para as fanfics
2. WHEN a homepage é exibida em mobile THEN o sistema SHALL adaptar o layout para uma coluna única
3. WHEN o usuário redimensiona a janela THEN o sistema SHALL ajustar o layout dinamicamente
4. WHEN badges interativos são exibidos THEN o sistema SHALL usar ícones e estilos apropriados para web
5. WHEN seções são exibidas THEN o sistema SHALL manter espaçamento e hierarquia visual consistentes
