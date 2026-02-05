# Design Document: Homepage Redesign

## Overview

Redesenho completo da homepage da plataforma de fanfics interativas, inspirado no layout moderno do FicVerse. O novo design prioriza descoberta de conteúdo, navegação intuitiva e acesso rápido à autenticação, com um header completo contendo logo, busca, menu de categorias, notificações e área de autenticação.

## Architecture

### Component Structure

```
Homepage
├── Header (Fixed)
│   ├── Logo
│   ├── SearchBar
│   ├── CategoriesMenu (Dropdown)
│   ├── NotificationBell
│   └── AuthArea (Login/Register or Avatar)
├── HeroSection
│   ├── BackgroundImage
│   ├── FanficTitle
│   ├── InteractiveBadge
│   ├── CTAButton
│   └── NavigationArrows
├── QuickFilters
│   └── FilterButtons[]
├── TrendingSection
│   └── FanficCarousel
│       └── FanficCard[]
└── Footer
```

### State Management

```javascript
const HomepageState = {
  user: {
    isAuthenticated: boolean,
    avatar: string | null,
    unreadNotifications: number
  },
  categories: Category[],
  selectedCategory: string,
  featuredFanfics: Fanfic[],
  currentFeaturedIndex: number,
  trendingFanfics: Fanfic[],
  searchQuery: string,
  isCategoriesMenuOpen: boolean,
  isNotificationsOpen: boolean,
  isUserMenuOpen: boolean
}
```

## Components and Interfaces

### 1. Header Component

**Purpose:** Barra de navegação fixa no topo com todas as funcionalidades principais

**Structure:**
```html
<header class="main-header">
  <div class="header-container">
    <a href="/" class="logo">FicVerse</a>
    
    <div class="search-bar">
      <input type="text" placeholder="Busca em FoVene..." />
      <button class="search-icon">🔍</button>
    </div>
    
    <div class="header-actions">
      <button class="categories-btn">Categorias ▼</button>
      <button class="notification-bell">🔔</button>
      <div class="auth-area">
        <!-- Not authenticated -->
        <a href="login.html" class="btn-entrar">Entrar</a>
        <a href="register.html" class="btn-cadastrar">Cadastrar</a>
        
        <!-- Authenticated -->
        <img src="avatar.jpg" class="user-avatar" />
      </div>
    </div>
  </div>
</header>
```

**Styling:**
- Fixed position at top
- Semi-transparent dark background with backdrop-filter blur
- Height: 70px
- Max-width: 1400px centered
- Z-index: 1000

### 2. Categories Menu Component

**Purpose:** Dropdown menu para navegação por categorias

**Structure:**
```html
<div class="categories-dropdown">
  <div class="categories-list">
    <button class="category-item active">Todos</button>
    <button class="category-item">⚡ Interativos</button>
    <button class="category-item">K-Pop</button>
    <button class="category-item">Romance</button>
    <button class="category-item">Fantasia</button>
    <button class="category-item">Ficção Científica</button>
    <button class="category-item">Terror</button>
    <button class="category-item">Aventura</button>
    <button class="category-item">Drama</button>
    <button class="category-item">Comédia</button>
  </div>
</div>
```

**Behavior:**
- Opens on click of "Categorias" button
- Closes on outside click or category selection
- Positioned below the categories button
- Smooth fade-in animation
- Filters content when category selected

### 3. Auth Area Component

**Purpose:** Área de autenticação que muda baseado no estado do usuário

**States:**

**Not Authenticated:**
```html
<div class="auth-buttons">
  <a href="login.html" class="btn-entrar">Entrar</a>
  <a href="register.html" class="btn-cadastrar">Cadastrar</a>
</div>
```

**Authenticated:**
```html
<div class="user-menu">
  <img src="avatar.jpg" class="user-avatar" alt="User" />
  <div class="user-dropdown">
    <a href="profile.html">Meu Perfil</a>
    <a href="dashboard.html">Minhas Fanfics</a>
    <a href="settings.html">Configurações</a>
    <button class="logout-btn">Sair</button>
  </div>
</div>
```

