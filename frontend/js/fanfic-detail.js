// Fanfic Detail Page functionality

let currentFanfic = null;
let chapters = [];
let selectedMode = null;
let questions = [];
let existingAnswers = {};
let comments = [];
let currentUser = null;
let contentWarningModal = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize content warning modal
    contentWarningModal = new ContentWarningModal();
    
    // Get fanfic ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const fanficId = urlParams.get('id');

    if (!fanficId) {
        showError('ID da fanfic não encontrado');
        return;
    }

    await loadFanficDetail(fanficId);
    
    // Setup comment form
    setupCommentForm();
});

async function loadFanficDetail(fanficId) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const detailEl = document.getElementById('fanfic-detail');

    try {
        loadingEl.style.display = 'block';
        errorEl.style.display = 'none';
        detailEl.style.display = 'none';

        // Fetch fanfic details
        currentFanfic = await api.getFanfic(fanficId);
        
        // Fetch chapters
        chapters = await api.getChapters(fanficId);

        // Fetch tags
        try {
            currentFanfic.tags = await api.getFanficTags(fanficId);
        } catch (error) {
            console.log('No tags found for this fanfic');
            currentFanfic.tags = [];
        }

        loadingEl.style.display = 'none';

        // Show content warning modal if needed, then display content
        contentWarningModal.show(currentFanfic, () => {
            // This callback is executed after user confirms the warning
            displayFanficContent();
        });

    } catch (error) {
        console.error('Error loading fanfic:', error);
        showError('Erro ao carregar fanfic. Por favor, tente novamente.');
    }
}

async function displayFanficContent() {
    const detailEl = document.getElementById('fanfic-detail');
    
    // Display fanfic details
    displayFanficDetails();
    displayChapters();

    // Always check for interactive questions (regardless of flag)
    await checkInteractiveMode(currentFanfic.id);

    // Load comments
    await loadComments(currentFanfic.id);

    detailEl.style.display = 'block';
}

function displayFanficDetails() {
    // Set cover image
    const coverEl = document.getElementById('fanfic-cover');
    coverEl.src = api.getAssetUrl(currentFanfic.cover_url) || 'https://via.placeholder.com/300x450?text=Sem+Capa';
    coverEl.alt = `Capa de ${currentFanfic.title}`;

    // Set title
    document.getElementById('fanfic-title').textContent = currentFanfic.title;

    // Set category
    const categoryEl = document.getElementById('fanfic-category');
    categoryEl.textContent = `Categoria: ${currentFanfic.category}`;

    // Set synopsis (sanitized HTML from rich text editor)
    document.getElementById('fanfic-synopsis').innerHTML = DOMPurify.sanitize(currentFanfic.synopsis);

    // Display tags if present
    if (currentFanfic.tags && currentFanfic.tags.length > 0) {
        displayTags(currentFanfic.tags);
    }

    // Display disclaimer if present
    if (currentFanfic.disclaimer && currentFanfic.disclaimer.trim() !== '') {
        const disclaimerSection = document.getElementById('disclaimer-section');
        const disclaimerText = document.getElementById('fanfic-disclaimer');
        disclaimerText.innerHTML = DOMPurify.sanitize(currentFanfic.disclaimer);
        disclaimerSection.style.display = 'block';
    }
}

