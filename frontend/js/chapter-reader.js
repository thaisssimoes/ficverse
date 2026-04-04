// Chapter Reader functionality

let currentChapter = null;
let currentFanfic = null;
let allChapters = [];
let readingMode = 'non-interactive';
let userAnswers = {};
let questions = [];
let pendingQuestions = [];
let comments = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Get chapter ID and mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const chapterId = urlParams.get('id');
    const mode = urlParams.get('mode') || 'non-interactive';

    if (!chapterId) {
        showError('ID do capítulo não encontrado');
        return;
    }

    readingMode = mode;
    await loadChapter(parseInt(chapterId));
    
    // Setup comment form
    setupCommentForm();
});

async function loadChapter(chapterId) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const readerEl = document.getElementById('chapter-reader');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        readerEl.style.display = 'none';

        // Fetch chapter details
        currentChapter = await api.getChapter(chapterId);
        
        // Fetch fanfic details
        currentFanfic = await api.getFanfic(currentChapter.fanfic_id);
        
        // Fetch all chapters for navigation
        allChapters = await api.getChapters(currentChapter.fanfic_id);
        allChapters.sort((a, b) => a.order - b.order);

        // If interactive mode, check for pending questions and load answers
        if (readingMode === 'interactive') {
            await checkPendingQuestionsAndAnswers();
        }

        // Display chapter
        displayChapter();
        setupNavigation();

        // Save reading progress (fire and forget)
        if (api.isAuthenticated() && currentChapter && currentFanfic) {
            const chapterOrder = currentChapter.order || allChapters.findIndex(c => c.id === currentChapter.id) + 1;
            api.updateReadingProgress(currentFanfic.id, chapterOrder).catch(() => {});
        }

        // Load comments for this chapter
        await loadComments(chapterId);

        loadingEl.style.display = 'none';
        readerEl.style.display = 'block';

    } catch (error) {
        console.error('Error loading chapter:', error);
        showError('Erro ao carregar capítulo. Por favor, tente novamente.');
    }
}

async function checkPendingQuestionsAndAnswers() {
    try {
        // Load questions for the fanfic
        questions = await api.getQuestions(currentChapter.fanfic_id);

        // Check for pending questions if user is authenticated
        if (api.token) {
            try {
                const pendingResponse = await api.request(`/fanfics/${currentChapter.fanfic_id}/pending-questions`);
                pendingQuestions = pendingResponse.questions || [];
                
                // If there are pending questions, show notification
                if (pendingQuestions.length > 0) {
                    showPendingQuestionsNotification();
                    return;
                }
            } catch (error) {
                console.log('No pending questions or error checking:', error);
            }

            // Load existing answers
            try {
                userAnswers = await api.getAnswers(currentChapter.fanfic_id);
            } catch (error) {
                console.error('Erro ao carregar respostas:', error);
                userAnswers = {};
            }
        } else {
            // For non-authenticated users, try to load from sessionStorage
            const storedAnswers = sessionStorage.getItem(`fanfic_${currentChapter.fanfic_id}_answers`);
            if (storedAnswers) {
                userAnswers = JSON.parse(storedAnswers);
            }
        }

        // If no answers exist, prompt user to answer questions
        if (Object.keys(userAnswers).length === 0 && questions.length > 0) {
            await openQuestionsModal();
        }

    } catch (error) {
        console.error('Error checking pending questions:', error);
    }
}

function showPendingQuestionsNotification() {
    const notificationEl = document.getElementById('pending-notification');
    notificationEl.style.display = 'block';
    
    // Hide the chapter reader until user responds
    document.getElementById('chapter-reader').style.display = 'none';
}

function displayChapter() {
    // Set chapter title and number
    document.getElementById('chapter-title').textContent = currentChapter.title;
    document.getElementById('chapter-number').textContent = `Capítulo ${currentChapter.order}`;

    // Set back link
    const backLink = document.getElementById('back-to-fanfic');
    backLink.href = `fanfic-detail.html?id=${currentChapter.fanfic_id}`;

    // Display mode indicator
    const modeIndicator = document.getElementById('mode-indicator');
    if (readingMode === 'interactive') {
        modeIndicator.innerHTML = '<span class="mode-badge interactive">✨ Modo Interativo</span>';
    } else {
        modeIndicator.innerHTML = '<span class="mode-badge normal">📖 Modo Normal</span>';
    }

    // Process and display chapter content
    const chapterTextEl = document.getElementById('chapter-text');
    let content = currentChapter.content || '';

    // Substitute placeholders in interactive mode
    if (readingMode === 'interactive' && Object.keys(userAnswers).length > 0) {
        content = substitutePlaceholders(content, userAnswers);
    }

    // Chapter content is stored as HTML from the rich text editor.
    // Sanitize and render directly instead of treating as plain text.
    chapterTextEl.innerHTML = DOMPurify.sanitize(content);
}

