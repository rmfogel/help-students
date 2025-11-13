// Chat state
let conversationHistory = [];
let chatId = localStorage.getItem('current_chat_id') || generateChatId();

// DOM elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const clearChatButton = document.getElementById('clearChat');
const exportChatButton = document.getElementById('exportChat');

// Generate unique chat ID
function generateChatId() {
    const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('current_chat_id', id);
    return id;
}

// Initialize
function init() {
    loadConversationHistory();
    setupEventListeners();
}

// Event listeners
function setupEventListeners() {
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    clearChatButton.addEventListener('click', clearChat);
    exportChatButton.addEventListener('click', exportChat);
}

// Send message
async function sendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message to UI
    addMessage(message, 'user');
    
    // Clear input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Disable send button
    sendButton.disabled = true;
    
    // Show loading indicator
    const loadingId = showLoading();
    
    try {
        // Add message to conversation history
        conversationHistory.push({
            role: 'user',
            content: message
        });
        
        // Call server API
        const response = await callServerAPI();
        
        // Add assistant response to UI
        addMessage(response, 'assistant');
        
        // Add response to conversation history
        conversationHistory.push({
            role: 'assistant',
            content: response
        });
        
        // Save conversation
        saveConversationHistory();
        saveChatToServer();
        
    } catch (error) {
        console.error('Error:', error);
        addMessage('מצטער, אירעה שגיאה. אנא פנה למנהל המערכת.', 'assistant');
    } finally {
        // Remove loading indicator
        removeLoading(loadingId);
        
        // Enable send button
        sendButton.disabled = false;
        
        // Focus input
        userInput.focus();
    }
}

// Call server API
async function callServerAPI() {
    // System prompt is now handled on the server side
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ messages: conversationHistory })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'שגיאה בשרת');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
}

// Save chat to server
async function saveChatToServer() {
    try {
        const chatTitle = getChatTitle();
        await fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatId: chatId,
                title: chatTitle,
                messages: conversationHistory,
                lastUpdated: new Date().toISOString()
            })
        });
    } catch (error) {
        console.error('Error saving chat:', error);
    }
}

// Get chat title from first user message
function getChatTitle() {
    const firstUserMsg = conversationHistory.find(msg => msg.role === 'user');
    if (firstUserMsg) {
        return firstUserMsg.content.substring(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
    }
    return 'שיחה חדשה';
}

// Add message to UI
function addMessage(content, role) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Split content into paragraphs
    const paragraphs = content.split('\n\n');
    paragraphs.forEach(para => {
        if (para.trim()) {
            const p = document.createElement('p');
            p.textContent = para.trim();
            contentDiv.appendChild(p);
        }
    });
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    scrollToBottom();
}

// Show loading indicator
function showLoading() {
    const loadingDiv = document.createElement('div');
    const loadingId = 'loading-' + Date.now();
    loadingDiv.id = loadingId;
    loadingDiv.className = 'message assistant-message';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="loading-indicator">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    scrollToBottom();
    return loadingId;
}

// Remove loading indicator
function removeLoading(loadingId) {
    const loadingDiv = document.getElementById(loadingId);
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Scroll to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save conversation history
function saveConversationHistory() {
    localStorage.setItem('conversation_history_' + chatId, JSON.stringify(conversationHistory));
}

// Load conversation history
function loadConversationHistory() {
    const saved = localStorage.getItem('conversation_history_' + chatId);
    if (saved) {
        try {
            conversationHistory = JSON.parse(saved);
            
            // Restore messages to UI
            conversationHistory.forEach(msg => {
                addMessage(msg.content, msg.role);
            });
        } catch (e) {
            console.error('Error loading conversation history:', e);
            conversationHistory = [];
        }
    }
}

// Clear chat
function clearChat() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל השיחה?')) {
        conversationHistory = [];
        localStorage.removeItem('conversation_history_' + chatId);
        
        // Generate new chat ID
        chatId = generateChatId();
        
        // Clear UI
        chatMessages.innerHTML = `
            <div class="message assistant-message">
                <div class="message-content">
                    <p>שלום! אני כאן כדי לעזור לך לכתוב את ההצעה לפרויקט הגמר שלך.</p>
                    <p>ספר לי על הרעיון שלך לפרויקט, ואני אשאל אותך שאלות שיעזרו לך להגדיר אותו בצורה ברורה ומדויקת.</p>
                </div>
            </div>
        `;
    }
}

// Export chat
function exportChat() {
    if (conversationHistory.length === 0) {
        alert('אין שיחה לייצוא');
        return;
    }
    
    let exportText = 'עוזר כתיבת הצעות פרויקט גמר\n';
    exportText += '='.repeat(50) + '\n\n';
    
    conversationHistory.forEach((msg, index) => {
        const role = msg.role === 'user' ? 'תלמיד' : 'עוזר';
        exportText += `${role}:\n${msg.content}\n\n`;
        exportText += '-'.repeat(50) + '\n\n';
    });
    
    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-proposal-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Auto-resize textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Initialize app
init();