function displayTags(tags) {
    // Check if tags section exists, if not create it
    let tagsSection = document.getElementById('tags-section');
    if (!tagsSection) {
        // Insert tags section after synopsis
        const synopsisEl = document.getElementById('fanfic-synopsis');
        tagsSection = document.createElement('div');
        tagsSection.id = 'tags-section';
        tagsSection.className = 'fanfic-tags-section';
        synopsisEl.parentNode.insertBefore(tagsSection, synopsisEl.nextSibling);
    }

    // Group tags by type
    const tagsByType = {
        fandom: tags.filter(tag => tag.type === 'fandom'),
        warning: tags.filter(tag => tag.type === 'warning'),
        pairing: tags.filter(tag => tag.type === 'pairing')
    };

    let tagsHTML = '<div class="fanfic-tags-container">';

    // Display fandom tags
    if (tagsByType.fandom.length > 0) {
        tagsHTML += '<div class="fanfic-tags-group">';
        tagsHTML += '<h4 class="fanfic-tags-group-title">Fandom:</h4>';
        tagsHTML += '<div class="fanfic-tags-list">';
        tagsByType.fandom.forEach(tag => {
            tagsHTML += `<span class="fanfic-tag tag-badge-fandom" data-tag-id="${tag.id}" data-tag-name="${escapeHtml(tag.name)}" data-tag-type="${tag.type}">${escapeHtml(tag.name)}</span>`;
        });
        tagsHTML += '</div></div>';
    }

    // Display warning tags
    if (tagsByType.warning.length > 0) {
        tagsHTML += '<div class="fanfic-tags-group">';
        tagsHTML += '<h4 class="fanfic-tags-group-title">Avisos:</h4>';
        tagsHTML += '<div class="fanfic-tags-list">';
        tagsByType.warning.forEach(tag => {
            tagsHTML += `<span class="fanfic-tag tag-badge-warning" data-tag-id="${tag.id}" data-tag-name="${escapeHtml(tag.name)}" data-tag-type="${tag.type}">${escapeHtml(tag.name)}</span>`;
        });
        tagsHTML += '</div></div>';
    }

    // Display pairing tags
    if (tagsByType.pairing.length > 0) {
        tagsHTML += '<div class="fanfic-tags-group">';
        tagsHTML += '<h4 class="fanfic-tags-group-title">Casais:</h4>';
        tagsHTML += '<div class="fanfic-tags-list">';
        tagsByType.pairing.forEach(tag => {
            tagsHTML += `<span class="fanfic-tag tag-badge-pairing" data-tag-id="${tag.id}" data-tag-name="${escapeHtml(tag.name)}" data-tag-type="${tag.type}">${escapeHtml(tag.name)}</span>`;
        });
        tagsHTML += '</div></div>';
    }

    tagsHTML += '</div>';
    tagsSection.innerHTML = tagsHTML;

    // Add click listeners to tags for navigation
    const tagElements = tagsSection.querySelectorAll('.fanfic-tag');
    tagElements.forEach(tagEl => {
        tagEl.style.cursor = 'pointer';
        tagEl.addEventListener('click', () => {
            const tagId = tagEl.dataset.tagId;
            const tagName = tagEl.dataset.tagName;
            const tagType = tagEl.dataset.tagType;
            navigateToTagSearch(tagId, tagName, tagType);
        });
    });
}

function navigateToTagSearch(tagId, tagName, tagType) {
    // Navigate to tag search page with the selected tag
    const params = new URLSearchParams({
        tagId: tagId,
        tagName: tagName,
        tagType: tagType
    });
    window.location.href = `tag-search.html?${params.toString()}`;
}

function displayChapters() {
    const chaptersListEl = document.getElementById('chapters-list');
    
    if (!chapters || chapters.length === 0) {
        chaptersListEl.innerHTML = '<p class="no-chapters">Nenhum capítulo disponível ainda.</p>';
        return;
    }

    // Sort chapters by order
    const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);

    chaptersListEl.innerHTML = sortedChapters.map(chapter => `
        <div class="chapter-item" data-chapter-id="${chapter.id}">
            <div class="chapter-number">Capítulo ${chapter.order}</div>
            <div class="chapter-info">
                <h3 class="chapter-title">
                    ${chapter.title}
                    ${chapter.is_draft ? '<span class="status-badge status-draft" style="margin-left: 0.5rem; font-size: 0.8rem;">📝 Rascunho</span>' : ''}
                </h3>
            </div>
            <button class="btn-read" onclick="readChapter(${chapter.id})">
                Ler
            </button>
        </div>
    `).join('');
}

async function checkInteractiveMode(fanficId) {
    try {
        // Check if there are questions for this fanfic
        questions = await api.getQuestions(fanficId);
        console.log('Questions loaded:', questions);
        
        if (questions && questions.length > 0) {
            console.log('Interactive mode available - showing buttons');
            // Show interactive mode options
            const interactiveOptionsEl = document.getElementById('interactive-options');
            interactiveOptionsEl.style.display = 'block';

            // Setup mode selection buttons
            document.getElementById('btn-interactive').addEventListener('click', () => {
                selectMode('interactive');
            });

            document.getElementById('btn-non-interactive').addEventListener('click', () => {
                selectMode('non-interactive');
            });

            // Load answer editor if user is authenticated and has answers
            if (api.token) {
                await loadAnswerEditor(fanficId);
            }
        } else {
            console.log('No questions found - interactive mode not available');
        }
    } catch (error) {
        console.error('Error checking interactive mode:', error);
        // If there's an error, just don't show interactive options
    }
}

