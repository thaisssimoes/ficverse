# Requirements Document

## Introduction

Este documento especifica os requisitos para o sistema completo de gerenciamento de fanfics, incluindo criação, edição, exclusão, upload de capas, editor de texto rico, sistema de rascunhos, publicação, avisos de conteúdo, sistema de tags e busca. O objetivo é fornecer aos autores ferramentas completas para gerenciar suas histórias e aos leitores formas eficientes de descobrir conteúdo relevante.

## Glossary

- **System**: O sistema completo de gerenciamento de fanfics
- **Author**: Usuário que cria e gerencia fanfics
- **Reader**: Usuário que lê e busca fanfics
- **Fanfic**: História de fãs publicada ou em rascunho na plataforma
- **Chapter**: Capítulo individual de uma fanfic
- **Cover**: Imagem de capa da fanfic
- **Draft_Mode**: Estado de uma fanfic ou capítulo que ainda não foi publicado
- **Published_State**: Estado de uma fanfic ou capítulo visível para leitores
- **Rich_Text_Editor**: Editor de texto com formatação avançada (negrito, itálico, listas, etc.)
- **Content_Warning**: Aviso sobre conteúdo adulto ou sensível
- **Tag**: Etiqueta de metadados para categorizar fanfics (fandom, warnings, casais)
- **Fandom_Tag**: Tag que identifica o universo/série da fanfic
- **Warning_Tag**: Tag que alerta sobre conteúdo sensível
- **Pairing_Tag**: Tag que identifica relacionamentos/casais na fanfic
- **Tag_Search**: Sistema de busca baseado em tags
- **Trigger_Warning**: Aviso específico sobre conteúdo potencialmente perturbador

## Requirements

### Requirement 1: Criar Fanfic

**User Story:** Como autor, eu quero criar uma nova fanfic com todas as informações necessárias, para que eu possa começar a escrever minha história.

#### Acceptance Criteria

1. WHEN an authenticated author submits a new fanfic with title and synopsis, THE System SHALL create a fanfic record in draft mode
2. WHEN creating a fanfic, THE System SHALL assign it a unique identifier
3. WHEN a fanfic is created, THE System SHALL set the author as the current authenticated user
4. WHEN a fanfic is created without a cover, THE System SHALL assign a default placeholder cover
5. WHEN a fanfic is created, THE System SHALL initialize it in draft mode with published status set to false

### Requirement 2: Editar Fanfic

**User Story:** Como autor, eu quero editar as informações da minha fanfic, para que eu possa atualizar título, sinopse, tags e outras configurações.

#### Acceptance Criteria

1. WHEN an author modifies the title of their fanfic, THE System SHALL update the title while preserving the fanfic identifier
2. WHEN an author modifies the synopsis, THE System SHALL update the synopsis text
3. WHEN an author modifies the category, THE System SHALL update the category association
4. WHEN an author modifies the disclaimer, THE System SHALL update the disclaimer text
5. WHEN an author who is not the fanfic owner attempts to edit, THE System SHALL reject the operation with an authorization error
6. WHEN an author updates fanfic metadata, THE System SHALL update the updated_at timestamp

### Requirement 3: Excluir Fanfic

**User Story:** Como autor, eu quero excluir minhas fanfics, para que eu possa remover histórias que não quero mais manter na plataforma.

#### Acceptance Criteria

1. WHEN an author deletes their fanfic, THE System SHALL remove the fanfic record and all associated data
2. WHEN a fanfic is deleted, THE System SHALL remove all associated chapters
3. WHEN a fanfic is deleted, THE System SHALL remove all associated comments
4. WHEN a fanfic is deleted, THE System SHALL remove all associated questions and answers
5. WHEN a fanfic is deleted, THE System SHALL remove the cover image file from storage
6. WHEN an author who is not the fanfic owner attempts to delete, THE System SHALL reject the operation with an authorization error

### Requirement 4: Upload de Capa de Fanfic

**User Story:** Como autor, eu quero fazer upload de uma imagem de capa para minha fanfic, para que ela tenha uma apresentação visual atraente.

#### Acceptance Criteria

