// ==========================================
// CHATT - REN OCH OPTIMERAD (chat.js)
// ==========================================

// Globala variabler för att hålla koll på tillstånd
let chatUnsubscribe = null;
let isEditingMsg = false;
let currentEditMsgId = null;
let chatMenuTimer = null; 

/**
 * Öppnar/Stänger chatten
 * Lägger även till klasser på body för att hantera scroll och header
 */
window.toggleChatWidget = function() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    const isOpen = chatWidget.style.display === 'flex';

    if (isOpen) {
        // STÄNGER
        chatWidget.style.display = 'none';
        document.body.classList.remove('chat-open'); 
        document.body.style.overflow = ''; 
        
        // Återställ historik (för mobilen bakåt-knapp)
        if (history.state && history.state.uiState === 'chat') {
            history.back();
        }
    } else {
        // ÖPPNAR
        chatWidget.style.display = 'flex';
        document.body.classList.add('chat-open'); 
        document.body.style.overflow = 'hidden'; 
        
        history.pushState({ uiState: 'chat' }, null, window.location.href);

        // Scrolla till botten direkt
        setTimeout(() => {
            const chatList = document.getElementById('chatMessages');
            if (chatList) chatList.scrollTop = chatList.scrollHeight;
        }, 100);
    }
};

/**
 * Initierar chatten (körs från app.js när sidan laddas)
 * Kopplar knappar, lyssnare och inputs
 */
window.initChat = function() {
    const chatList = document.getElementById('chatMessages');
    if (!chatList) return;

    // Hämta element
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const micBtn = document.getElementById('chatMicBtn'); // Mikrofon-knapp
    const closeBtn = document.getElementById('closeChatWidget');
    const closeEditBtn = document.getElementById('closeEditBtn');
    
    // Filuppladdning
    const plusBtn = document.getElementById('chatPlusBtn');      
    const cameraBtn = document.getElementById('chatCameraBtn'); 
    const fileInputGallery = document.getElementById('chatFileInputGallery');
    const fileInputCamera = document.getElementById('chatFileInputCamera');
    
    // Galleri
    const galleryBtn = document.getElementById('toggleGalleryBtn');
    const closeGalleryBtn = document.getElementById('closeGalleryBtn');

    // --- Koppla Event Listeners ---

    if (closeBtn) closeBtn.onclick = window.toggleChatWidget;
    if (closeEditBtn) closeEditBtn.onclick = exitEditMode;

    // Galleri-knappar
    if (galleryBtn) {
        galleryBtn.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            openChatGallery();
        };
    }
    if (closeGalleryBtn) closeGalleryBtn.onclick = closeChatGallery;

    // Uppladdning
    if (plusBtn && fileInputGallery) {
        plusBtn.onclick = () => fileInputGallery.click();
        fileInputGallery.onchange = (e) => handleImageUpload(e.target.files[0]);
    }
    if (cameraBtn && fileInputCamera) {
        cameraBtn.onclick = () => fileInputCamera.click();
        fileInputCamera.onchange = (e) => handleImageUpload(e.target.files[0]);
    }

    // Mikrofon (Placeholder för framtida funktion)
    if (micBtn) {
        micBtn.onclick = () => {
            console.log("Starta ljudinspelning...");
            alert("Ljudinspelning kommer snart!");
        };
    }

    // --- INPUT LOGIK (Färgbyte på knapp) ---
    if (chatInput && sendBtn) {
        
        // Lyssna på input för att ändra färg på knappen
        chatInput.addEventListener('input', () => {
            const val = chatInput.value.trim();
            if (val.length > 0) {
                sendBtn.classList.add('is-active');
                sendBtn.disabled = false;
            } else {
                sendBtn.classList.remove('is-active');
                sendBtn.disabled = true;
            }
        });

        // Skicka vid enter
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatAction();
            }
        });

        // Skicka vid klick
        sendBtn.onclick = handleChatAction;
    }

    // Initiera sök-funktionalitet
    initChatSearch();

    // Starta lyssnare mot Firebase (max 50 senaste)
    setupChatListener(50);
};