### 4. Notification Bell Component

**Purpose:** Exibir notificações para usuários autenticados

**Structure:**
```html
<button class="notification-bell">
  <svg class="bell-icon">...</svg>
  <span class="notification-badge">3</span>
</button>

<div class="notifications-dropdown">
  <div class="notifications-header">
    <h3>Notificações</h3>
    <button class="mark-all-read">Marcar todas como lidas</button>
  </div>
  <div class="notifications-list">
    <div class="notification-item unread">
      <div class="notification-content">
        <p><strong>João</strong> comentou em sua fanfic</p>
        <span class="notification-time">há 5 minutos</span>
      </div>
    </div>
    <!-- More notifications -->
  </div>
</div>
```

**Behavior:**
- Only visible when user is authenticated
- Badge shows count of unread notifications
- Dropdown opens on click
- Real-time updates via WebSocket (future enhancement)

### 5. Hero Section Component

**Purpose:** Seção de destaque com fanfic em evidência

**Structure:**
```html
<section class="hero-section">
  <div class="hero-background">
    <img src="featured-fanfic-cover.jpg" alt="Featured" />
    <div class="hero-overlay"></div>
  </div>
  
  <div class="hero-content">
    <button class="hero-nav-btn prev">‹</button>
    
    <div class="hero-info">
      <span class="interactive-badge">✨ DESTAQUE INTERATIVO</span>
      <h1 class="hero-title">A Escolha do Dragão</h1>
      <p class="hero-subtitle">Sua aventura interativa. Você decide o destino.</p>
      <a href="fanfic-detail.html?id=123" class="btn-start-reading">Começar a Ler</a>
    </div>
    
    <button class="hero-nav-btn next">›</button>
  </div>
</section>
```

**Styling:**
- Height: 500px
- Background image with gradient overlay
- Content centered with flexbox
- Navigation arrows on sides
- Smooth transition between featured fanfics

### 6. Quick Filters Component

**Purpose:** Filtros rápidos de categoria abaixo da busca

**Structure:**
```html
<div class="quick-filters">
  <button class="filter-btn active">Todos</button>
  <button class="filter-btn">⚡ Interativos</button>
  <button class="filter-btn">K-Pop</button>
  <button class="filter-btn">Romance</button>
</div>
```

**Behavior:**
- Horizontal scrollable on mobile
- Active state highlights selected filter
- Filters trending section content

### 7. Trending Section Component

**Purpose:** Seção "Bombando Hoje" com carousel de fanfics

**Structure:**
```html
<section class="trending-section">
  <h2 class="section-title">Bombando Hoje 🔥</h2>
  
  <div class="fanfic-carousel">
    <button class="carousel-nav prev">‹</button>
    
    <div class="fanfic-grid">
      <div class="fanfic-card">
        <div class="fanfic-cover">
          <img src="cover.jpg" alt="Fanfic" />
          <span class="fanfic-badge">📖 LEITURA</span>
        </div>
        <div class="fanfic-info">
          <h3 class="fanfic-title">Título da Fanfic</h3>
          <p class="fanfic-author">Por @autor</p>
          <div class="fanfic-stats">
            <span>👁️ 1.2k</span>
            <span>❤️ 234</span>
          </div>
        </div>
      </div>
      <!-- More cards -->
    </div>
    
    <button class="carousel-nav next">›</button>
  </div>
</section>
```

**Styling:**
- Grid layout: 4 columns on desktop, 2 on tablet, 1 on mobile
- Card hover effect: lift and shadow
- Smooth horizontal scroll
- Badge overlay on cover image

## Data Models

### User Model
```typescript
interface User {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  isAuthenticated: boolean;
}
```

### Category Model
```typescript
interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  count: number;
}
```

### Fanfic Model
```typescript
interface Fanfic {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  author: {
    id: number;
    username: string;
    avatar: string;
  };
  category: string;
  isInteractive: boolean;
  isFeatured: boolean;
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  createdAt: string;
}
```

