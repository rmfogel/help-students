const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Storage paths
// In production (Render), use the persistent disk path
// In development, use local directory
const BASE_DIR = process.env.NODE_ENV === 'production' 
    ? '/opt/render/project/src' 
    : __dirname;

const CHATS_DIR = path.join(BASE_DIR, 'chats');
const API_KEY_FILE = path.join(BASE_DIR, 'api_key.txt');
const SYSTEM_PROMPT_FILE = path.join(__dirname, 'system_prompt.txt'); // Always from code directory

// In-memory storage for API key, chats, and system prompt
let apiKey = process.env.OPENAI_API_KEY || '';
let systemPrompt = '';
const chatsMap = new Map();

// Initialize storage
async function initializeStorage() {
    try {
        console.log(`\n=== מאתחל אחסון ===`);
        console.log(`סביבה: ${process.env.NODE_ENV || 'development'}`);
        console.log(`נתיב תיקיית צ'אטים: ${CHATS_DIR}`);
        
        // Create chats directory if it doesn't exist
        await fs.mkdir(CHATS_DIR, { recursive: true });
        console.log('✓ תיקיית השיחות נוצרה/נטענה בהצלחה');
        
        // Load API key from file ONLY in development (not in production/Render)
        if (process.env.NODE_ENV !== 'production' && !apiKey) {
            try {
                const savedApiKey = await fs.readFile(API_KEY_FILE, 'utf-8');
                if (savedApiKey.trim()) {
                    apiKey = savedApiKey.trim();
                    console.log('מפתח API נטען מהקובץ (מצב פיתוח)');
                }
            } catch (err) {
                // File doesn't exist yet, that's okay
                console.log('לא נמצא קובץ api_key.txt - השתמש במשתנה סביבה או בממשק המנהל');
            }
        } else if (apiKey) {
            console.log('מפתח API נטען ממשתנה סביבה');
        }
        
        // Load system prompt from file
        try {
            systemPrompt = await fs.readFile(SYSTEM_PROMPT_FILE, 'utf-8');
            console.log('פרומפט המערכת נטען מהקובץ');
        } catch (err) {
            console.error('שגיאה בטעינת פרומפט המערכת:', err);
            systemPrompt = 'אתה עוזר AI מועיל.'; // Default fallback
        }
        
        // Load all existing chats
        await loadAllChats();
    } catch (error) {
        console.error('שגיאה באתחול האחסון:', error);
    }
}

// Load all chats from files
async function loadAllChats() {
    try {
        console.log(`מנסה לטעון שיחות מהתיקייה: ${CHATS_DIR}`);
        const files = await fs.readdir(CHATS_DIR);
        console.log(`נמצאו ${files.length} קבצים בתיקייה`);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        console.log(`מתוכם ${jsonFiles.length} קבצי JSON`);
        
        for (const file of jsonFiles) {
            try {
                const filePath = path.join(CHATS_DIR, file);
                const content = await fs.readFile(filePath, 'utf-8');
                const chat = JSON.parse(content);
                chatsMap.set(chat.chatId, chat);
                console.log(`נטען צ'אט: ${chat.chatId} - ${chat.title || 'ללא כותרת'}`);
            } catch (err) {
                console.error(`שגיאה בטעינת קובץ ${file}:`, err);
            }
        }
        
        console.log(`✓ סה"כ נטענו ${chatsMap.size} שיחות מהדיסק`);
    } catch (error) {
        console.error('שגיאה בטעינת השיחות:', error);
    }
}

// Save chat to file
async function saveChatToFile(chat) {
    try {
        const fileName = `${chat.chatId}.json`;
        const filePath = path.join(CHATS_DIR, fileName);
        console.log(`שומר צ'אט ${chat.chatId} בנתיב: ${filePath}`);
        await fs.writeFile(filePath, JSON.stringify(chat, null, 2), 'utf-8');
        console.log(`✓ צ'אט ${chat.chatId} נשמר בהצלחה`);
    } catch (error) {
        console.error('שגיאה בשמירת השיחה:', error);
        throw error;
    }
}