// Hanterar att skicka meddelande eller spara ändring
const handleChatAction = async () => {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const text = chatInput.value.trim();
    
    if (!text) return;

    if (isEditingMsg && currentEditMsgId) {
        // Uppdatera befintligt
        try {
            await window.db.collection('notes').doc(currentEditMsgId).update({
                text: text,
                isEdited: true
            });
            exitEditMode(); 
        } catch (err) { console.error("Fel vid uppdatering:", err); }
    } else {
        // Skicka nytt
        try {
            await window.db.collection("notes").add({
                text: text,
                timestamp: new Date().toISOString(),
                platform: window.innerWidth <= 768 ? 'mobil' : 'dator',
                type: 'text'
            });
            chatInput.value = '';
            
            // Återställ knappen till grå
            sendBtn.classList.remove('is-active');
            sendBtn.disabled = true;

            // Scrolla
            const chatList = document.getElementById('chatMessages');
            setTimeout(() => {
                chatList.scrollTo({ top: chatList.scrollHeight, behavior: 'smooth' });
            }, 100);
        } catch (err) { console.error("Fel vid sändning:", err); }
    }
};

/**
 * Startar lyssnare mot databasen
 */
window.stopChatListener = function() {
    if (chatUnsubscribe) chatUnsubscribe();
};

function setupChatListener(limit) {
    if (chatUnsubscribe) chatUnsubscribe();
    const chatList = document.getElementById('chatMessages');

    chatUnsubscribe = window.db.collection("notes")
        .orderBy("timestamp", "desc")
        .limit(limit)
        .onSnapshot(snapshot => {
            const docs = [];
            snapshot.forEach(doc => docs.push({ id: doc.id, ...doc.data() }));
            docs.reverse(); // Visa äldst först

            // Uppdatera notis-badge
            const clockCount = docs.filter(msg => msg.reaction === '🕒').length;
            updateChatBadge(clockCount);

            chatList.innerHTML = '<div style="flex-grow: 1;"></div>'; // Spacer för att trycka ner meddelanden

            if (docs.length === 0) {
                chatList.innerHTML = '<div style="text-align:center; padding:30px; color:#9ca3af; font-size:0.9rem;">Inga meddelanden än.</div>';
                return;
            }

            let lastDateKey = null;
            docs.forEach(data => {
                if (data.timestamp) {
                    const msgDateObj = new Date(data.timestamp);
                    const currentDateKey = msgDateObj.toDateString();
                    if (currentDateKey !== lastDateKey) {
                        renderDateSeparator(chatList, msgDateObj);
                        lastDateKey = currentDateKey;
                    }
                }
                renderChatBubble(data, chatList);
            });

            // Scrolla ner vid första laddning
            if (limit === 50) {
                setTimeout(() => {
                    chatList.scrollTo({ top: chatList.scrollHeight, behavior: 'instant' });
                }, 50);
            }
        });
}

/**
 * Renderar en chattbubbla
 */
