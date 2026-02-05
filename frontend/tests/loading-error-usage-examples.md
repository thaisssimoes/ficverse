# Loading and Error States - Usage Examples

## Quick Reference Guide for Developers

This guide shows how to use the new loading and error state utilities in your components.

---

## 1. Loading States

### Basic Loading Spinner

```javascript
// Show loading in a container
const container = document.getElementById('my-container');
Loading.show(container, 'Carregando dados...');
```

### HTML Template

```html
<div class="loading-container">
    <div class="loading-spinner"></div>
    <p class="loading-text">Carregando...</p>
</div>
```

### Button Loading State

```javascript
const button = document.getElementById('submit-btn');

// Show loading
Loading.showButton(button);

// Hide loading
Loading.hideButton(button);
```

---

## 2. Error States

### Error with Retry Button

```javascript
// Show error with retry functionality
const container = document.getElementById('my-container');
ErrorState.show(
    container, 
    'Não foi possível carregar os dados',
    () => {
        // Retry logic here
        loadData();
    }
);
```

### HTML Template

```html
<div class="error-container">
    <div class="error-icon">⚠️</div>
    <p class="error-message">Erro ao carregar dados</p>
    <button class="btn-retry" onclick="retryFunction()">Tentar Novamente</button>
</div>
```

### Error Without Retry

```javascript
// Show error without retry button
ErrorState.show(container, 'Erro ao processar requisição');
```

---

## 3. Empty States

### Basic Empty State

```javascript
const container = document.getElementById('my-container');
ErrorState.showEmpty(
    container,
    'Nenhum resultado encontrado',
    '🔍' // Custom icon
);
```

### HTML Template

```html
<div class="empty-state">
    <div class="empty-icon">📚</div>
    <p class="empty-message">Nenhum item encontrado</p>
</div>
```

---

## 4. Image Fallbacks

### Single Image with Fallback

```javascript
// Create image with automatic fallback
const img = ImageFallback.createWithFallback(
    'https://example.com/image.jpg',
    'Alt text',
    'https://via.placeholder.com/300x450?text=Fallback'
);
container.appendChild(img);
```

### Setup Fallback on Existing Image

```javascript
const img = document.getElementById('my-image');
ImageFallback.setupFallback(img);
```

### Inline HTML Fallback

```html
<img src="image.jpg" 
     alt="Description"
     loading="lazy"
     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sem+Imagem'; this.classList.add('image-fallback');">
```

### Setup All Images in Container

```javascript
const container = document.getElementById('gallery');
ImageFallback.setupAllInContainer(container);
```

---

## 5. Complete Component Example

### Fetching Data with All States

```javascript
class MyComponent {
    constructor() {
        this.container = document.getElementById('my-container');
        this.data = [];
    }
    
    async loadData() {
        try {
            // Show loading
            Loading.show(this.container, 'Carregando dados...');
            
            // Fetch data
            const response = await fetch('/api/data');
            
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }
            
            this.data = await response.json();
            
            // Check if empty
            if (this.data.length === 0) {
                ErrorState.showEmpty(
                    this.container,
                    'Nenhum dado disponível',
                    '📭'
                );
                return;
            }
            
            // Render data
            this.render();
            
        } catch (error) {
            console.error('Error loading data:', error);
            
            // Show error with retry
            ErrorState.show(
                this.container,
                'Não foi possível carregar os dados. Por favor, tente novamente.',
                () => this.loadData() // Retry callback
            );
        }
    }
    
    render() {
        this.container.innerHTML = this.data.map(item => `
            <div class="item">
                <img src="${item.image}" 
                     alt="${item.title}"
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/300x450?text=Sem+Imagem'; this.classList.add('image-fallback');">
                <h3>${item.title}</h3>
            </div>
        `).join('');
        
        // Setup image fallbacks
        ImageFallback.setupAllInContainer(this.container);
    }
}
```

---

## 6. Form Submission Example

```javascript
async function handleSubmit(event) {
    event.preventDefault();
    
    const button = event.target.querySelector('button[type="submit"]');
    const form = event.target;
    
    try {
        // Show loading on button
        Loading.showButton(button);
        
        // Submit form
        const formData = new FormData(form);
        const response = await fetch('/api/submit', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Submission failed');
        }
        
        // Success
        Toast.success('Formulário enviado com sucesso!');
        form.reset();
        
    } catch (error) {
        console.error('Submission error:', error);
        Toast.error('Erro ao enviar formulário. Tente novamente.');
        
    } finally {
        // Always hide loading
        Loading.hideButton(button);
    }
}
```

---

## 7. Search with States