// Delete chat file
async function deleteChatFile(chatId) {
    try {
        const fileName = `${chatId}.json`;
        const filePath = path.join(CHATS_DIR, fileName);
        await fs.unlink(filePath);
    } catch (error) {
        console.error('שגיאה במחיקת קובץ השיחה:', error);
        throw error;
    }
}

// Save API key to file (only in development, not production)
async function saveApiKeyToFile(key) {
    // In production (Render), don't save to file - use environment variables only
    if (process.env.NODE_ENV === 'production') {
        console.log('מצב production - מפתח API לא נשמר לקובץ (השתמש במשתני סביבה)');
        return;
    }
    
    try {
        await fs.writeFile(API_KEY_FILE, key, 'utf-8');
        console.log('מפתח API נשמר לקובץ (מצב פיתוח)');
    } catch (error) {
        console.error('שגיאה בשמירת מפתח API:', error);
        throw error;
    }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API endpoint to proxy requests to OpenAI
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;

        if (!apiKey) {
            return res.status(500).json({ 
                error: 'מפתח API לא מוגדר. אנא הגדר אותו בממשק הניהול' 
            });
        }

        // Add system prompt as first message
        const messagesWithSystem = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: messagesWithSystem,
                max_completion_tokens: 6000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: error.message || 'אירעה שגיאה בשרת' 
        });
    }
});

// Save chat
app.post('/api/chats', async (req, res) => {
    try {
        const { chatId, title, messages, lastUpdated } = req.body;
        
        const chat = {
            chatId,
            title,
            messages,
            lastUpdated
        };
        
        // Save to memory
        chatsMap.set(chatId, chat);
        
        // Save to file
        await saveChatToFile(chat);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving chat:', error);
        res.status(500).json({ error: 'שגיאה בשמירת השיחה' });
    }
});

// Get all chats
app.get('/api/chats', (req, res) => {
    try {
        console.log(`API Request: /api/chats - יש ${chatsMap.size} שיחות בזיכרון`);
        const chats = Array.from(chatsMap.values())
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
        console.log(`מחזיר ${chats.length} שיחות ללקוח`);
        res.json(chats);
    } catch (error) {
        console.error('Error getting chats:', error);
        res.status(500).json({ error: 'שגיאה בטעינת השיחות' });
    }
});

// Delete chat
app.delete('/api/chats/:chatId', async (req, res) => {
    try {
        const { chatId } = req.params;
        
        // Delete from memory
        chatsMap.delete(chatId);
        
        // Delete from file
        await deleteChatFile(chatId);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: 'שגיאה במחיקת השיחה' });
    }
});

// Admin: Get API key status
app.get('/api/admin/apikey', (req, res) => {
    res.json({ hasKey: !!apiKey });
});

// Admin: Set API key
app.post('/api/admin/apikey', async (req, res) => {
    try {
        const { apiKey: newApiKey } = req.body;
        
        if (!newApiKey || !newApiKey.startsWith('sk-')) {
            return res.status(400).json({ error: 'מפתח API לא תקין' });
        }
        
        // Save to memory
        apiKey = newApiKey;
        
        // Save to file
        await saveApiKeyToFile(newApiKey);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error setting API key:', error);
        res.status(500).json({ error: 'שגיאה בשמירת המפתח' });
    }
});

// Initialize storage and start server
initializeStorage().then(() => {
    app.listen(PORT, () => {
        console.log(`השרת רץ על http://localhost:${PORT}`);
        console.log(`ממשק מנהל: http://localhost:${PORT}/admin.html`);
        console.log(`תיקיית שיחות: ${CHATS_DIR}`);
        console.log('לחץ Ctrl+C כדי לעצור את השרת');
    });
}).catch(error => {
    console.error('שגיאה באתחול השרת:', error);
    process.exit(1);
});
