# Design Document

## Overview

Este documento descreve o design técnico para implementar melhorias na homepage do FicVerse, incluindo correção do menu do perfil, adição de uma seção "Minhas Leituras", e remoção de seções desnecessárias.

## Architecture

### Component Structure

```
Homepage (index.html)
├── Header
│   ├── Logo
│   ├── Search Bar
│   ├── Categories Menu
│   ├── Notifications
│   └── Auth Area
│       ├── Login/Register Buttons (não autenticado)
│       └── User Menu (autenticado)
│           ├── Avatar Button
│           └── Dropdown Menu
│               ├── Meu Perfil
│               ├── Minhas Fanfics
│               ├── Configurações
│               └── Sair
├── Hero Section
├── Quick Filters
├── Minhas Leituras Section (novo - apenas autenticado)
├── Bombando Hoje Section
└── Footer
```

### Data Flow

1. **User Menu**: `auth-area.js` gerencia estado de autenticação e controla visibilidade do dropdown
2. **Reading List**: Nova função em `homepage.js` busca fanfics do usuário via API
3. **Sections**: Remoção de HTML e CSS das seções "Como Funciona" e "Pronto para sua história"

## Components and Interfaces

### 1. User Menu Dropdown (auth-area.js)

**Problema Atual**: O dropdown não abre quando o usuário clica no avatar.

**Solução**: Verificar e corrigir event listeners e posicionamento CSS.

```javascript
class AuthArea {
    // ... existing code ...
    
    toggleUserMenu() {
        if (this.isUserMenuOpen) {
            this.closeUserMenu();
        } else {
            this.openUserMenu();
        }
    }
    
    openUserMenu() {
        if (this.userDropdown) {
            this.userDropdown.style.display = 'block';
            this.isUserMenuOpen = true;
            this.userAvatarBtn.setAttribute('aria-expanded', 'true');
        }
    }
    
    closeUserMenu() {
        if (this.userDropdown) {
            this.userDropdown.style.display = 'none';
            this.isUserMenuOpen = false;
            this.userAvatarBtn.setAttribute('aria-expanded', 'false');
        }
    }
}
```

**CSS Requirements**:
- `.user-dropdown` deve ter `position: absolute`
- Deve estar posicionado relativo ao `.user-menu` ou `.auth-area`
- `z-index` adequado para aparecer sobre outros elementos

### 2. Reading List Section (homepage.js)

**Nova Funcionalidade**: Seção que mostra fanfics que o usuário está lendo.

```javascript
// Estrutura de dados
interface ReadingListItem {
    fanfic_id: number;
    fanfic_title: string;
    fanfic_cover_url: string;
    fanfic_category: string;
    last_chapter_read: number;
    total_chapters: number;
    last_read_at: string;
}

// Função para buscar lista de leitura
async function loadReadingList() {
    if (!api.isAuthenticated()) {
        return null;
    }
    
    try {
        const readingList = await api.getReadingList();
        return readingList;
    } catch (error) {
        console.error('Error loading reading list:', error);
        return null;
    }
}

// Função para renderizar seção
function renderReadingListSection(readingList) {
    if (!readingList || readingList.length === 0) {
        return `
            <section class="reading-list-section">
                <h2 class="section-title">Sua Lista de Leitura 📚</h2>
                <div class="empty-reading-list">
                    <p>Você ainda não começou nenhuma leitura</p>
                    <a href="explore.html" class="btn-primary">Explorar Fanfics</a>
                </div>
            </section>
        `;
    }
    
    return `
        <section class="reading-list-section">
            <h2 class="section-title">Sua Lista de Leitura 📚</h2>
            <div class="reading-list-carousel">
                <div class="fanfic-grid">
                    ${readingList.map(item => renderReadingListCard(item)).join('')}
                </div>
            </div>
        </section>
    `;
}
```

### 3. API Integration

**Novo Endpoint Necessário**: `GET /api/reading-list`

```javascript
// Em api.js
async getReadingList() {
    const response = await this.fetch('/api/reading-list', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${this.getToken()}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch reading list');
    }
    
    return await response.json();
}
```

**Backend**: Endpoint deve retornar fanfics que o usuário:
- Começou a ler (tem progresso em capítulos)
- Salvou na lista de leitura
- Ordenado por última leitura (mais recente primeiro)

## Data Models

### Reading List Item

