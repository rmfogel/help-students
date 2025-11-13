// Admin state
let apiKey = '';
let chats = [];

// DOM elements
const adminApiKeyInput = document.getElementById('adminApiKey');
const saveAdminApiKeyButton = document.getElementById('saveAdminApiKey');
const chatsList = document.getElementById('chatsList');
const chatViewerSection = document.getElementById('chatViewerSection');
const chatViewer = document.getElementById('chatViewer');
const chatTitle = document.getElementById('chatTitle');
const closeChatViewerButton = document.getElementById('closeChatViewer');
const logoutButton = document.getElementById('logoutButton');

// Initialize
function init() {
    checkAuth();
    loadApiKey();
    setupEventListeners();
    loadChats();
    
    // Auto-refresh chats every 5 seconds
    setInterval(loadChats, 5000);
}

// Check authentication
function checkAuth() {
    const isLoggedIn = localStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
        const password = prompt('הזן סיסמת מנהל:');
        if (password === 'admin123') { // Change this in production!
            localStorage.setItem('admin_logged_in', 'true');
        } else {
            alert('סיסמה שגויה');
            window.location.href = 'index.html';
        }
    }
}

// Event listeners
function setupEventListeners() {
    saveAdminApiKeyButton.addEventListener('click', saveApiKey);
    closeChatViewerButton.addEventListener('click', closeChatViewer);
    logoutButton.addEventListener('click', logout);
}

// Logout
function logout() {
    if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
        localStorage.removeItem('admin_logged_in');
        window.location.href = 'index.html';
    }
}

// Load API key
function loadApiKey() {
    fetch('/api/admin/apikey')
        .then(res => res.json())
        .then(data => {
            if (data.hasKey) {
                adminApiKeyInput.placeholder = '●●●●●●●●●●●●●●●●';
            }
        })
        .catch(err => console.error('Error loading API key:', err));
}

// Save API key
async function saveApiKey() {
    const newApiKey = adminApiKeyInput.value.trim();
    if (!newApiKey) {
        alert('אנא הזן מפתח API');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/apikey', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey: newApiKey })
        });
        
        if (response.ok) {
            alert('מפתח ה-API נשמר בהצלחה!');
            adminApiKeyInput.value = '';
            adminApiKeyInput.placeholder = '●●●●●●●●●●●●●●●●';
        } else {
            alert('שגיאה בשמירת המפתח');
        }
    } catch (error) {
        console.error('Error saving API key:', error);
        alert('שגיאה בשמירת המפתח');
    }
}

// Load chats
async function loadChats() {
    try {
        const response = await fetch('/api/chats');
        if (response.ok) {
            chats = await response.json();
            renderChats();
        }
    } catch (error) {
        console.error('Error loading chats:', error);
    }
}

// Render chats list
function renderChats() {
    if (chats.length === 0) {
        chatsList.innerHTML = '<div class="empty-state">אין צ\'אטים פעילים</div>';
        return;
    }
    
    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-item" data-chat-id="${chat.chatId}">
            <div class="chat-item-info">
                <div class="chat-item-title">${chat.title || 'שיחה ללא כותרת'}</div>
                <div class="chat-item-meta">
                    ${chat.messages.length} הודעות • 
                    ${formatDate(chat.lastUpdated)}
                </div>
            </div>
            <div class="chat-item-actions">
                <button class="action-button" onclick="viewChat('${chat.chatId}')">צפה</button>
                <button class="action-button" onclick="deleteChat('${chat.chatId}')">מחק</button>
            </div>
        </div>
    `).join('');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) {
        return 'עכשיו';
    }
    
    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `לפני ${minutes} דקות`;
    }
    
    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `לפני ${hours} שעות`;
    }
    
    // Format as date
    return date.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// View chat
function viewChat(chatId) {
    const chat = chats.find(c => c.chatId === chatId);
    if (!chat) return;
    
    chatTitle.textContent = chat.title || 'שיחה ללא כותרת';
    
    chatViewer.innerHTML = chat.messages.map(msg => `
        <div class="message ${msg.role}-message">
            <div class="message-content">
                ${msg.content.split('\n\n').map(para => 
                    para.trim() ? `<p>${para.trim()}</p>` : ''
                ).join('')}
            </div>
        </div>
    `).join('');
    
    chatViewerSection.style.display = 'block';
    chatViewerSection.scrollIntoView({ behavior: 'smooth' });
}

// Close chat viewer
function closeChatViewer() {
    chatViewerSection.style.display = 'none';
}

// Delete chat
async function deleteChat(chatId) {
    if (!confirm('האם אתה בטוח שברצונך למחוק שיחה זו?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/chats/${chatId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            // Remove from local array
            chats = chats.filter(c => c.chatId !== chatId);
            renderChats();
            
            // Close viewer if this chat was being viewed
            if (chatViewerSection.style.display !== 'none' && 
                chatTitle.textContent === chats.find(c => c.chatId === chatId)?.title) {
                closeChatViewer();
            }
        } else {
            alert('שגיאה במחיקת השיחה');
        }
    } catch (error) {
        console.error('Error deleting chat:', error);
        alert('שגיאה במחיקת השיחה');
    }
}

// Initialize app
init();