function substitutePlaceholders(content, answers) {
    let processedContent = content;

    // Escape special regex characters in placeholder names to prevent errors
    function escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Replace each placeholder with its corresponding answer
    for (const [placeholder, answer] of Object.entries(answers)) {
        const escaped = escapeRegex(placeholder);
        // Match placeholders in format {{placeholder}} or {placeholder}
        const regex = new RegExp(`\\{\\{${escaped}\\}\\}|\\{${escaped}\\}`, 'g');
        processedContent = processedContent.replace(regex, answer);
    }

    return processedContent;
}

function setupNavigation() {
    const currentIndex = allChapters.findIndex(ch => ch.id === currentChapter.id);
    
    const prevBtn = document.getElementById('btn-prev-chapter');
    const nextBtn = document.getElementById('btn-next-chapter');

    // Setup previous chapter button
    if (currentIndex > 0) {
        const prevChapter = allChapters[currentIndex - 1];
        prevBtn.style.display = 'inline-block';
        prevBtn.onclick = () => navigateToChapter(prevChapter.id);
    } else {
        prevBtn.style.display = 'none';
    }

    // Setup next chapter button
    if (currentIndex < allChapters.length - 1) {
        const nextChapter = allChapters[currentIndex + 1];
        nextBtn.style.display = 'inline-block';
        nextBtn.onclick = () => navigateToChapter(nextChapter.id);
    } else {
        nextBtn.style.display = 'none';
    }
}

function navigateToChapter(chapterId) {
    // Reload page with new chapter ID, preserving mode
    window.location.href = `chapter-reader.html?id=${chapterId}&mode=${readingMode}`;
}

// Pending Questions Handlers
function answerPendingQuestions() {
    // Hide notification and show questions modal
    document.getElementById('pending-notification').style.display = 'none';
    openQuestionsModal();
}

function switchToNonInteractive() {
    // Switch to non-interactive mode
    readingMode = 'non-interactive';
    sessionStorage.setItem(`fanfic_${currentChapter.fanfic_id}_mode`, 'non-interactive');
    
    // Hide notification and display chapter
    document.getElementById('pending-notification').style.display = 'none';
    displayChapter();
    document.getElementById('chapter-reader').style.display = 'block';
}

// Questions Modal Functions
async function openQuestionsModal() {
    const modal = document.getElementById('questions-modal');
    const questionsContainer = document.getElementById('questions-container');
    const validationMessage = document.getElementById('validation-message');
    
    // Hide validation message
    validationMessage.style.display = 'none';
    
    // Load questions if not already loaded
    if (questions.length === 0) {
        try {
            questions = await api.getQuestions(currentChapter.fanfic_id);
        } catch (error) {
            console.error('Error loading questions:', error);
            alert('Erro ao carregar perguntas. Por favor, tente novamente.');
            return;
        }
    }
    
    // Render questions (only pending ones if applicable)
    const questionsToShow = pendingQuestions.length > 0 
        ? questions.filter(q => pendingQuestions.some(pq => pq.question_id === q.id))
        : questions;
    
    questionsContainer.innerHTML = questionsToShow.map((question, index) => {
        const existingAnswer = userAnswers[question.placeholder] || '';
        return `
            <div class="question-item">
                <label class="question-label" for="question-${question.id}">
                    ${index + 1}. ${question.question_text}
                </label>
                <input 
                    type="text" 
                    id="question-${question.id}" 
                    class="question-input" 
                    data-placeholder="${question.placeholder}"
                    value="${existingAnswer}"
                    placeholder="Digite sua resposta..."
                    required
                />
            </div>
        `;
    }).join('');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus first input
    setTimeout(() => {
        const firstInput = questionsContainer.querySelector('.question-input');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function closeQuestionsModal() {
    const modal = document.getElementById('questions-modal');
    modal.style.display = 'none';
}

async function submitAnswers() {
    const questionsContainer = document.getElementById('questions-container');
    const inputs = questionsContainer.querySelectorAll('.question-input');
    const validationMessage = document.getElementById('validation-message');
    
    // Collect answers
    const answers = {};
    let allAnswered = true;
    
    inputs.forEach(input => {
        const placeholder = input.dataset.placeholder;
        const value = input.value.trim();
        
        if (value === '') {
            allAnswered = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
            answers[placeholder] = value;
        }
    });
    
    // Validate all questions are answered
    if (!allAnswered) {
        validationMessage.style.display = 'block';
        return;
    }
    
    // Hide validation message
    validationMessage.style.display = 'none';
    
    try {
        // Save answers to backend if user is authenticated
        if (api.token) {
            await api.saveAnswers(currentChapter.fanfic_id, answers);
        } else {
            // Store answers in sessionStorage for non-authenticated users
            sessionStorage.setItem(`fanfic_${currentChapter.fanfic_id}_answers`, JSON.stringify(answers));
        }
        
        // Update user answers
        userAnswers = { ...userAnswers, ...answers };
        
        // Clear pending questions
        pendingQuestions = [];
        
        // Close modal
        closeQuestionsModal();
        
        // Refresh chapter display with new answers
        displayChapter();
        
        // Show chapter reader if it was hidden
        document.getElementById('chapter-reader').style.display = 'block';
        
    } catch (error) {
        console.error('Error saving answers:', error);
        alert('Erro ao salvar respostas. Por favor, tente novamente.');
    }
}

function showError(message) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const readerEl = document.getElementById('chapter-reader');

    loadingEl.style.display = 'none';
    readerEl.style.display = 'none';
    errorEl.style.display = 'block';
    errorEl.querySelector('p').textContent = message;
}

// Comment Functions

function setupCommentForm() {
    const commentForm = document.getElementById('comment-form');
    const commentFormContainer = document.getElementById('comment-form-container');
    
    // Show comment form only if user is authenticated
    if (api.token) {
        commentFormContainer.style.display = 'block';
        
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitComment();
        });
    }
}