### Notification Model
```typescript
interface Notification {
  id: number;
  type: 'comment' | 'like' | 'follow' | 'system';
  content: string;
  actor: {
    username: string;
    avatar: string;
  };
  targetUrl: string;
  isRead: boolean;
  createdAt: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Auth State Display Consistency
*For any* user authentication state (logged in or logged out), the auth area should display exactly one of: login/register buttons OR user avatar, never both or neither.

**Validates: Requirements 1.5, 1.6, 3.1, 3.4**

### Property 2: Header Fixed Position Consistency
*For any* scroll position on the homepage, the header should remain fixed at the top with position:fixed CSS property and maintain full visibility.

**Validates: Requirements 1.7**

### Property 3: Categories Menu Toggle Behavior
*For any* click on the categories menu button, the dropdown should toggle between open and closed states, and clicking outside should close it.

**Validates: Requirements 2.1, 2.4**

### Property 4: Category Filter Application
*For any* selected category filter, all displayed fanfics in the trending section should belong to that category, or show all fanfics if "Todos" is selected.

**Validates: Requirements 2.3, 6.4**

### Property 5: User Menu Toggle Behavior
*For any* authenticated user, clicking the avatar should toggle the user dropdown menu between open and closed states.

**Validates: Requirements 3.5**

### Property 6: Hero Background Image Consistency
*For any* featured fanfic displayed in the hero section, the background image should match the fanfic's cover image property.

**Validates: Requirements 4.1**

### Property 7: Featured Fanfic Navigation Bounds
*For any* featured fanfic carousel state with N fanfics, the previous button should be disabled when currentIndex is 0, and the next button should be disabled when currentIndex is N-1.

**Validates: Requirements 4.7**

### Property 8: Search Suggestions Display
*For any* non-empty search input, the system should display search suggestions after a debounce period.

**Validates: Requirements 5.3**

### Property 9: Search Bar Responsive Behavior
*For any* viewport width less than 768px, the search bar should collapse or adjust its width to fit the mobile layout.

**Validates: Requirements 5.5**

### Property 10: Quick Filter Active State
*For any* selected quick filter button, exactly one filter should have the active class at any given time.

**Validates: Requirements 6.3**

### Property 11: Fanfic Card Cover Display
*For any* fanfic card rendered, the card should display a cover image element with a valid src attribute.

**Validates: Requirements 7.3**

### Property 12: Interactive Badge Accuracy
*For any* fanfic card displayed, the badge should show "⚡ INTERATIVO" if and only if the fanfic's isInteractive property is true, otherwise show "📖 LEITURA".

**Validates: Requirements 7.4**

### Property 13: Fanfic Card Click Navigation
*For any* fanfic card, clicking it should trigger navigation to the fanfic detail page with the correct fanfic ID.

**Validates: Requirements 7.5**

### Property 14: Carousel Scroll Behavior on Mobile
*For any* viewport width less than 768px, the fanfic carousel should support horizontal scrolling or touch swipe gestures.

**Validates: Requirements 7.6**

### Property 15: Mobile Header Responsiveness
*For any* viewport width less than 768px, the header should adapt by collapsing the search bar while keeping categories menu and auth area accessible.

**Validates: Requirements 8.1, 8.2**

### Property 16: Mobile Hero Section Responsiveness
*For any* viewport width less than 768px, the hero section should adjust image and text sizes to fit the mobile viewport.

**Validates: Requirements 8.3**

### Property 17: Mobile Fanfic Cards Layout
*For any* viewport width less than 768px, fanfic cards should either stack vertically or scroll horizontally in a carousel.

**Validates: Requirements 8.4**

### Property 18: Viewport Width Usability
*For any* viewport width between 320px and 1920px, all content should remain accessible without horizontal scrolling (except intentional carousels), and no content should be cut off.

**Validates: Requirements 8.5**

### Property 19: Notification Bell Visibility
*For any* authenticated user, the notification bell should be visible in the header; for non-authenticated users, it should not be rendered.

**Validates: Requirements 9.1**

### Property 20: Notification Badge Count Accuracy
*For any* authenticated user with N unread notifications where N > 0, the notification bell badge should display the count N; if N = 0, no badge should be displayed.

**Validates: Requirements 9.2**

### Property 21: Notifications Dropdown Toggle
*For any* authenticated user, clicking the notification bell should toggle the notifications dropdown between open and closed states.

**Validates: Requirements 9.3**

### Property 22: Notification Click Navigation
*For any* notification in the dropdown, clicking it should navigate to the relevant page specified in the notification's targetUrl property.

**Validates: Requirements 9.4**

### Property 23: Text Contrast on Dark Background
*For any* text element on a dark background, the color contrast ratio should meet WCAG AA standards (at least 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 10.3**

### Property 24: Interactive Element Hover States
*For any* interactive element (buttons, links, cards), hovering should trigger a visual state change with appropriate contrast that meets accessibility standards.

**Validates: Requirements 10.5**

## Error Handling

### Network Errors
- Display loading spinner while fetching data
- Show error message if API request fails
- Provide retry button for failed requests
- Cache last successful data for offline viewing

### Authentication Errors
- Redirect to login page if token expires
- Show clear error messages for failed login attempts
- Preserve intended destination after login

### Image Loading Errors
- Use placeholder images for failed cover loads
- Lazy load images as user scrolls
- Optimize image sizes for performance

### Search Errors
- Handle empty search results gracefully
- Provide search suggestions for typos
- Show recent searches if available

## Testing Strategy

### Unit Tests
- Test individual component rendering
- Test state management functions
- Test utility functions (date formatting, text truncation)
- Test API service methods

### Property-Based Tests
- Use fast-check library for JavaScript property testing
- Minimum 100 iterations per property test
- Each test references its design property number

**Example Property Test:**
```javascript
// Feature: homepage-redesign, Property 2: Auth State Display Consistency
fc.assert(
  fc.property(
    fc.record({
      isAuthenticated: fc.boolean(),
      avatar: fc.option(fc.webUrl())
    }),
    (userState) => {
      const authArea = renderAuthArea(userState);
      const hasLoginButtons = authArea.querySelector('.btn-entrar') !== null;
      const hasAvatar = authArea.querySelector('.user-avatar') !== null;
      
      // Should have exactly one: login buttons XOR avatar
      return (hasLoginButtons && !hasAvatar) || (!hasLoginButtons && hasAvatar);
    }
  ),
  { numRuns: 100 }
);
```

### Integration Tests
- Test header interactions (menu opening/closing)
- Test category filtering flow
- Test featured fanfic navigation
- Test search functionality
- Test authentication flow

### Visual Regression Tests
- Capture screenshots of key states
- Compare against baseline images
- Test responsive breakpoints

### Accessibility Tests
- Test keyboard navigation
- Test screen reader compatibility
- Test color contrast ratios
- Test focus indicators

## Implementation Notes

### Performance Optimizations
1. **Lazy Loading:** Load images as they enter viewport
2. **Debouncing:** Debounce search input (300ms delay)
3. **Caching:** Cache API responses for 5 minutes
4. **Code Splitting:** Load carousel library only when needed
5. **Image Optimization:** Use WebP format with JPEG fallback

### Browser Compatibility
- Support last 2 versions of major browsers
- Provide fallbacks for CSS backdrop-filter
- Use polyfills for IntersectionObserver (lazy loading)

### Accessibility Features
- Semantic HTML elements
- ARIA labels for icon buttons
- Keyboard navigation support
- Focus trap in dropdown menus
- Skip to content link

### SEO Considerations
- Server-side rendering for initial content
- Proper meta tags and Open Graph tags
- Structured data for fanfics
- Sitemap generation

### Security Measures
- Content Security Policy headers
- XSS protection via input sanitization
- CSRF tokens for authenticated requests
- Rate limiting on search API
