// ai.js - Clean & Optimized Version
window.isAiMode = false;

// 1. TOGGLE & INIT
window.toggleAiMode = async function() {
    window.isAiMode = !window.isAiMode;
    const elements = {
        btn: document.getElementById('toggleAiBtn'),
        regChat: document.getElementById('chatMessages'),
        aiChat: document.getElementById('aiMessageContainer'),
        chips: document.getElementById('aiSuggestionChips'),
        input: document.getElementById('chatInput')
    };

    elements.btn.classList.toggle('active-ai', window.isAiMode);
    elements.regChat.style.display = window.isAiMode ? 'none' : 'flex';
    elements.aiChat.style.display = window.isAiMode ? 'flex' : 'none';
    if(elements.chips) elements.chips.style.display = window.isAiMode ? 'flex' : 'none';

    if (window.isAiMode) {
        await loadGlobalAiHistory();
        elements.input.placeholder = "Fråga Gemini...";
        elements.input.focus();
    } else {
        elements.input.placeholder = "Meddelande";
    }
};

// 2. CORE LOGIC: SEND & RECEIVE
window.handleAiMessage = async function(text) {
    if (!text?.trim()) return;
    const container = document.getElementById('aiMessageContainer');
    const input = document.getElementById('chatInput');
    
    // Vi renderar bubblan lokalt så du ser vad du skickat JUST NU
    renderAiBubble(text, 'user', 'temp-user');
    input.value = '';

    const loadingId = 'ai-load-' + Date.now();
    renderAiBubble('<em>✨ Tänker...</em>', 'ai', loadingId);

    try {
        const apiKey = window.CONFIG?.AI_API_KEY || CONFIG?.AI_API_KEY;
        const prompt = `Expert-mekaniker. Svara extremt kortfattat (fakta/siffror). Fråga: ${text}`;
        
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contents: [{parts: [{text: prompt}]}]})
        });

        const data = await resp.json();
        const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Inget svar.";
        
        document.getElementById(loadingId)?.remove();
        // Vi tar bort din frågebubbla direkt när svaret kommer för att hålla chatten ren
        document.getElementById('temp-user')?.remove();

        const shortQ = text.replace(/vad är|hur mycket|hjälp/gi, '').trim().toUpperCase();
        
        // Rendera svaret. Om användaren trycker "Spara" hamnar det i historiken.
        renderAiBubble(aiReply, 'ai', Date.now(), false, shortQ);

    } catch (e) { 
        console.error(e);
        document.getElementById(loadingId).innerHTML = "⚠️ Fel vid kontakt med AI.";
    }
};

// 2. Ladda historik - Visar nu ENDAST sparade AI-svar
async function loadGlobalAiHistory() {
    const container = document.getElementById('aiMessageContainer');
    container.innerHTML = `
        <div class="ai-saved-accordion">
            <div class="saved-header" onclick="this.parentElement.classList.toggle('open')">
                <span>📌 Sparade meddelanden</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" class="accordion-arrow"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="saved-content" id="aiSavedList"></div>
        </div>
        <div class="ai-welcome-screen">
            <div class="ai-sparkle-bg">✨</div>
            <h3>Gemini AI</h3>
            <p>Global assistent. Dina sparade svar visas i listan ovan.</p>
        </div>`;

    // Vi hämtar ENDAST de dokument som har isPermanent: true
    const snapshot = await window.db.collection("ai_global_history")
        .where("isPermanent", "==", true)
        .orderBy("timestamp", "asc")
        .get();
        
    const savedList = document.getElementById('aiSavedList');
    snapshot.forEach(doc => {
        renderSavedItem(doc.data(), doc.id);
    });
}

window.saveGlobalAiResponse = async function(id, q) {
    const el = document.getElementById(id);
    const txt = el.querySelector('.ai-text-body').innerHTML;
    await window.db.collection("ai_global_history").add({ text: txt, question: q, sender: 'ai', isPermanent: true, timestamp: Date.now() });
    el.remove();
    loadGlobalAiHistory();
};

window.deleteSavedAiResponse = async (id) => {
    if(confirm("Radera?")) {
        await window.db.collection("ai_global_history").doc(id).delete();
        document.getElementById('saved-' + id)?.remove();
    }
};

// 4. RENDERING HELPERS
function renderAiBubble(text, sender, id = Date.now(), isSaved = false, q = "") {
    const container = document.getElementById('aiMessageContainer');
    const div = document.createElement('div');
    div.id = id;
    div.className = `ai-chat-row ${sender}`;
    const formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    
    div.innerHTML = sender === 'ai' 
        ? `<div class="ai-avatar">✨</div><div class="chat-bubble ai-response"><div class="ai-text-body">${formatted}</div>${!isSaved ? `<button class="ai-save-btn" onclick="window.saveGlobalAiResponse('${id}', '${q}')">📌 Spara</button>` : ''}</div>`
        : `<div class="chat-bubble user-message">${formatted}</div>`;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function renderSavedItem(d, id) {
    const div = document.createElement('div');
    div.className = 'saved-card'; div.id = 'saved-' + id;
    div.innerHTML = `<div class="saved-card-header"><span class="saved-question-tag">${d.question || 'SPARAT'}</span><button class="delete-saved-btn" onclick="deleteSavedAiResponse('${id}')">🗑️</button></div><div class="saved-card-body">${d.text}</div>`;
    document.getElementById('aiSavedList').appendChild(div);
}

// ai.js - Fix för chips/knappar
window.fillAiPrompt = function(t) { 
    const input = document.getElementById('chatInput');
    if(input) {
        input.value = t;
        input.focus();
    }
};