```typescript
interface ReadingListItem {
    fanfic_id: number;
    fanfic_title: string;
    fanfic_cover_url: string;
    fanfic_category: string;
    fanfic_synopsis: string;
    last_chapter_read: number;
    total_chapters: number;
    last_read_at: string; // ISO 8601 timestamp
    progress_percentage: number; // 0-100
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: User Menu Toggle Consistency

*For any* authenticated user state, clicking the avatar button should toggle the dropdown menu visibility (open if closed, close if open), and the menu state should always match the `aria-expanded` attribute.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Reading List Visibility

*For any* user authentication state, the reading list section should be visible if and only if the user is authenticated.

**Validates: Requirements 2.1, 2.5**

### Property 3: Section Removal Completeness

*For any* page load, the "Como Funciona" and "Pronto para sua história" sections should not be present in the DOM.

**Validates: Requirements 3.1, 4.1**

### Property 4: Responsive Layout Adaptation

*For any* viewport width, the layout should adapt appropriately (grid for desktop, single column for mobile) without horizontal scrolling.

**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### User Menu Errors

- **Missing DOM Elements**: Log error and gracefully degrade (don't show menu)
- **Event Listener Failures**: Catch and log, prevent page crash

### Reading List Errors

- **API Failure**: Show empty state with retry option
- **Network Timeout**: Show loading state, then error message
- **Invalid Data**: Filter out invalid items, show valid ones

### Fallback Behavior

- If reading list fails to load, show empty state
- If user menu fails, show basic profile link
- Maintain core navigation functionality

## Testing Strategy

### Unit Tests

1. **User Menu Toggle**
   - Test opening menu from closed state
   - Test closing menu from open state
   - Test closing menu on outside click
   - Test closing menu on Escape key

2. **Reading List Rendering**
   - Test rendering with empty list
   - Test rendering with populated list
   - Test rendering with invalid data
   - Test visibility based on auth state

3. **Section Removal**
   - Verify "Como Funciona" section is not in DOM
   - Verify "Pronto para sua história" section is not in DOM
   - Verify other sections remain intact

### Property-Based Tests

1. **Property 1: Menu Toggle Consistency**
   - Generate random sequences of clicks and outside clicks
   - Verify menu state always matches expected state
   - Verify aria-expanded always matches visibility

2. **Property 2: Reading List Visibility**
   - Generate random auth states (authenticated/not authenticated)
   - Verify section visibility matches auth state
   - Verify no errors occur in either state

3. **Property 3: Layout Responsiveness**
   - Generate random viewport widths
   - Verify layout adapts correctly
   - Verify no horizontal scrolling occurs

### Integration Tests

1. **Full User Flow**
   - Login → See reading list → Click fanfic → Navigate
   - Login → Open user menu → Click profile → Navigate
   - Logout → Verify reading list hidden → Verify menu hidden

2. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify dropdown positioning works in all browsers
   - Verify responsive behavior consistent

## Implementation Notes

### CSS Changes

1. **User Dropdown Positioning**
   ```css
   .user-menu {
       position: relative; /* Ensure dropdown positions relative to this */
   }
   
   .user-dropdown {
       position: absolute;
       top: calc(100% + 10px);
       right: 0;
       min-width: 200px;
       z-index: 1001;
   }
   ```

2. **Reading List Section**
   ```css
   .reading-list-section {
       margin: 2rem 0;
       padding: 2rem 0;
   }
   
   .reading-list-carousel {
       overflow-x: auto;
       -webkit-overflow-scrolling: touch;
   }
   
   .empty-reading-list {
       text-align: center;
       padding: 3rem;
       background: var(--light-gray);
       border-radius: 12px;
   }
   ```

3. **Remove Sections**
   - Delete CSS for `.features-section` (Como Funciona)
   - Delete CSS for `.cta-section` (Pronto para sua história)

### JavaScript Changes

1. **auth-area.js**
   - Verify event listeners are properly attached
   - Ensure `userDropdown` element is correctly selected
   - Add debugging logs to track menu state

2. **homepage.js**
   - Add `loadReadingList()` function
   - Add `renderReadingListSection()` function
   - Integrate into main `loadHomepage()` flow
   - Insert reading list section after hero section

3. **api.js**
   - Add `getReadingList()` method
   - Handle authentication errors gracefully

### HTML Changes

1. **index.html**
   - Remove `<section id="como-funciona">` entirely
   - Remove `<section class="cta-section">` entirely
   - Verify user dropdown structure is correct
   - Add placeholder for reading list section (will be populated by JS)

### Backend Requirements

**New Endpoint**: `GET /api/reading-list`

**Response Format**:
```json
[
    {
        "fanfic_id": 1,
        "fanfic_title": "A Escolha do Dragão",
        "fanfic_cover_url": "/uploads/covers/dragon.jpg",
        "fanfic_category": "Fantasia",
        "fanfic_synopsis": "Sua aventura interativa...",
        "last_chapter_read": 3,
        "total_chapters": 10,
        "last_read_at": "2026-02-03T10:30:00Z",
        "progress_percentage": 30
    }
]
```

**Logic**:
- Query user's reading progress from database
- Join with fanfics table to get fanfic details
- Order by `last_read_at` DESC
- Limit to recent 10-20 items
- Calculate progress percentage

## Performance Considerations

1. **Reading List Caching**
   - Cache reading list in localStorage for 5 minutes
   - Refresh on page load if cache expired
   - Invalidate cache on chapter read completion

2. **Lazy Loading**
   - Load reading list after hero section renders
   - Don't block initial page render

3. **Image Optimization**
   - Use lazy loading for fanfic covers
   - Serve appropriately sized images

## Accessibility

1. **User Menu**
   - Proper ARIA attributes (`aria-expanded`, `aria-haspopup`)
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus management

2. **Reading List**
   - Semantic HTML (`<section>`, `<article>`)
   - Alt text for cover images
   - Keyboard accessible cards

3. **Screen Reader Support**
   - Announce menu state changes
   - Announce reading list loading states
   - Proper heading hierarchy