```javascript
class SearchComponent {
    constructor() {
        this.input = document.getElementById('search-input');
        this.results = document.getElementById('search-results');
        this.debounceTimer = null;
    }
    
    async search(query) {
        if (!query.trim()) {
            this.results.innerHTML = '';
            return;
        }
        
        try {
            // Show loading
            Loading.show(this.results, 'Buscando...');
            
            // Fetch results
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.length === 0) {
                // Show no results
                this.results.innerHTML = `
                    <div class="search-no-results">
                        <p>Nenhum resultado encontrado</p>
                    </div>
                `;
                return;
            }
            
            // Render results
            this.renderResults(data);
            
        } catch (error) {
            console.error('Search error:', error);
            
            // Show error briefly
            this.results.innerHTML = `
                <div class="search-error">
                    <p>Erro ao buscar. Tente novamente.</p>
                </div>
            `;
            
            // Hide after 2 seconds
            setTimeout(() => {
                this.results.innerHTML = '';
            }, 2000);
        }
    }
    
    handleInput(event) {
        const query = event.target.value;
        
        // Debounce
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.search(query);
        }, 300);
    }
}
```

---

## 8. Notification Loading

```javascript
class NotificationComponent {
    async loadNotifications() {
        const dropdown = document.getElementById('notifications-dropdown');
        const list = dropdown.querySelector('.notifications-list');
        
        try {
            // Show loading
            list.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Carregando notificações...</p>
                </div>
            `;
            
            // Fetch notifications
            const data = await api.getNotifications();
            
            if (data.notifications.length === 0) {
                list.innerHTML = '<p class="no-notifications">Nenhuma notificação</p>';
                return;
            }
            
            // Render notifications
            this.renderNotifications(data.notifications);
            
        } catch (error) {
            console.error('Error loading notifications:', error);
            
            // Show error with retry
            list.innerHTML = `
                <div class="error-container">
                    <div class="error-icon">⚠️</div>
                    <p class="error-message">Erro ao carregar notificações</p>
                    <button class="btn-retry" onclick="notificationComponent.loadNotifications()">
                        Tentar Novamente
                    </button>
                </div>
            `;
        }
    }
}
```

---

## 9. CSS Customization

### Custom Loading Spinner Color

```css
.loading-spinner {
    border-top-color: #your-color;
}
```

### Custom Error Colors

```css
.error-message {
    color: #your-error-color;
}

.btn-retry {
    background: #your-button-color;
}

.btn-retry:hover {
    background: #your-button-hover-color;
}
```

### Custom Empty State

```css
.empty-state {
    padding: 4rem 2rem;
}

.empty-icon {
    font-size: 4rem;
}
```

---

## 10. Best Practices

### ✅ DO

- Always show loading state before async operations
- Provide retry buttons on errors
- Use specific, user-friendly error messages
- Set up image fallbacks on all images
- Clear loading states in finally blocks
- Use debouncing for search inputs

### ❌ DON'T

- Don't leave users without feedback during loading
- Don't show technical error messages to users
- Don't forget to handle empty states
- Don't create infinite retry loops
- Don't block UI during loading
- Don't forget to clean up event listeners

---

## 11. Accessibility Considerations

```html
<!-- Loading with ARIA -->
<div class="loading-container" role="status" aria-live="polite">
    <div class="loading-spinner"></div>
    <p class="loading-text">Carregando...</p>
</div>

<!-- Error with ARIA -->
<div class="error-container" role="alert" aria-live="assertive">
    <div class="error-icon" aria-hidden="true">⚠️</div>
    <p class="error-message">Erro ao carregar dados</p>
    <button class="btn-retry" aria-label="Tentar carregar novamente">
        Tentar Novamente
    </button>
</div>

<!-- Image with alt text -->
<img src="image.jpg" 
     alt="Descrição significativa da imagem"
     loading="lazy"
     onerror="this.onerror=null; this.src='placeholder.jpg'; this.classList.add('image-fallback');">
```

---

## 12. Testing Your Implementation

```javascript
// Test loading state
function testLoading() {
    const container = document.getElementById('test-container');
    Loading.show(container, 'Testing...');
    
    setTimeout(() => {
        console.log('Loading displayed correctly');
    }, 1000);
}

// Test error state
function testError() {
    const container = document.getElementById('test-container');
    ErrorState.show(container, 'Test error', () => {
        console.log('Retry clicked');
    });
}

// Test image fallback
function testImageFallback() {
    const img = document.createElement('img');
    img.src = 'https://invalid-url.com/image.jpg';
    ImageFallback.setupFallback(img);
    document.body.appendChild(img);
    
    setTimeout(() => {
        console.log('Fallback applied:', img.classList.contains('image-fallback'));
    }, 1000);
}
```

---

## Need Help?

- Check `frontend/tests/loading-error-states.test.html` for interactive examples
- Check `frontend/tests/loading-error-integration.html` for integration examples
- Review `frontend/js/ui-utils.js` for utility source code
- See existing components (hero-section.js, trending-section.js) for real implementations