async function loadComments(chapterId) {
    const commentsContainer = document.getElementById('comments-container');
    const loadingEl = document.getElementById('comments-loading');
    const emptyEl = document.getElementById('comments-empty');
    
    try {
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        
        // Fetch chapter comments
        comments = await api.getChapterComments(chapterId);
        
        loadingEl.style.display = 'none';
        
        if (!comments || comments.length === 0) {
            emptyEl.style.display = 'block';
            return;
        }
        
        // Sort comments chronologically (oldest first)
        const sortedComments = [...comments].sort((a, b) => {
            return new Date(a.created_at) - new Date(b.created_at);
        });
        
        // Render comments
        renderComments(sortedComments);
        
    } catch (error) {
        console.error('Error loading comments:', error);
        loadingEl.style.display = 'none';
        emptyEl.style.display = 'block';
    }
}

function renderComments(commentsToRender) {
    const commentsContainer = document.getElementById('comments-container');
    const loadingEl = document.getElementById('comments-loading');
    const emptyEl = document.getElementById('comments-empty');
    
    // Clear existing comments (except loading and empty elements)
    const existingComments = commentsContainer.querySelectorAll('.comment-card');
    existingComments.forEach(comment => comment.remove());
    
    // Hide loading and empty states
    loadingEl.style.display = 'none';
    emptyEl.style.display = 'none';
    
    // Render each comment
    commentsToRender.forEach(comment => {
        const commentEl = createCommentElement(comment);
        commentsContainer.appendChild(commentEl);
    });
}

function createCommentElement(comment) {
    const commentCard = document.createElement('div');
    commentCard.className = 'comment-card';
    commentCard.dataset.commentId = comment.id;
    
    // Format timestamp
    const timestamp = formatTimestamp(comment.created_at);
    
    // Check if current user can delete this comment
    const canDelete = checkDeleteAuthorization(comment);
    
    commentCard.innerHTML = `
        <div class="comment-header">
            <div class="comment-meta">
                <div class="comment-author-name">${comment.username || 'Usuário'}</div>
                <div class="comment-timestamp">${timestamp}</div>
            </div>
            ${canDelete ? `
                <button class="comment-delete-btn" onclick="deleteComment(${comment.id})" title="Excluir comentário">
                    🗑️
                </button>
            ` : ''}
        </div>
        <div class="comment-body">${escapeHtml(comment.content)}</div>
    `;
    
    return commentCard;
}

function checkDeleteAuthorization(comment) {
    // User can delete if:
    // 1. They are the comment author
    // 2. They are the fanfic owner
    
    if (!api.token) {
        return false;
    }
    
    // Get current user ID from stored user data
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (comment.user_id === storedUser.id) {
        return true;
    }
    
    if (currentFanfic && currentFanfic.author_id === storedUser.id) {
        return true;
    }
    
    return false;
}

async function submitComment() {
    const commentInput = document.getElementById('comment-input');
    const content = commentInput.value.trim();
    
    if (!content) {
        return;
    }
    
    if (!api.token) {
        alert('Você precisa estar logado para comentar.');
        return;
    }
    
    try {
        // Create comment on chapter using the API client
        // We need to add a method to api.js for chapter comments
        const newComment = await api.request(`/chapters/${currentChapter.id}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        // Clear input
        commentInput.value = '';
        
        // Add new comment to the list
        comments.push(newComment);
        
        // Re-render comments
        const sortedComments = [...comments].sort((a, b) => {
            return new Date(a.created_at) - new Date(b.created_at);
        });
        renderComments(sortedComments);
        
        // Hide empty state if it was showing
        document.getElementById('comments-empty').style.display = 'none';
        
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('Erro ao enviar comentário. Por favor, tente novamente.');
    }
}

async function deleteComment(commentId) {
    if (!confirm('Tem certeza que deseja excluir este comentário?')) {
        return;
    }
    
    try {
        await api.deleteComment(commentId);
        
        // Remove comment from local array
        comments = comments.filter(c => c.id !== commentId);
        
        // Remove comment element from DOM
        const commentEl = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentEl) {
            commentEl.remove();
        }
        
        // Show empty state if no comments left
        if (comments.length === 0) {
            document.getElementById('comments-empty').style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Erro ao excluir comentário. Por favor, tente novamente.');
    }
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Agora mesmo';
    } else if (diffMins < 60) {
        return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
    } else if (diffHours < 24) {
        return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffDays < 7) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else {
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
