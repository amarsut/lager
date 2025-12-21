* {
    -webkit-tap-highlight-color: transparent;
}
/* ==========================================================================
   MODERN CHAT - CLEAN & OPTIMIZED (v2.0)
   ========================================================================== */

/* --- 1. Flytande Chatt-knapp (FAB) --- */
@media (min-width: 769px) {
    #fabChat {
        position: fixed !important;
        bottom: 30px !important;
        right: 30px !important;
        width: 60px !important;
        height: 60px !important;
        background-color: #0066FF !important;
        color: white !important;
        border-radius: 50% !important;
        border: none !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center;
        justify-content: center;
        cursor: pointer !important;
        transition: transform 0.2s, box-shadow 0.2s;
    }
    #fabChat svg { width: 28px !important; height: 28px !important; stroke: white !important; }
    #fabChat:hover {
        transform: translateY(-3px) scale(1.05) !important;
        box-shadow: 0 15px 35px -8px rgba(59, 130, 246, 0.7) !important;
    }
}
@media (max-width: 768px) {
    #fabChat { display: none !important; }
}

/* --- 2. Huvudfönster (Widget Container) --- */
#chatWidget {
    position: fixed;
    z-index: 1000;
    background: rgba(255, 255, 255, 0.85); /* Glassmorphism */
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.3);
    display: flex; 
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    animation: chatPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Desktop position */
@media (min-width: 769px) {
    #chatWidget {
        bottom: 105px; 
        right: 30px;
        width: clamp(400px, 40vw, 500px); 
        height: 600px;
        max-height: 80vh;
        border-radius: 24px;
    }
}

/* Mobil position (Helskärm) */
@media (max-width: 768px) {
    #chatWidget {
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
        z-index: 99999 !important;
        background: #fff; /* Fallback på mobil */
    }
}

