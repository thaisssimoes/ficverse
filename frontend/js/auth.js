// Authentication UI Logic

class AuthUI {
    constructor() {
        this.api = api; // Use the global API client
    }

    // Validation helpers
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password.length >= 8;
    }

    validateUsername(username) {
        return username.length >= 3;
    }

    // Display error message
    showError(message, formElement) {
        // Remove existing error messages
        const existingError = formElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Create and display new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background-color: var(--pastel-pink);
            color: var(--intense-pink);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-weight: 600;
            text-align: center;
            animation: shake 0.5s ease;
        `;
        errorDiv.textContent = message;
        
        formElement.insertBefore(errorDiv, formElement.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    // Display success message
    showSuccess(message, formElement) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background-color: var(--pastel-blue);
            color: var(--intense-blue);
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            font-weight: 600;
            text-align: center;
        `;
        successDiv.textContent = message;
        
        formElement.insertBefore(successDiv, formElement.firstChild);
    }

    // Show field-specific validation error
    showFieldError(inputElement, message) {
        // Remove existing error
        const existingError = inputElement.parentElement.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error class to input
        inputElement.classList.add('error');

        // Create error message
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.style.cssText = `
            color: var(--intense-pink);
            font-size: 0.875rem;
            margin-top: 0.25rem;
            display: block;
        `;
        errorSpan.textContent = message;
        
        inputElement.parentElement.appendChild(errorSpan);
    }

    // Clear field error
    clearFieldError(inputElement) {
        inputElement.classList.remove('error');
        const errorSpan = inputElement.parentElement.querySelector('.field-error');
        if (errorSpan) {
            errorSpan.remove();
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');
        const submitButton = form.querySelector('button[type="submit"]');
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous errors
        this.clearFieldError(emailInput);
        this.clearFieldError(passwordInput);

        // Validate inputs
        let hasError = false;

        if (!email) {
            this.showFieldError(emailInput, 'Email é obrigatório');
            hasError = true;
        } else if (!this.validateEmail(email)) {
            this.showFieldError(emailInput, 'Email inválido');
            hasError = true;
        }

        if (!password) {
            this.showFieldError(passwordInput, 'Senha é obrigatória');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Entrando...';

        try {
            const response = await this.api.login(email, password);
            
            // Show success message
            this.showSuccess('Login realizado com sucesso! Redirecionando...', form);
            
            // Redirect to homepage after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            // Show error message
            this.showError(error.message || 'Erro ao fazer login. Verifique suas credenciais.', form);
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Entrar';
        }
    }

    // Handle registration form submission
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const usernameInput = form.querySelector('#username');
        const emailInput = form.querySelector('#email');
        const passwordInput = form.querySelector('#password');
        const submitButton = form.querySelector('button[type="submit"]');
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Clear previous errors
        this.clearFieldError(usernameInput);
        this.clearFieldError(emailInput);
        this.clearFieldError(passwordInput);

        // Validate inputs
        let hasError = false;

        if (!username) {
            this.showFieldError(usernameInput, 'Nome de usuário é obrigatório');
            hasError = true;
        } else if (!this.validateUsername(username)) {
            this.showFieldError(usernameInput, 'Nome de usuário deve ter pelo menos 3 caracteres');
            hasError = true;
        }

        if (!email) {
            this.showFieldError(emailInput, 'Email é obrigatório');
            hasError = true;
        } else if (!this.validateEmail(email)) {
            this.showFieldError(emailInput, 'Email inválido');
            hasError = true;
        }

        if (!password) {
            this.showFieldError(passwordInput, 'Senha é obrigatória');
            hasError = true;
        } else if (!this.validatePassword(password)) {
            this.showFieldError(passwordInput, 'Senha deve ter pelo menos 8 caracteres');
            hasError = true;
        }

        if (hasError) {
            return;
        }

        // Disable submit button
        submitButton.disabled = true;
        submitButton.textContent = 'Registrando...';

        try {
            const response = await this.api.register(username, email, password);
            
            // Show success message
            this.showSuccess('Conta criada com sucesso! Redirecionando...', form);
            
            // Redirect to homepage after short delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            // Show error message
            let errorMessage = 'Erro ao criar conta. Tente novamente.';
            
            if (error.message.includes('email')) {
                errorMessage = 'Este email já está em uso.';
            } else if (error.message.includes('username') || error.message.includes('usuário')) {
                errorMessage = 'Este nome de usuário já está em uso.';
            } else if (error.message.includes('duplicate')) {
                errorMessage = 'Este email ou nome de usuário já está em uso.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            this.showError(errorMessage, form);
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.textContent = 'Registrar';
        }
    }

    // Initialize form listeners
    initLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            
            // Add real-time validation
            const emailInput = loginForm.querySelector('#email');
            const passwordInput = loginForm.querySelector('#password');
            
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !this.validateEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Email inválido');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
            
            emailInput.addEventListener('input', () => {
                if (emailInput.classList.contains('error')) {
                    this.clearFieldError(emailInput);
                }
            });
            
            passwordInput.addEventListener('input', () => {
                if (passwordInput.classList.contains('error')) {
                    this.clearFieldError(passwordInput);
                }
            });
        }
    }

    initRegisterForm() {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            
            // Add real-time validation
            const usernameInput = registerForm.querySelector('#username');
            const emailInput = registerForm.querySelector('#email');
            const passwordInput = registerForm.querySelector('#password');
            
            usernameInput.addEventListener('blur', () => {
                if (usernameInput.value && !this.validateUsername(usernameInput.value)) {
                    this.showFieldError(usernameInput, 'Nome de usuário deve ter pelo menos 3 caracteres');
                } else {
                    this.clearFieldError(usernameInput);
                }
            });
            
            usernameInput.addEventListener('input', () => {
                if (usernameInput.classList.contains('error')) {
                    this.clearFieldError(usernameInput);
                }
            });
            
            emailInput.addEventListener('blur', () => {
                if (emailInput.value && !this.validateEmail(emailInput.value)) {
                    this.showFieldError(emailInput, 'Email inválido');
                } else {
                    this.clearFieldError(emailInput);
                }
            });
            
            emailInput.addEventListener('input', () => {
                if (emailInput.classList.contains('error')) {
                    this.clearFieldError(emailInput);
                }
            });
            
            passwordInput.addEventListener('blur', () => {
                if (passwordInput.value && !this.validatePassword(passwordInput.value)) {
                    this.showFieldError(passwordInput, 'Senha deve ter pelo menos 8 caracteres');
                } else {
                    this.clearFieldError(passwordInput);
                }
            });
            
            passwordInput.addEventListener('input', () => {
                if (passwordInput.classList.contains('error')) {
                    this.clearFieldError(passwordInput);
                }
            });
        }
    }
}

// Initialize auth UI when DOM is loaded
const authUI = new AuthUI();
