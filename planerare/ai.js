// ai.js - Hanterar Gemini Integrationen

// Globalt state
window.isAiMode = false;

// 1. Toggle Funktion
window.toggleAiMode = function() {
    window.isAiMode = !window.isAiMode;
    
    const widget = document.getElementById('chatWidget');
    const headerBtn = document.getElementById('toggleAiBtn');
    const inputArea = document.querySelector('.chat-input-area');
    const chatInput = document.getElementById('chatInput');
    
    // Containrar
    const regularChat = document.getElementById('chatMessages');
    const aiChat = document.getElementById('aiMessageContainer');
    const chips = document.getElementById('aiSuggestionChips');

    if (window.isAiMode) {
        // --- AKTIVERA AI ---
        headerBtn.classList.add('active-ai');
        inputArea.classList.add('ai-input-active');
        
        // Byt vy: Dölj vanlig chatt, visa AI
        regularChat.style.display = 'none';
        aiChat.style.display = 'flex'; // Eller block
        chips.style.display = 'flex';
        
        // Uppdatera Placeholder med bilmodell
        const job = window.currentViewingJob || {};
        const car = job.regnr || "bilen";
        chatInput.placeholder = `Fråga Gemini om ${car}...`;
        
        // Uppdatera välkomsttexten
        const contextSpan = document.getElementById('aiCarContext');
        if(contextSpan) contextSpan.textContent = job.bilmodell || job.regnr || "bilen";

        chatInput.focus();

    } else {
        // --- TILLBAKA TILL CHATT ---
        headerBtn.classList.remove('active-ai');
        inputArea.classList.remove('ai-input-active');
        
        // Byt vy: Visa vanlig chatt
        regularChat.style.display = 'flex'; // Eller vad den hade innan
        aiChat.style.display = 'none';
        chips.style.display = 'none';
        
        chatInput.placeholder = "Skriv meddelande...";
    }
};

// 2. Chip-funktion (när man klickar på ett förslag)
window.fillAiPrompt = function(text) {
    const input = document.getElementById('chatInput');
    input.value = text;
    input.focus();
    // Valfritt: Skicka direkt om du vill?
    // sendMessage(); 
};

// 3. Den smarta "Send"-logiken
// OBS: Denna funktion anropas av din vanliga sendMessage i app.js/chat.js
// Vi måste se till att den kopplingen fungerar.
window.handleAiMessage = async function(text) {
    const container = document.getElementById('aiMessageContainer');
    const input = document.getElementById('chatInput');
    
    // 1. Visa din fråga
    renderAiBubble(text, 'user');
    input.value = ''; // Rensa
    scrollToAiBottom();

    // 2. Visa "Laddar..."
    const loadingId = 'ai-loading-' + Date.now();
    const loadingDiv = document.createElement('div');
    loadingDiv.id = loadingId;
    loadingDiv.className = 'chat-bubble ai-response';
    loadingDiv.innerHTML = '<em>✨ Analyserar data...</em>';
    container.appendChild(loadingDiv);
    scrollToAiBottom();

    try {
        // 3. Hämta kontext (Viktigt!)
        const job = window.currentViewingJob || {};
        const systemPrompt = `
            Du är en expert-mekaniker.
            Fordon: ${job.bilmodell || 'Okänd'} (${job.regnr || '---'}).
            Mätarställning: ${job.matarstallning || '-'} mil.
            Din uppgift: Svara kort, tekniskt och praktiskt.
            Använd fetstil för viktiga värden (t.ex. moment).
            Fråga: ${text}
        `;

        // 4. Anropa Gemini (Kopiera din befintliga fetch-kod hit)
        const apiKey = CONFIG.AI_API_KEY; 
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });
        
        const data = await response.json();
        const aiReply = data.candidates[0].content.parts[0].text;

        // 5. Byt ut laddar-rutan mot svaret
        document.getElementById(loadingId).remove();
        renderAiBubble(aiReply, 'ai');

    } catch (error) {
        console.error(error);
        document.getElementById(loadingId).innerHTML = '⚠️ Något gick fel. Kontrollera nätverket.';
    }
};

// 4. Renderings-hjälp
function renderAiBubble(text, sender) {
    const container = document.getElementById('aiMessageContainer');
    const div = document.createElement('div');
    
    // Klasser
    div.className = sender === 'ai' ? 'chat-bubble ai-response' : 'chat-bubble user-message';
    
    // Formattera text (Markdown-style fetstil till HTML bold)
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // Fetstil
                        .replace(/\n/g, '<br>'); // Radbrytning
    
    // Lägg till disclaimer på AI-svar
    if (sender === 'ai') {
        formatted += `<span class="ai-disclaimer">AI-genererat svar. Dubbelkolla kritiska data.</span>`;
    }

    div.innerHTML = formatted;
    container.appendChild(div);
    scrollToAiBottom();
}

function scrollToAiBottom() {
    const container = document.getElementById('aiMessageContainer');
    container.scrollTop = container.scrollHeight;
}