@keyframes chatPopIn {
    from { opacity: 0; transform: translateY(30px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* --- 3. Header (WhatsApp/Telegram Style) --- */
.chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding: 0 12px;
    background: rgba(255, 255, 255, 0.5); /* Genomskinlig */
    backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(0,0,0,0.06);
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
}

/* Mobil header anpassning */
@media (max-width: 768px) {
    .chat-header {
        padding-top: env(safe-area-inset-top); 
        height: calc(60px + env(safe-area-inset-top));
    }
}

/* Standard Header Innehåll */
.header-content-default {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 8px;
    transition: transform 0.2s ease, opacity 0.2s ease;
}

/* Titlar */
.header-title-info { display: flex; flex-direction: column; justify-content: center; }
.chat-title { font-size: 1rem; font-weight: 600; color: #1C1C1E; line-height: 1.1; }
.chat-subtitle { font-size: 0.75rem; color: #34C759; font-weight: 500; }

/* Header Knappar */
.header-icon-btn, .header-tool-btn {
    width: 40px; height: 40px;
    border-radius: 50%; border: none;
    background: transparent; color: #1C1C1E;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background 0.2s;
}
.header-icon-btn { background: #F2F2F7; color: #8E8E93; border-radius: 12px; } /* Tillbaka-knapp fyrkantig */
.header-icon-btn:hover, .header-tool-btn:hover { background: rgba(0,0,0,0.05); color: #000; }

/* Justering av ikon-gruppen i headern */
.header-actions {
    display: flex; gap: 4px;
}
@media (max-width: 768px) {
    .header-actions { margin-right: -25px; margin-top: -14px; }
}
@media (min-width: 769px) {
    .header-actions { margin-right: -8px; margin-top: -4px; }
}

/* Sök-fält (Dold default) */
.header-search-bar {
    position: absolute; top: 0; left: 50px; right: 0; bottom: 0;
    background: #fff;
    display: flex; align-items: center; padding-right: 12px;
    opacity: 0; transform: translateX(20px); pointer-events: none;
    transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
    padding-top: env(safe-area-inset-top); /* Mobil fix */
}
.header-search-bar input {
    flex: 1; border: none; background: transparent; font-size: 1rem;
    outline: none; height: 100%; padding: 0 8px;
}

/* Header Aktivt Sök-läge */
.chat-header.search-active .header-content-default { opacity: 0; transform: translateX(-20px); pointer-events: none; }
.chat-header.search-active .header-search-bar { opacity: 1; transform: translateX(0); pointer-events: auto; }

/* --- 4. Meddelandelista --- */
.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px;
    display: flex; flex-direction: column;
    gap: 8px;
    background-color: transparent; /* Låt widgetens bakgrund synas */
    scrollbar-width: thin; scrollbar-color: #D1D1D6 transparent;
}
@media (max-width: 768px) { .chat-messages { overscroll-behavior-y: contain; padding-top: 10px; } }

.chat-messages::-webkit-scrollbar { width: 6px; }
.chat-messages::-webkit-scrollbar-thumb { background-color: #D1D1D6; border-radius: 3px; }

/* Datumavskiljare */
.chat-date-separator {
    text-align: center; font-size: 0.7rem; color: #8E8E93; font-weight: 600;
    margin: 12px 0; text-transform: uppercase; letter-spacing: 0.5px;
    position: relative; display: flex; align-items: center; justify-content: center;
}
.chat-date-separator span { background: #fff; padding: 0 10px; border-radius: 10px; z-index: 1; }
.chat-date-separator::before { content: ''; position: absolute; left: 0; right: 0; height: 1px; background: #E5E5EA; z-index: 0; }

/* --- 5. Meddelandebubblor --- */
.chat-row {
    display: flex; flex-direction: column; max-width: 80%;
    position: relative; margin-bottom: 20px;
    animation: bubblePop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
.chat-row:last-child { margin-bottom: 0; }
@keyframes bubblePop { from { opacity: 0; transform: scale(0.9) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.chat-row.me { align-self: flex-end; align-items: flex-end; }
.chat-row.other, .chat-row.system { align-self: flex-start; align-items: flex-start; }

/* Bubbla Design (Premium) */
.chat-bubble {
    padding: 10px 16px; 
    font-size: 0.95rem; 
    line-height: 1.45; 
    position: relative;
    
    /* FIXAR ÖVERFLÖDE: */
    word-wrap: break-word;      /* Gammal standard */
    overflow-wrap: anywhere;    /* Modern standard, bryter även långa länkar */
    word-break: break-word;     /* Extra säkerhet */
    
    max-width: 100%; /* För säkerhets skull */
}

/* JAG (Blå gradient) */
.chat-row.me .chat-bubble {
    background: linear-gradient(135deg, #0066FF 0%, #0052cc 100%) !important;
    box-shadow: 0 4px 15px rgba(0, 102, 255, 0.3);
    color: white; border-radius: 20px 20px 4px 20px !important;
}
.chat-row.me .chat-bubble a { color: white; text-decoration: underline; }

/* ANDRA (Vit/Grå) */
.chat-row.other .chat-bubble {
    background: #E9E9EB !important; /* Mörkare, klassisk iOS grå */
    color: #000000 !important;
    box-shadow: none !important; /* Plattare look är oftast renare */
    border-radius: 20px 20px 20px 4px !important;
}

/* SYSTEM (Ljusgrå) */
.chat-row.system .chat-bubble {
    background: #E9E9EB !important; /* Mörkare, klassisk iOS grå */
    color: #000000 !important;
    box-shadow: none !important; /* Plattare look är oftast renare */
    border-radius: 20px 20px 20px 4px !important;
}
.chat-row.system { align-self: center; max-width: 90%; margin-bottom: 10px; }

/* Bildbubblor */
.chat-bubble.is-image { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
.chat-bubble-image img {
    border-radius: 18px; max-width: 100%; max-height: 300px;
    display: block; cursor: zoom-in; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transition: transform 0.2s;
}
.chat-bubble-image img:hover { transform: scale(1.02); }

/* Tidsstämpel */
.chat-time { font-size: 0.65rem; color: #9CA3AF; margin-top: 4px; font-weight: 500; }
.chat-row.me .chat-time { text-align: right; margin-right: 4px; }
.chat-row.other .chat-time { text-align: left; margin-left: 4px; }

/* Sök-highlight */
.search-highlight { background-color: #ffeb3b; color: #000; border-radius: 2px; }

/* --- 6. Input Area (Compact Footer) --- */
.chat-input-area {
    min-height: 60px !important;
    background: #FFFFFF;
    display: flex; align-items: center !important; /* Centrerad */
    gap: 12px;
    border-top: 1px solid #F2F2F7;
    position: relative;
    
    /* Compact Padding */
    padding-top: 8px !important;
    padding-left: 10px !important;
    padding-right: 10px !important;
    padding-bottom: max(8px, env(safe-area-inset-bottom)) !important;
}

/* Textfält */
.chat-input-area textarea {
    flex: 1;
    min-height: 40px !important; 
    height: 40px !important; 
    max-height: 40px !important; /* Lås höjden */
    
    background: #FFFFFF !important;
    border: 1px solid rgba(0,0,0,0.1) !important;
    border-radius: 25px !important;
    
    /* Centrera texten vertikalt */
    padding: 0 14px !important; 
    padding-right: 90px !important; /* Plats för ikoner */
    line-height: 38px !important;   /* Matchar höjden minus border för perfekt mitten-text */
    
    font-size: 0.95rem; 
    font-family: inherit; 
    resize: none; 
    outline: none;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    transition: all 0.2s ease; 
    margin: 0 !important;
    
    /* NYTT: Tvinga texten att gå åt höger */
    white-space: nowrap !important;
    overflow-x: auto !important;  /* Tillåt scroll i sidled */
    overflow-y: hidden !important; /* Ingen höjd-scroll */
    
    /* Dölj scrollbar för en renare look */
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
}

/* Dölj scrollbar i textrutan (Chrome/Safari/Opera) */
.chat-input-area textarea::-webkit-scrollbar {
    display: none;
}
.chat-input-area textarea:focus {
    box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15) !important;
    border-color: transparent !important;
}

/* Ikoner inuti input (Gem/Kamera) - Centrerade med transform */
.chat-actions-left { 
    position: absolute; 
    top: 50% !important; transform: translateY(-50%) !important;
    right: 65px !important; /* Avstånd från högerkanten av textrutan */
    display: flex; gap: 4px; z-index: 20;
    pointer-events: auto; bottom: auto !important;
}
.chat-actions-left .icon-btn { 
    color: #8E8E93; width: 32px; height: 32px; border-radius: 50%;
    background: transparent; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
}
.chat-actions-left .icon-btn:hover { color: #007AFF; background: rgba(0, 122, 255, 0.1); }

/* Sänd-knapp */
#chatSendBtn {
    width: 38px !important; height: 38px !important; border-radius: 50%;
    background: linear-gradient(135deg, #0066FF 0%, #0052cc 100%) !important;
    color: white; border: none; flex-shrink: 0; margin: 0 !important;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: transform 0.2s;
    box-shadow: 0 4px 10px rgba(0, 122, 255, 0.2);
}
#chatSendBtn:active { transform: scale(0.9); }
#chatSendBtn svg { width: 18px; height: 18px; margin-left: 2px; }

/* Edit Mode styling för input */
.chat-widget.edit-mode .chat-input-area {
    display: grid !important; grid-template-columns: 1fr auto;
    gap: 8px; align-items: center;
}
.chat-widget.edit-mode .chat-actions-left { display: none !important; }

/* --- 7. Menyn för meddelanden (Högerklick/Hover) --- */
.chat-action-menu {
    display: none; position: absolute; top: -45px;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px); border: 1px solid rgba(0,0,0,0.08);
    border-radius: 30px; padding: 6px 10px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    align-items: center; gap: 6px; z-index: 2000;
    animation: popInMenu 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.chat-row.me .chat-action-menu { right: 0; }
.chat-row.other .chat-action-menu { left: 0; }
.chat-row:hover .chat-action-menu, .chat-row.show-menu .chat-action-menu { display: flex; }
.chat-row:hover, .chat-row.show-menu { z-index: 100; } /* Lyfter raden över datum */

.action-emoji-btn, .action-icon-btn {
    background: transparent; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s;
}
.action-emoji-btn { font-size: 1.3rem; width: 32px; height: 32px; border-radius: 50%; }
.action-emoji-btn:hover { transform: scale(1.2); background: rgba(0,0,0,0.05); }

.action-icon-btn { color: #64748b; width: 32px; height: 32px; border-radius: 50%; }
.action-icon-btn:hover { background: #f1f5f9; color: #007aff; }
.action-icon-btn.danger:hover { background: #fef2f2; color: #ef4444; }
.action-separator { width: 1px; height: 20px; background: #e5e5ea; margin: 0 4px; }

/* Reaktioner (liten ikon på bubblan) */
.reaction-badge-display {
    position: absolute; bottom: -8px; right: -12px;
    background: #fff; border: 2px solid #fff; border-radius: 12px;
    padding: 2px 4px; font-size: 0.85rem; cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1); z-index: 10;
    animation: popInBadge 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.chat-row.other .reaction-badge-display { right: auto; left: 10px; }

@keyframes popInBadge { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes popInMenu { from { opacity: 0; transform: translateY(10px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* --- 8. Galleri Overlay --- */
.chat-gallery-overlay {
    position: fixed; z-index: 2147483647 !important;
    background: #ffffff; display: flex; flex-direction: column;
    overflow: hidden;
    bottom: 105px; right: 30px;
    width: clamp(400px, 40vw, 500px); height: 600px; max-height: 80vh;
    border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    animation: galleryFadeIn 0.2s ease-out forwards;
}
@media (max-width: 768px) {
    .chat-gallery-overlay {
        top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100% !important; height: 100% !important; max-height: none !important;
        border-radius: 0 !important; margin: 0 !important;
    }
}
@keyframes galleryFadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

.chat-gallery-header {
    height: 60px; padding: 0 16px; display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid #f2f2f7; background: #fff;
}
@media (max-width: 768px) { .chat-gallery-header { padding-top: env(safe-area-inset-top); height: auto; padding-bottom: 10px; } }

.chat-gallery-grid {
    flex: 1;
    overflow-y: auto;
    display: grid !important; /* Tvinga grid */
    grid-template-columns: repeat(3, 1fr) !important; /* 3 kolumner */
    gap: 2px;
    padding: 2px;
    align-content: start; /* Hindrar att de sträcks ut om få bilder */
}

.gallery-item {
    position: relative;
    aspect-ratio: 1/1; /* Kvadratisk */
    width: 100%;
    overflow: hidden;
    background: #f0f0f0;
    cursor: pointer;
}

.gallery-item img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important; /* Klipp bilden snyggt */
    display: block;
}

/* --- 9. Bildvisare (Samsung One UI Style) --- */
.image-modal-overlay {
    display: none; 
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    z-index: 999999 !important;
    
    /* NYTT: Glossy effekt istället för solid svart */
    background-color: rgba(0, 0, 0, 0.6) !important; 
    backdrop-filter: blur(15px) !important;
    -webkit-backdrop-filter: blur(15px) !important;
    
    flex-direction: column; 
    justify-content: space-between;
    animation: fadeInModal 0.2s ease-out;
}
@media (max-width: 768px) {
    #imageZoomModal.image-modal-overlay {
        /* Sänkte från 0.8 till 0.6 för att släppa igenom mer ljus */
        background-color: rgba(0, 0, 0, 0.6) !important; 
        backdrop-filter: blur(15px) !important;
        -webkit-backdrop-filter: blur(15px) !important;
    }
}
@keyframes fadeInModal { from { opacity: 0; } to { opacity: 1; } }

/* Top Bar */
.gallery-top-bar {
    height: 60px; display: flex; justify-content: center; align-items: center;
    padding-top: env(safe-area-inset-top); z-index: 10; pointer-events: none;
}
#galleryCounter {
    color: #fff; font-size: 0.95rem; font-weight: 600; opacity: 0.9;
    background: rgba(0,0,0,0.3); padding: 4px 12px; border-radius: 20px;
}
@media (max-width: 768px) { .gallery-top-bar { padding-top: 20px !important; } }

/* Main Image Area */
.gallery-main-area {
    flex: 1; display: flex; align-items: center; justify-content: center;
    position: relative; width: 100%; overflow: hidden;
}
#mmImgMain {
    max-width: 85vw; max-height: 70vh; object-fit: contain;
    border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    transition: transform 0.2s ease;
}
/* Mobilspecifik bildstorlek */
@media (max-width: 768px) {
    #imageZoomModal #mmImgMain {
        max-height: 70vh !important;
        max-width: 85vw !important;
        border-radius: 24px !important;
    }
}

/* Navigation Arrows */
.nav-arrow {
    position: absolute; top: 50%; transform: translateY(-50%);
    background: rgba(255,255,255,0.1); border: none; color: white;
    width: 44px; height: 44px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    backdrop-filter: blur(10px); z-index: 5;
}
.nav-arrow.prev { left: 15px; } .nav-arrow.next { right: 15px; }
@media (hover: none) and (pointer: coarse) { .nav-arrow { display: none; } }

/* Bottom Toolbar */
.gallery-bottom-bar.compact-bar {
    min-height: 90px; padding-top: 10px;
    padding-bottom: max(10px, env(safe-area-inset-bottom));
    display: flex; justify-content: space-evenly; align-items: flex-start;
}
.gallery-action-btn {
    background: transparent; border: none; display: flex; flex-direction: column;
    align-items: center; gap: 4px; cursor: pointer; color: #fff; width: 55px;
}
.gallery-action-btn .icon-circle {
    width: 38px; height: 38px; border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex; align-items: center; justify-content: center;
}
.gallery-action-btn svg { width: 20px; height: 20px; stroke: #fff; }
.gallery-action-btn span { font-size: 0.7rem; color: #ddd; }
.gallery-action-btn.danger .icon-circle { background: rgba(255, 59, 48, 0.15); }


/* --- 8. Notis Badge --- */
.chat-notification-badge {
    position: absolute; top: -4px; right: -4px;
    background-color: #FF3B30; color: white;
    font-size: 0.75rem; font-weight: 700;
    min-width: 22px; height: 22px; border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    z-index: 20; animation: popInBadge 0.3s forwards;
}

@media (max-width: 768px) {
    /* Se till att knappen är relativ så badgen hamnar rätt */
    #mobileChatBtn { position: relative; }

    #mobileChatBtn .chat-notification-badge {
        /* PLACERING: Justera dessa för att "krama" ikonen */
        top: 3px !important;       /* Lite högre upp än förut */
        right: 15px !important;    /* Flytta in den mer mot mitten (ikonen är centrerad) */
        
        /* STORLEK: Öka lite för läsbarhet */
        min-width: 18px !important; 
        height: 18px !important; 
        font-size: 0.7rem !important; /* Lite tydligare siffra */
        
        /* DESIGN: Snygg vit kant runt (gör att den "skär" in i ikonen snyggt) */
        border: 2px solid #ffffff !important; 
        box-shadow: 0 1px 2px rgba(0,0,0,0.15) !important;
        padding: 0 4px !important; /* Om det blir tvåsiffrigt (99) växer den snyggt */
    }
}

/* --- 9. Edit Mode (Redigering) --- */
.chat-widget.edit-mode .chat-messages { opacity: 0.4; pointer-events: none; filter: grayscale(80%); }
.chat-widget.edit-mode .chat-actions-left { display: none !important; }
.chat-widget.edit-mode .chat-input-area {
    display: grid !important;
    grid-template-areas: "header header" "input button";
    grid-template-columns: 1fr auto;
    padding: 0 10px 10px 10px !important;
    border-radius: 0;
}
.chat-widget.edit-mode .chat-edit-header {
    grid-area: header; display: flex !important; justify-content: space-between; 
    align-items: center; padding: 8px; font-size: 13px; font-weight: 600;
}
.chat-widget.edit-mode #closeEditBtn {
    background: none; border: none; font-size: 18px; color: #65676b; cursor: pointer;
}
.chat-widget.edit-mode #chatInput {
    grid-area: input; background: #f0f2f5 !important; border-radius: 20px !important;
    height: 40px !important; padding: 10px 16px !important;
}
.chat-widget.edit-mode #chatSendBtn {
    grid-area: button; width: 36px; height: 36px; margin-left: 8px; align-self: center;
    background-color: #0084ff;
}
/* --- FIX FÖR TEXTPOSITION I REDIGERINGSLÄGE --- */
.chat-widget.edit-mode .chat-input-area textarea { padding-top: 0 !important; padding-bottom: 0 !important; height: 40px !important; line-height: 20px !important; padding-left: 14px !important; padding-right: 14px !important; background: #f0f2f5 !important; }

/* Scroll-till-botten knapp */
.chat-scroll-btn {
    position: absolute;
    bottom: 80px; /* Ovanför textfältet */
    right: 20px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #fff;
    border: 1px solid #e5e5ea;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    color: #007aff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    z-index: 50;
}
.chat-scroll-btn.visible { opacity: 1; pointer-events: auto; transform: translateY(0); }
.chat-scroll-btn svg { width: 20px; height: 20px; }

/* Fäst meddelande list */
.pinned-message-bar {
    background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 8px 12px; display: flex; align-items: center;
    justify-content: space-between; cursor: pointer; font-size: 0.85rem; z-index: 10;
}
.pinned-bar-left { display: flex; align-items: center; gap: 8px; overflow: hidden; }
.pin-icon-small { width: 14px; height: 14px; color: #007aff; flex-shrink: 0; }
.pinned-content { display: flex; flex-direction: column; overflow: hidden; }
.pinned-label { font-size: 0.7rem; font-weight: 700; color: #007aff; text-transform: uppercase; }
.pinned-text { color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.unpin-btn { background: none; border: none; color: #94a3b8; cursor: pointer; padding: 4px; display: flex; }
.unpin-btn svg { width: 16px; height: 16px; }

/*

AI RELATERAT UTSEENDE OCH ANIMATIONER ---

*/

/* --- AI MODE STYLES --- */

/* Bakgrundsfärg när AI är igång */
.ai-mode-active .chat-widget {
    background: linear-gradient(to bottom, #f8faff, #f0f4ff);
}

/* Gemini Ikon Aktiv */
#toggleAiBtn.active-ai {
    background-color: transparent !important; /* Ingen cirkel */
    color: #8b5cf6 !important;            /* Gemini-lila färg på loggan */
    border-color: transparent !important;
    transform: scale(1.1);                 /* Behåll en liten förstoring för feedback */
    filter: drop-shadow(0 0 3px rgba(139, 92, 246, 0.3)); /* Valfritt: ett svagt lila sken */
}

/* Input-fältet i AI-läge */
.ai-input-active input#chatInput {
    border: 2px solid #818cf8 !important;
    background-color: #ffffff !important;
    box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
}

/* CHIPS (Förslagen) */
.ai-chips-scroll {
    display: flex;
    gap: 8px;
    padding: 10px 15px;
    overflow-x: auto;
    background: rgba(255,255,255,0.9);
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
    /* Dölj scrollbar men behåll funktion */
    -ms-overflow-style: none;  
    scrollbar-width: none;  
}
.ai-chips-scroll::-webkit-scrollbar { display: none; }

.ai-chip {
    background: #eff6ff;
    color: #1e40af;
    border: 1px solid #dbeafe;
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0; /* Förhindra att de krymps */
}
.ai-chip:active { transform: scale(0.95); background: #dbeafe; }

/* AI Meddelanden (Unik stil) */
.chat-bubble.ai-response {
    background: #ffffff;
    border-left: 3px solid #6366f1; /* Lila kant */
    color: #1e293b;
    border-radius: 4px 12px 12px 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    font-family: 'Inter', sans-serif; /* Läsbar font */
    max-width: 90%;
}

/* En liten disclaimer i botten av bubblan */
.ai-disclaimer {
    font-size: 0.65rem;
    color: #94a3b8;
    margin-top: 8px;
    display: block;
    border-top: 1px solid #f1f5f9;
    padding-top: 4px;
}

/* Välkomstskärm */
.ai-welcome-screen {
    text-align: center;
    padding: 40px 20px;
    color: #64748b;
}
.ai-sparkle-bg { font-size: 3rem; margin-bottom: 10px; opacity: 0.8; }