function selectMode(mode) {
    selectedMode = mode;
    
    // Store mode selection in sessionStorage
    sessionStorage.setItem(`fanfic_${currentFanfic.id}_mode`, mode);

    // Visual feedback
    const interactiveBtn = document.getElementById('btn-interactive');
    const nonInteractiveBtn = document.getElementById('btn-non-interactive');

    if (mode === 'interactive') {
        interactiveBtn.classList.add('selected');
        nonInteractiveBtn.classList.remove('selected');
        
        // Open questions modal for interactive mode
        openQuestionsModal();
    } else {
        nonInteractiveBtn.classList.add('selected');
        interactiveBtn.classList.remove('selected');
        
        // Show confirmation message
        showModeConfirmation(mode);
    }
}

function showModeConfirmation(mode) {
    const modeText = mode === 'interactive' ? 'Interativo' : 'Normal';
    
    // Create temporary notification
    const notification = document.createElement('div');
    notification.className = 'mode-notification';
    notification.textContent = `Modo ${modeText} selecionado! Clique em "Ler" em qualquer capítulo para começar.`;
    
    const modeSelection = document.querySelector('.mode-selection');
    modeSelection.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function openQuestionsModal() {
    const modal = document.getElementById('questions-modal');
    const questionsContainer = document.getElementById('questions-container');
    const validationMessage = document.getElementById('validation-message');
    
    // Hide validation message
    validationMessage.style.display = 'none';
    
    // Try to load existing answers if user is authenticated
    try {
        if (api.token) {
            existingAnswers = await api.getAnswers(currentFanfic.id);
        }
    } catch (error) {
        console.log('No existing answers found or user not authenticated');
        existingAnswers = {};
    }
    
    // Render questions
    questionsContainer.innerHTML = questions.map((question, index) => {
        const existingAnswer = existingAnswers[question.placeholder] || '';
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
    
    // Reset selected mode if no answers were submitted
    const hasAnswers = Object.keys(existingAnswers).length > 0;
    if (!hasAnswers) {
        selectedMode = null;
        sessionStorage.removeItem(`fanfic_${currentFanfic.id}_mode`);
        
        const interactiveBtn = document.getElementById('btn-interactive');
        const nonInteractiveBtn = document.getElementById('btn-non-interactive');
        interactiveBtn.classList.remove('selected');
        nonInteractiveBtn.classList.remove('selected');
    }
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
            console.log('Saving answers:', answers);
            await api.saveAnswers(currentFanfic.id, answers);
            console.log('Answers saved successfully');
        } else {
            // Store answers in sessionStorage for non-authenticated users
            sessionStorage.setItem(`fanfic_${currentFanfic.id}_answers`, JSON.stringify(answers));
        }
        
        // Update existing answers
        existingAnswers = answers;
        
        // Close modal
        closeQuestionsModal();
        
        // Show success confirmation
        showModeConfirmation('interactive');
        
        // Display answer editor if user is authenticated
        if (api.token) {
            displayAnswerEditor();
        }
        
    } catch (error) {
        console.error('Error saving answers:', error);
        alert('Erro ao salvar respostas. Por favor, tente novamente.');
    }
}

function readChapter(chapterId) {
    // Get selected mode or default to non-interactive
    const mode = selectedMode || sessionStorage.getItem(`fanfic_${currentFanfic.id}_mode`) || 'non-interactive';
    
    // If interactive mode but no answers, show modal first
    if (mode === 'interactive' && Object.keys(existingAnswers).length === 0) {
        openQuestionsModal();
        return;
    }
    
    // Navigate to chapter reader (will be implemented in future tasks)
    window.location.href = `chapter-reader.html?id=${chapterId}&mode=${mode}`;
}

function showError(message) {
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const detailEl = document.getElementById('fanfic-detail');

    loadingEl.style.display = 'none';
    detailEl.style.display = 'none';
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

async function loadComments(fanficId) {
    const commentsContainer = document.getElementById('comments-container');
    const loadingEl = document.getElementById('comments-loading');
    const emptyEl = document.getElementById('comments-empty');
    
    try {
        loadingEl.style.display = 'block';
        emptyEl.style.display = 'none';
        
        // Fetch comments
        comments = await api.getComments(fanficId);
        
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
    
    // Get current user ID from token or stored user data
    // For now, we'll check if user_id matches
    // In a real implementation, we'd decode the JWT or fetch user info
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
        // Submit comment
        const newComment = await api.createComment(currentFanfic.id, content);
        
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

// Answer Editor Functions

async function loadAnswerEditor(fanficId) {
    try {
        // Try to load existing answers
        const answers = await api.getAnswers(fanficId);
        
        // Only show answer editor if user has answers
        if (answers && Object.keys(answers).length > 0) {
            existingAnswers = answers;
            displayAnswerEditor();
        }
    } catch (error) {
        console.log('No existing answers found');
        // Don't show answer editor if no answers exist yet
    }
}

function displayAnswerEditor() {
    const answerEditorSection = document.getElementById('answer-editor-section');
    const answerEditorList = document.getElementById('answer-editor-list');
    
    // Create a map of placeholder to question text
    const questionMap = {};
    questions.forEach(q => {
        questionMap[q.placeholder] = q.question_text;
    });
    
    // Render answer editor items
    const answerItems = Object.entries(existingAnswers).map(([placeholder, answer]) => {
        const questionText = questionMap[placeholder] || placeholder;
        return `
            <div class="answer-editor-item" data-placeholder="${placeholder}">
                <div class="answer-editor-question">
                    <label class="answer-editor-label" for="answer-${placeholder}">
                        ${escapeHtml(questionText)}
                    </label>
                    <div class="answer-editor-placeholder-tag">{{${escapeHtml(placeholder)}}}</div>
                </div>
                <div class="answer-editor-input-container">
                    <input 
                        type="text" 
                        id="answer-${placeholder}" 
                        class="answer-editor-input" 
                        data-placeholder="${placeholder}"
                        value="${escapeHtml(answer)}"
                        placeholder="Digite sua resposta..."
                    />
                    <span class="answer-editor-status" id="status-${placeholder}"></span>
                </div>
            </div>
        `;
    }).join('');
    
    answerEditorList.innerHTML = answerItems;
    
    // Show the answer editor section
    answerEditorSection.style.display = 'block';
    
    // Setup event listeners for immediate save
    Object.keys(existingAnswers).forEach(placeholder => {
        const input = document.getElementById(`answer-${placeholder}`);
        if (input) {
            // Debounce the save to avoid too many API calls
            let saveTimeout;
            input.addEventListener('input', (e) => {
                clearTimeout(saveTimeout);
                const statusEl = document.getElementById(`status-${placeholder}`);
                statusEl.textContent = '💾 Salvando...';
                statusEl.className = 'answer-editor-status saving';
                
                saveTimeout = setTimeout(async () => {
                    await saveAnswerUpdate(placeholder, e.target.value);
                }, 1000); // Wait 1 second after user stops typing
            });
        }
    });
}

async function saveAnswerUpdate(placeholder, newValue) {
    const statusEl = document.getElementById(`status-${placeholder}`);
    
    try {
        // Update the answer in the local object
        existingAnswers[placeholder] = newValue;
        
        // Save to backend
        await api.updateAnswers(currentFanfic.id, existingAnswers);
        
        // Show success status
        statusEl.textContent = '✓ Salvo';
        statusEl.className = 'answer-editor-status saved';
        
        // Clear status after 2 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'answer-editor-status';
        }, 2000);
        
    } catch (error) {
        console.error('Error saving answer:', error);
        
        // Show error status
        statusEl.textContent = '✗ Erro ao salvar';
        statusEl.className = 'answer-editor-status error';
        
        // Keep error visible longer
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'answer-editor-status';
        }, 5000);
    }
}
