// ==========================================
// CHATT - SEPARAT FIL (chat.js)
// ==========================================

// Globala variabler för chatten
let chatUnsubscribe = null;
let isEditingMsg = false;
let currentEditMsgId = null;
let chatMenuTimer = null; // Fix för "ReferenceError"

// Gör funktionen global
window.toggleChatWidget = function() {
    const chatWidget = document.getElementById('chatWidget');
    if (!chatWidget) return;

    const isOpen = chatWidget.style.display === 'flex';

    if (isOpen) {
        // STÄNGER
        chatWidget.style.display = 'none';
        document.body.classList.remove('chat-open'); // Ta bort klassen
        document.body.style.overflow = ''; 
        
        // Återställ eventuell historik
        if (history.state && history.state.uiState === 'chat') {
            history.back();
        }
    } else {
        // ÖPPNAR
        chatWidget.style.display = 'flex';
        document.body.classList.add('chat-open'); // Lägg till klassen (döljer headern via CSS)
        document.body.style.overflow = 'hidden'; 
        
        history.pushState({ uiState: 'chat' }, null, window.location.href);

        // Scrolla till botten
        setTimeout(() => {
            const chatList = document.getElementById('chatMessages');
            if (chatList) chatList.scrollTop = chatList.scrollHeight;
        }, 100);
    }
};

window.initChat = function() {
    const chatList = document.getElementById('chatMessages');
    if (!chatList) return;

    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');
    const closeBtn = document.getElementById('closeChatWidget');
    const closeEditBtn = document.getElementById('closeEditBtn');
    const plusBtn = document.getElementById('chatPlusBtn');      
    const cameraBtn = document.getElementById('chatCameraBtn'); 
    const fileInputGallery = document.getElementById('chatFileInputGallery');
    const fileInputCamera = document.getElementById('chatFileInputCamera');
    const galleryBtn = document.getElementById('toggleGalleryBtn');
    if (galleryBtn) {
        galleryBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation(); // Hindrar klicket från att "bubbla" och stänga chatten
            openChatGallery();
        };
    }
    const closeGalleryBtn = document.getElementById('closeGalleryBtn');

    if (galleryBtn) galleryBtn.onclick = openChatGallery;
    if (closeGalleryBtn) closeGalleryBtn.onclick = closeChatGallery;

    if (closeBtn) closeBtn.onclick = window.toggleChatWidget;
    if (closeEditBtn) closeEditBtn.onclick = exitEditMode;

    // --- SÖK-TOGGLE LOGIK ---
    const btnOpenSearch = document.getElementById('btnOpenSearch');
    const btnCloseSearch = document.getElementById('btnCloseSearch');
    const chatHeader = document.getElementById('chatHeader');
    const searchInput = document.getElementById('chatSearchInput');

    // Öppna sök
    if (btnOpenSearch) {
        btnOpenSearch.onclick = () => {
            chatHeader.classList.add('search-active');
            // Vänta pyttelite så animationen hinner starta innan fokus
            setTimeout(() => searchInput.focus(), 100);
        };
    }

    // Stäng sök (X-knappen)
    if (btnCloseSearch) {
        btnCloseSearch.onclick = () => {
            chatHeader.classList.remove('search-active');
            searchInput.value = ''; // Rensa söktext
            // Trigga en "input"-händelse så att sök-filtreringen nollställs (visar alla meddelanden igen)
            searchInput.dispatchEvent(new Event('input'));
        };
    }

    // Stäng sök om man trycker ESC
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                btnCloseSearch.click();
            }
        });
    }

    // Hantera Skicka / Spara
    const handleChatAction = async () => {
        const text = chatInput.value.trim();
        if (!text) return;

        if (isEditingMsg && currentEditMsgId) {
            try {
                await window.db.collection('notes').doc(currentEditMsgId).update({
                    text: text,
                    isEdited: true
                });
                exitEditMode(); 
            } catch (err) {
                console.error("Fel vid uppdatering:", err);
            }
        } else {
            try {
                await window.db.collection("notes").add({
                    text: text,
                    timestamp: new Date().toISOString(),
                    platform: window.innerWidth <= 768 ? 'mobil' : 'dator',
                    type: 'text'
                });
                chatInput.value = '';
                setTimeout(() => {
                    chatList.scrollTo({ top: chatList.scrollHeight, behavior: 'smooth' });
                }, 100);
            } catch (err) {
                console.error("Fel vid sändning:", err);
            }
        }
    };

    // --- SÖKFUNKTIONALITET MED HIGHLIGHT ---
    const chatSearchInput = document.getElementById('chatSearchInput');
    const clearSearchBtn = document.getElementById('clearChatSearch');

    if (chatSearchInput) {
        chatSearchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            const lowerSearchTerm = searchTerm.toLowerCase();
            const messages = document.querySelectorAll('#chatMessages .chat-row');
            
            if (clearSearchBtn) {
                clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
            }

            messages.forEach(row => {
                const textElement = row.querySelector('.bubble-text-content');
                if (!textElement) {
                    // Hantera bildmeddelanden: dölj om vi söker
                    row.style.display = searchTerm ? 'none' : 'flex';
                    return;
                }

                // Hämta den råa texten (utan gammal highlight-HTML)
                // Vi använder dataset för att lagra originaltexten så vi inte tappar data
                if (!textElement.dataset.originalText) {
                    textElement.dataset.originalText = textElement.innerText;
                }
                const originalText = textElement.dataset.originalText;

                if (searchTerm === "") {
                    row.style.display = 'flex';
                    textElement.innerHTML = originalText; // Återställ original
                } else if (originalText.toLowerCase().includes(lowerSearchTerm)) {
                    row.style.display = 'flex';
                    
                    // Skapa en regex för att hitta sökordet (case-insensitive)
                    const regex = new RegExp(`(${searchTerm})`, 'gi');
                    
                    // Ersätt texten med highlight-versionen
                    textElement.innerHTML = originalText.replace(regex, '<span class="search-highlight">$1</span>');
                } else {
                    row.style.display = 'none';
                }
            });
            
            // Dölj datumavskiljare vid sökning
            document.querySelectorAll('.chat-date-separator').forEach(sep => {
                sep.style.display = searchTerm ? 'none' : 'flex';
            });
        });
    }

    if (sendBtn) sendBtn.onclick = handleChatAction;
    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatAction();
            }
        });
    }

    if (plusBtn && fileInputGallery) {
        plusBtn.onclick = () => fileInputGallery.click();
        fileInputGallery.onchange = (e) => handleImageUpload(e.target.files[0]);
    }
    if (cameraBtn && fileInputCamera) {
        cameraBtn.onclick = () => fileInputCamera.click();
        fileInputCamera.onchange = (e) => handleImageUpload(e.target.files[0]);
    }

    setupChatListener(50);
};

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
            docs.reverse();

            // Notis-badge
            const clockCount = docs.filter(msg => msg.reaction === '🕒').length;
            updateChatBadge(clockCount);

            chatList.innerHTML = '<div style="flex-grow: 1;"></div>';
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

            if (limit === 50) {
                // Vänta en millisekund på att bilderna ska börja renderas
                setTimeout(() => {
                    chatList.scrollTo({
                        top: chatList.scrollHeight,
                        behavior: 'instant' // 'instant' är bättre vid första laddning
                    });
                }, 50);
            }
        });
}