1. WHEN an author uploads a cover image, THE System SHALL validate that the file is an image format (JPEG, PNG, GIF, WEBP)
2. WHEN an author uploads a cover image, THE System SHALL validate that the file size does not exceed 5MB
3. WHEN a valid cover image is uploaded, THE System SHALL store the image file in the uploads directory
4. WHEN a cover image is uploaded, THE System SHALL generate a unique filename to prevent conflicts
5. WHEN a cover image is uploaded, THE System SHALL update the fanfic cover_url field with the file path
6. WHEN an author uploads a new cover for a fanfic with an existing cover, THE System SHALL delete the old cover file
7. IF an image upload fails validation, THEN THE System SHALL return an error message describing the validation failure

### Requirement 5: Excluir Capítulo

**User Story:** Como autor, eu quero excluir capítulos das minhas fanfics, para que eu possa remover conteúdo indesejado ou reorganizar a história.

#### Acceptance Criteria

1. WHEN an author deletes a chapter, THE System SHALL remove the chapter record
2. WHEN a chapter is deleted, THE System SHALL remove all comments associated with that chapter
3. WHEN a chapter is deleted, THE System SHALL reorder the remaining chapters to maintain sequential numbering
4. WHEN an author who is not the fanfic owner attempts to delete a chapter, THE System SHALL reject the operation with an authorization error
5. WHEN the last chapter of a fanfic is deleted, THE System SHALL allow the deletion without requiring at least one chapter

### Requirement 6: Editor de Texto Rico

**User Story:** Como autor, eu quero usar um editor de texto com formatação rica em todas as caixas de texto, para que eu possa formatar meu conteúdo com negrito, itálico, listas e outros estilos.

#### Acceptance Criteria

1. WHEN an author writes chapter content, THE System SHALL provide a rich text editor with formatting options
2. WHEN an author writes a synopsis, THE System SHALL provide a rich text editor with formatting options
3. WHEN an author writes a disclaimer, THE System SHALL provide a rich text editor with formatting options
4. THE Rich_Text_Editor SHALL support bold, italic, underline, and strikethrough formatting
5. THE Rich_Text_Editor SHALL support ordered and unordered lists
6. THE Rich_Text_Editor SHALL support headings (H1, H2, H3)
7. THE Rich_Text_Editor SHALL support paragraph breaks and line breaks
8. WHEN formatted content is saved, THE System SHALL store the content with HTML markup
9. WHEN formatted content is displayed, THE System SHALL render the HTML markup correctly

### Requirement 7: Modo Rascunho

**User Story:** Como autor, eu quero salvar fanfics e capítulos como rascunhos, para que eu possa trabalhar neles sem publicá-los imediatamente.

#### Acceptance Criteria

1. WHEN an author creates a new fanfic, THE System SHALL set it to draft mode by default
2. WHEN an author creates a new chapter, THE System SHALL allow marking it as draft
3. WHEN a fanfic is in draft mode, THE System SHALL hide it from public listings and search results
4. WHEN a chapter is in draft mode, THE System SHALL hide it from readers but show it to the author
5. WHEN an author views their dashboard, THE System SHALL display both published and draft fanfics with clear status indicators
6. WHEN an author edits a published fanfic, THE System SHALL allow saving changes without affecting the published version until explicitly published

### Requirement 8: Botão de Publicação

**User Story:** Como autor, eu quero publicar minhas fanfics e capítulos com um botão dedicado, para que eu possa controlar quando meu conteúdo fica visível para leitores.

#### Acceptance Criteria

1. WHEN an author clicks the publish button on a draft fanfic, THE System SHALL change the fanfic status to published
2. WHEN a fanfic is published, THE System SHALL make it visible in public listings and search results
3. WHEN an author clicks the publish button on a draft chapter, THE System SHALL make the chapter visible to readers
4. WHEN an author attempts to publish a fanfic without required fields (title, synopsis), THE System SHALL prevent publication and display validation errors
5. WHEN a fanfic is published, THE System SHALL set the published_at timestamp
6. WHEN an author unpublishes a fanfic, THE System SHALL return it to draft mode and hide it from public view

### Requirement 9: Aviso de Conteúdo Adulto

**User Story:** Como autor, eu quero marcar minhas fanfics com aviso de conteúdo adulto, para que leitores sejam alertados sobre conteúdo sensível antes de ler.