function renderChatBubble(data, container) {
    const messageId = data.id; 
    const row = document.createElement('div');
    
    let senderType = 'other';
    if (data.platform === 'system') senderType = 'system';
    else senderType = (data.platform === 'mobil' || data.platform === 'dator') ? 'me' : 'other';

    row.className = `chat-row ${senderType}`;
    row.dataset.messageId = messageId;
    
    // Hantera meny vid klick/hover
    row.onclick = (e) => toggleMessageMenu(messageId, e);

    // Skapa menyn (Reaktioner & Edit)
    const menu = document.createElement('div');
    menu.className = 'chat-action-menu';
    menu.innerHTML = `
        <button class="action-emoji-btn" onclick="window.setReaction('${messageId}', '🕒', event)">🕒</button>
        <button class="action-emoji-btn" onclick="window.setReaction('${messageId}', '✅', event)">✅</button>
        <button class="action-emoji-btn" onclick="window.setReaction('${messageId}', '❌', event)">❌</button>
        <button class="action-emoji-btn" onclick="window.setReaction('${messageId}', '⚠️', event)">⚠️</button>
        <div class="action-separator"></div>
        <button class="action-icon-btn" title="Redigera" onclick="window.handleEditClick('${messageId}', event)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button class="action-icon-btn danger" title="Ta bort" onclick="window.deleteChatMessage('${messageId}'); event.stopPropagation();">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    row.appendChild(menu);

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    if (data.type === 'image' || data.image) bubble.classList.add('is-image');

    // Textinnehåll
    if (data.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'bubble-text-content';
        // Omvandla länkar till klickbara
        textDiv.innerHTML = data.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        bubble.appendChild(textDiv);
    }

    // Bildinnehåll
    if (data.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'chat-bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.loading = "lazy";
        // Öppna nya snygga modalen
        img.onclick = (e) => { e.stopPropagation(); window.openImageZoom(data.image, messageId); };
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }

    // Reaktioner (liten badge på bubblan)
    if (data.reaction) {
        const reactionBadge = document.createElement('div');
        reactionBadge.className = 'reaction-badge-display';
        reactionBadge.textContent = data.reaction;
        reactionBadge.onclick = (e) => window.setReaction(messageId, data.reaction, e); 
        bubble.appendChild(reactionBadge);
    }

    row.appendChild(bubble);

    // Tidsstämpel
    if (data.timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        let t = new Date(data.timestamp);
        timeDiv.textContent = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        row.appendChild(timeDiv);
    }

    container.appendChild(row);
}

// --- MENY & INTERAKTION ---

window.toggleMessageMenu = function(msgId, event) {
    if(event) { event.stopPropagation(); event.preventDefault(); }
    const row = document.querySelector(`.chat-row[data-message-id="${msgId}"]`);
    if (!row) return;

    // Stäng andra menyer
    document.querySelectorAll('.chat-row.show-menu').forEach(el => {
        if(el !== row) el.classList.remove('show-menu');
    });

    row.classList.toggle('show-menu');
};

window.setReaction = async function(msgId, emoji, event) {
    if(event) event.stopPropagation();
    const row = document.querySelector(`.chat-row[data-message-id="${msgId}"]`);
    if(row) row.classList.remove('show-menu'); 

    try {
        const docRef = window.db.collection('notes').doc(msgId);
        const doc = await docRef.get();
        if (doc.exists) {
            const data = doc.data();
            const newReaction = (data.reaction === emoji) ? null : emoji;
            await docRef.update({ reaction: newReaction });
        }
    } catch (error) { console.error(error); }
};

window.handleEditClick = function(msgId, event) {
    if(event) { event.stopPropagation(); event.preventDefault(); }
    
    const row = document.querySelector(`.chat-row[data-message-id="${msgId}"]`);
    if(row) {
        row.classList.remove('show-menu');
        const textElement = row.querySelector('.bubble-text-content');
        const text = textElement ? textElement.innerText : "";
        enterEditMode(row, text);
    }
};

window.deleteChatMessage = async function(messageId) {
    if (!confirm("Ta bort meddelandet?")) return;
    try {
        await window.db.collection('notes').doc(messageId).delete();
    } catch (error) { console.error(error); }
};

// --- EDIT MODE ---

function enterEditMode(rowElement, currentText) {
    const messageId = rowElement.dataset.messageId;
    if (!messageId) return;
    isEditingMsg = true;
    currentEditMsgId = messageId;

    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');

    inputField.value = currentText;
    inputField.focus();
    chatWidget.classList.add('edit-mode');
    if(editHeader) editHeader.style.display = 'flex';
    
    // Trigga input-eventet så knappen blir blå
    inputField.dispatchEvent(new Event('input'));
}

function exitEditMode() {
    isEditingMsg = false;
    currentEditMsgId = null;
    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');

    inputField.value = '';
    chatWidget.classList.remove('edit-mode');
    if(editHeader) editHeader.style.display = 'none';
    
    // Trigga input-eventet så knappen blir grå
    inputField.dispatchEvent(new Event('input'));
}

// --- BILD & ZOOM (NY TOP-APP MODAL) ---

async function handleImageUpload(file) {
    if (!file) return;
    console.log("Laddar upp bild...");
    try {
        const base64Image = await compressImage(file);
        await window.db.collection("notes").add({
            image: base64Image, text: "", type: 'image',
            timestamp: new Date().toISOString(),
            platform: window.innerWidth <= 768 ? 'mobil' : 'dator'
        });
        document.getElementById('chatFileInputGallery').value = '';
        document.getElementById('chatFileInputCamera').value = '';
    } catch (err) { console.error(err); }
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const maxWidth = 800; 
                const scaleSize = maxWidth / img.width;
                const newWidth = (img.width > maxWidth) ? maxWidth : img.width;
                const newHeight = (img.width > maxWidth) ? (img.height * scaleSize) : img.height;
                const canvas = document.createElement('canvas');
                canvas.width = newWidth; canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// Öppnar den snygga bild-modalen
window.openImageZoom = function(src, docId) {
    if (typeof addHistoryState === 'function') addHistoryState(); // Din externa funktion om den finns
    
    const modal = document.getElementById('imageZoomModal');
    const imgMain = document.getElementById('mmImgMain');
    const deleteBtn = document.getElementById('mmDeleteBtn');
    const closeBtn = document.getElementById('mmCloseBtn');

    if (modal && imgMain) {
        imgMain.src = src;
        imgMain.dataset.id = docId || ''; 
        
        modal.style.display = 'flex';
        // Liten fördröjning för animation
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });

        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Vänta på transition
            if (history.state && history.state.modalOpen) history.back();
        };

        if(closeBtn) closeBtn.onclick = closeModal;

        // Klick utanför bilden stänger också
        modal.onclick = (e) => {
            if (e.target === modal || e.target.classList.contains('image-modal-backdrop')) {
                closeModal();
            }
        };

        if (deleteBtn) {
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Radera bilden permanent?')) {
                    try {
                        await window.db.collection("notes").doc(docId).delete();
                        closeModal();
                    } catch (error) { console.error(error); }
                }
            };
        }
    }
};

// --- HJÄLPFUNKTIONER ---

function renderDateSeparator(container, dateObj) {
    const sep = document.createElement('div');
    sep.className = 'chat-date-separator'; 
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    let displayText = '';
    if (dateObj.toDateString() === today.toDateString()) displayText = 'Idag';
    else if (dateObj.toDateString() === yesterday.toDateString()) displayText = 'Igår';
    else displayText = dateObj.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });

    sep.innerHTML = `<span>${displayText}</span>`;
    container.appendChild(sep);
}

function updateChatBadge(count) {
    const setBadge = (btn) => {
        if (!btn) return;
        let badge = btn.querySelector('.chat-notification-badge');
        if (count > 0) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'chat-notification-badge';
                btn.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        } else {
            if (badge) badge.remove();
        }
    };
    // Sätt badge på både desktop FAB och mobilnav
    setBadge(document.getElementById('fabChat'));
    setBadge(document.getElementById('mobileChatBtn'));
}

// Sökfunktion med highlight
function initChatSearch() {
    const chatSearchInput = document.getElementById('chatSearchInput');
    const clearSearchBtn = document.getElementById('clearChatSearch');

    if (chatSearchInput) {
        // Töm-knapp logik
        if (clearSearchBtn) {
            clearSearchBtn.onclick = () => {
                chatSearchInput.value = '';
                chatSearchInput.dispatchEvent(new Event('input')); // Trigga sökning igen
            };
        }

        chatSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const lowerSearchTerm = searchTerm.toLowerCase();
            const messages = document.querySelectorAll('#chatMessages .chat-row');
            
            if (clearSearchBtn) clearSearchBtn.style.display = searchTerm ? 'block' : 'none';

            messages.forEach(row => {
                const textElement = row.querySelector('.bubble-text-content');
                if (!textElement) {
                    row.style.display = searchTerm ? 'none' : 'flex'; // Dölj bilder vid sök
                    return;
                }

                // Spara originaltext i dataset om det inte finns
                if (!textElement.dataset.originalText) {
                    textElement.dataset.originalText = textElement.innerText;
                }
                const originalText = textElement.dataset.originalText;

                if (searchTerm === "") {
                    row.style.display = 'flex';
                    textElement.innerHTML = originalText;
                } else if (originalText.toLowerCase().includes(lowerSearchTerm)) {
                    row.style.display = 'flex';
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    textElement.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Dölj datum om man söker
            document.querySelectorAll('.chat-date-separator').forEach(sep => {
                sep.style.display = searchTerm ? 'none' : 'flex';
            });
        });
    }
}