// --- TIMER LOGIK ---
function stopMenuTimer() {
    if (chatMenuTimer) {
        clearTimeout(chatMenuTimer);
        chatMenuTimer = null;
    }
}

function startMenuTimer() {
    stopMenuTimer();
    chatMenuTimer = setTimeout(() => {
        document.querySelectorAll('.chat-row.show-menu').forEach(el => {
            el.classList.remove('show-menu');
        });
    }, 4000); 
}

// --- GLOBALA KNAPP-FUNKTIONER (Fixade) ---

window.toggleMessageMenu = function(msgId, event) {
    if(event) { event.stopPropagation(); event.preventDefault(); }

    const row = document.querySelector(`.chat-row[data-message-id="${msgId}"]`);
    if (!row) return;

    document.querySelectorAll('.chat-row.show-menu').forEach(el => {
        if(el !== row) el.classList.remove('show-menu');
    });

    const isOpening = !row.classList.contains('show-menu');
    if (isOpening) {
        row.classList.add('show-menu');
        startMenuTimer();
    } else {
        row.classList.remove('show-menu');
        stopMenuTimer();
    }
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
    if(event) { 
        event.stopPropagation(); 
        event.preventDefault(); 
    }
    
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

// --- RENDER CHAT BUBBLE (Fixad version) ---
function renderChatBubble(data, container) {
    const messageId = data.id; 
    const row = document.createElement('div');
    
    let senderType = 'other';
    if (data.platform === 'system') senderType = 'system';
    else senderType = (data.platform === 'mobil' || data.platform === 'dator') ? 'me' : 'other';

    row.className = `chat-row ${senderType}`;
    row.dataset.messageId = messageId;
    
    // Timer events
    row.onmouseenter = stopMenuTimer;
    row.onmouseleave = startMenuTimer;
    row.onclick = (e) => window.toggleMessageMenu(messageId, e);

    const menu = document.createElement('div');
    menu.className = 'chat-action-menu';
    menu.onmouseenter = stopMenuTimer;
    menu.onmouseleave = startMenuTimer;

    // Notera: Vi använder onclick med window.funktioner
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

    if (data.text) {
        const textDiv = document.createElement('div');
        textDiv.className = 'bubble-text-content';
        textDiv.innerHTML = data.text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        bubble.appendChild(textDiv);
    }

    if (data.image) {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'chat-bubble-image';
        const img = document.createElement('img');
        img.src = data.image;
        img.loading = "lazy";
        img.onclick = (e) => { e.stopPropagation(); window.openImageZoom(data.image, messageId); };
        imgContainer.appendChild(img);
        bubble.appendChild(imgContainer);
    }

    if (data.reaction) {
        const reactionBadge = document.createElement('div');
        reactionBadge.className = 'reaction-badge-display';
        reactionBadge.textContent = data.reaction;
        reactionBadge.onclick = (e) => window.setReaction(messageId, data.reaction, e); 
        bubble.appendChild(reactionBadge);
    }

    row.appendChild(bubble);

    if (data.timestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        let t = new Date(data.timestamp);
        timeDiv.textContent = t.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        row.appendChild(timeDiv);
    }

    container.appendChild(row);
}

// --- HJÄLPFUNKTIONER (Datum, Badge, EditMode, Bilder) ---

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
    setBadge(document.getElementById('fabChat'));
    setBadge(document.getElementById('mobileChatBtn'));
}