#### Acceptance Criteria

1. WHEN an author creates or edits a fanfic, THE System SHALL provide an option to mark it as adult content
2. WHEN a fanfic is marked as adult content, THE System SHALL store this flag in the database
3. WHEN a reader accesses a fanfic marked as adult content, THE System SHALL display a content warning before showing the fanfic details
4. WHEN displaying the content warning, THE System SHALL require explicit confirmation from the reader to proceed
5. WHEN a fanfic is marked as adult content, THE System SHALL display an age rating badge on the fanfic card
6. WHERE a fanfic has adult content, THE System SHALL include this information in search results and listings

### Requirement 10: Sistema de Tags (Fandom, Warnings, Casais)

**User Story:** Como autor, eu quero adicionar tags de fandom, warnings e casais às minhas fanfics, para que leitores possam entender o conteúdo e encontrar histórias relevantes.

#### Acceptance Criteria

1. WHEN an author creates or edits a fanfic, THE System SHALL allow adding up to 5 fandom tags
2. WHEN an author creates or edits a fanfic, THE System SHALL allow adding up to 5 warning tags
3. WHEN an author creates or edits a fanfic, THE System SHALL allow adding up to 5 pairing tags
4. WHEN tags are added, THE System SHALL store them associated with the fanfic
5. WHEN displaying a fanfic, THE System SHALL show all associated tags grouped by type (fandom, warnings, pairings)
6. WHEN an author removes a tag, THE System SHALL remove the association between the tag and the fanfic
7. THE System SHALL support creating new tags if they do not already exist in the database
8. WHEN displaying tags, THE System SHALL use distinct visual styling for each tag type (fandom, warning, pairing)

### Requirement 11: Busca por Tags

**User Story:** Como leitor, eu quero buscar fanfics por tags, para que eu possa encontrar histórias sobre fandoms, casais ou temas específicos.

#### Acceptance Criteria

1. WHEN a reader searches by a fandom tag, THE System SHALL return all published fanfics with that fandom tag
2. WHEN a reader searches by a warning tag, THE System SHALL return all published fanfics with that warning tag
3. WHEN a reader searches by a pairing tag, THE System SHALL return all published fanfics with that pairing tag
4. WHEN a reader searches with multiple tags, THE System SHALL return fanfics that match all specified tags (AND logic)
5. WHEN displaying search results, THE System SHALL show fanfic cards with covers, titles, and tag badges
6. WHEN no fanfics match the search criteria, THE System SHALL display a message indicating no results found
7. WHEN a reader clicks on a tag in a fanfic detail page, THE System SHALL navigate to search results for that tag

### Requirement 12: Sistema de Categorias

**User Story:** Como autor, eu quero categorizar minhas fanfics, para que leitores possam navegar por tipo de história.

#### Acceptance Criteria

1. WHEN an author creates or edits a fanfic, THE System SHALL require selecting one category
2. THE System SHALL provide predefined categories: Romance, Aventura, Drama, Comédia, Ficção Científica, Fantasia, Terror, Mistério
3. WHEN a category is selected, THE System SHALL store the category association with the fanfic
4. WHEN displaying fanfics on the homepage, THE System SHALL group them by category
5. WHEN a reader filters by category, THE System SHALL show only fanfics in that category
6. WHEN displaying a fanfic, THE System SHALL show its category prominently

### Requirement 13: Trigger Warnings nas Fanfics

**User Story:** Como autor, eu quero adicionar trigger warnings específicos às minhas fanfics, para que leitores sejam alertados sobre conteúdo potencialmente perturbador.

#### Acceptance Criteria

1. WHEN an author creates or edits a fanfic, THE System SHALL provide a field for trigger warnings
2. WHEN trigger warnings are provided, THE System SHALL store them as part of the fanfic metadata
3. WHEN a fanfic has trigger warnings, THE System SHALL display them prominently on the fanfic detail page before chapter access
4. WHEN displaying trigger warnings, THE System SHALL use clear visual styling to ensure visibility
5. WHERE trigger warnings exist, THE System SHALL show a warning icon on the fanfic card in listings
6. WHEN a reader views a fanfic with trigger warnings, THE System SHALL display the warnings before allowing chapter navigation