function enterEditMode(rowElement, currentText) {
    const messageId = rowElement.dataset.messageId;
    if (!messageId) return;
    isEditingMsg = true;
    currentEditMsgId = messageId;

    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    inputField.value = currentText;
    inputField.focus();
    chatWidget.classList.add('edit-mode');
    if(editHeader) editHeader.style.display = 'flex';
    if(sendBtn) {
        sendBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>`;
    }
}

function exitEditMode() {
    isEditingMsg = false;
    currentEditMsgId = null;
    const chatWidget = document.getElementById('chatWidget');
    const inputField = document.getElementById('chatInput');
    const editHeader = document.getElementById('chatEditHeader');
    const sendBtn = document.getElementById('chatSendBtn');

    inputField.value = '';
    chatWidget.classList.remove('edit-mode');
    if(editHeader) editHeader.style.display = 'none';
    if(sendBtn) {
        sendBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>`;
    }
}

// BILDHANTERING
async function handleImageUpload(file) {
    if (!file) return;
    console.log("Bearbetar bild...");
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

window.openImageZoom = function(src, docId) {
    if (typeof addHistoryState === 'function') addHistoryState();
    const modal = document.getElementById('imageZoomModal');
    const imgMain = document.getElementById('mmImgMain');
    const deleteBtn = document.getElementById('mmDeleteBtn');
    const closeBtn = document.getElementById('mmCloseBtn'); // Lägg till stängknappen

    if (modal && imgMain) {
        imgMain.src = src;
        imgMain.dataset.id = docId || ''; 
        modal.style.display = 'flex';

        // --- FIX: Stängknapp ---
        if(closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                if (history.state && history.state.modalOpen) history.back();
            };
        }

        modal.onclick = (e) => {
            if (e.target === modal || e.target.classList.contains('image-modal-toolbar')) {
                modal.style.display = 'none';
                if (history.state && history.state.modalOpen) history.back();
            }
        };

        if (deleteBtn) {
            deleteBtn.style.display = docId ? 'flex' : 'none';
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm('Radera bilden permanent?')) {
                    try {
                        await window.db.collection("notes").doc(docId).delete();
                        modal.style.display = 'none';
                    } catch (error) { console.error(error); }
                }
            };
        }
    }
};

// Öppna galleriet
function openChatGallery() {
    const galleryModal = document.getElementById('chatGalleryModal');
    const galleryContent = document.getElementById('chatGalleryContent');
    if (!galleryModal || !galleryContent) return;

    galleryContent.innerHTML = ''; // Rensa gamla bilder
    
    // Hitta alla bild-rader som just nu finns i DOM:en
    const imageElements = document.querySelectorAll('.chat-bubble-image img');
    
    if (imageElements.length === 0) {
        galleryContent.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px; color:#8e8e93;">Inga bilder i chatten.</div>';
    } else {
        imageElements.forEach(img => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            // Vi klonar bilden för att behålla src och docId
            const clone = document.createElement('img');
            clone.src = img.src;
            
            div.onclick = () => {
                closeChatGallery(); // Stäng galleriet först
                // Använd din befintliga zoom-funktion
                window.openImageZoom(img.src, img.closest('.chat-row')?.dataset.messageId);
            };
            
            div.appendChild(clone);
            galleryContent.appendChild(div);
        });
    }

    galleryModal.style.display = 'flex';
}

// Stäng galleriet
function closeChatGallery() {
    const galleryModal = document.getElementById('chatGalleryModal');
    if (galleryModal) galleryModal.style.display = 'none';
}
