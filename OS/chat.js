const { useState, useEffect, useRef } = React;

// --- 1. HJÄLPFUNKTIONER ---

const compressImage = async (file, maxWidth = 1000, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', quality));
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

const getSenderName = (msg) => msg?.sender?.split('@')[0].toUpperCase() || "SYSTEM";

const formatTime = (ts) => {
    if (!ts) return "";
    const date = (typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDateLabel = (ts) => {
    if (!ts) return "";
    const date = (typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "IDAG";
    if (date.toDateString() === yesterday.toDateString()) return "IGÅR";
    return date.toLocaleDateString([], { day: 'numeric', month: 'short' }).toUpperCase();
};

// --- 2. SVG IKONER ---

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const CameraIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
);
const SendIcon = ({ active }) => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-blue-500" : "text-zinc-600"}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
);
const ModalCloseIcon = () => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
);
const DownloadIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const TrashLargeIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const EditIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

// --- 3. HUVUDKOMPONENT ---

const ChatView = ({ user, setView, viewParams, isPopup, onClose }) => {
    const Icon = window.Icon;
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('chat_theme_dark') !== 'false');
    
    // NYTT: Filter styrs nu lokalt så popupen inte pajar global navigering
    const [filter, setFilter] = useState(viewParams?.filter || 'all');
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const scrollRef = useRef(null);
    const menuRef = useRef(null);
    
    // Används för att "minnas" state inuti event-lyssnare
    const stateRef = useRef({ activeImage, filter, viewParams });
    useEffect(() => { stateRef.current = { activeImage, filter, viewParams }; }, [activeImage, filter, viewParams]);

    // FIX: Skapa/Uppdatera ikonerna varje gång fönstret laddas
    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [isDarkMode, filter, isPopup, activeImage]); // EFTER

    let lastDateLabel = null;

    // --- SCROLL FUNKTION ---
    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        if (filter === 'all') {
            setTimeout(scrollToBottom, 50);
        }
    }, [filter]);

    // --- FIX: Hantera bakåt-knappen (Bara om det INTE är popup) ---
    useEffect(() => {
        const handlePopState = () => {
            if (isPopup) return; // Rör inte historiken om det är en popup
            
            const { activeImage, filter, viewParams } = stateRef.current;
            if (activeImage) {
                setActiveImage(null);
                return;
            }
            if (filter === 'image') {
                setView('CHAT', { ...viewParams, filter: 'all' });
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isPopup]);

    // --- STÄNG MENY VID KLICK UTANFÖR ---
    useEffect(() => {
        const handleOutside = (event) => {
            if (activeMenu && menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("touchstart", handleOutside);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("touchstart", handleOutside);
        };
    }, [activeMenu]);

    // --- HÄMTA MEDDELANDEN ---
    useEffect(() => {
        const openImageId = viewParams?.openImage;
        if (openImageId && !isPopup) {
            const msg = messages.find(m => m.id === openImageId);
            if (msg) setActiveImage(msg);
        }
    }, [viewParams, messages, isPopup]);

    useEffect(() => {
        localStorage.setItem('chat_theme_dark', isDarkMode);
    }, [isDarkMode]);

    // --- FILTER & NAVIGATION ---
    const handleFilterChange = (newFilter) => {
        if (newFilter === filter) return;
        
        setFilter(newFilter); // Sätt alltid lokalt!

        if (!isPopup) {
            if (newFilter === 'image') {
                 window.history.pushState({ gallery: true }, "", window.location.href);
                 setView('CHAT', { filter: newFilter });
            } else if (newFilter === 'all' && filter === 'image') {
                window.history.back();
            } else {
                setView('CHAT', { filter: newFilter });
            }
        }
    };

    const handleBack = () => {
        if (isPopup) {
            if (activeImage) setActiveImage(null);
            else if (filter === 'image') setFilter('all');
            else onClose();
        } else {
            filter === 'image' ? handleFilterChange('all') : window.history.back();
        }
    };

    const handleOpenImage = (e, msg) => {
        e.stopPropagation();
        setActiveMenu(null);
        setActiveImage(msg); // Sätt lokalt
        
        if (!isPopup) {
            window.history.pushState({ imageOpen: true }, "", window.location.href);
            setView('CHAT', { ...viewParams, openImage: msg.id });
        }
    };

    // --- FIREBASE SUBSCRIPTION ---
    useEffect(() => {
        const unsubscribe = window.db.collection("notes").orderBy("timestamp", "asc").onSnapshot(snap => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(docs);
            if (filter === 'all') {
                setTimeout(scrollToBottom, 100);
            }
        });
        return () => unsubscribe();
    }, [filter]);

    const handleAction = async (e) => {
        if (e) e.preventDefault();
        const textToSend = inputText.trim();
        if (!textToSend) {
            if (editingId) { setEditingId(null); setInputText(""); }
            return;
        }
        const currentEditId = editingId;
        setInputText("");
        setEditingId(null);
        try {
            if (currentEditId) {
                await window.db.collection("notes").doc(currentEditId).update({ text: textToSend, isEdited: true });
            } else {
                await window.db.collection("notes").add({
                    text: textToSend, sender: user.email, timestamp: new Date().toISOString(), type: 'text'
                });
            }
            scrollToBottom();
        } catch (error) { console.error("Action Error:", error); }
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            let fileData = file.type.startsWith('image/') ? await compressImage(file) : await new Promise(res => {
                const r = new FileReader(); r.onload = (ev) => res(ev.target.result); r.readAsDataURL(file);
            });
            if (fileData.length > 1048487) {
                alert("Filen är för stor.");
                setIsUploading(false); return;
            }
            await window.db.collection("notes").add({
                text: file.name, fileUrl: fileData, type: file.type.startsWith('image/') ? 'image' : 'file',
                timestamp: new Date().toISOString(), sender: user.email
            });
            scrollToBottom();
        } catch (err) { console.error(err); }
        setIsUploading(false);
        e.target.value = null;
    };

    const toggleReaction = async (id, emoji) => {
        const msg = messages.find(m => m.id === id);
        if (!msg) return;
        const reactions = { ...(msg.reactions || {}) };
        if (reactions[emoji] > 0) {
            reactions[emoji] -= 1;
            if (reactions[emoji] <= 0) delete reactions[emoji];
        } else {
            reactions[emoji] = (reactions[emoji] || 0) + 1;
        }
        await window.db.collection("notes").doc(id).update({ reactions });
        setActiveMenu(null);
    };

    const renderMessageText = (text) => {
        if (!text) return "";
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                        className="underline decoration-1 hover:opacity-70 break-all text-blue-500 transition-opacity">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // --- RENDERING ---
    return (
        <div className={isPopup ? "w-full h-full flex flex-col bg-transparent" : "fixed inset-0 z-[1000] lg:relative lg:inset-auto lg:flex lg:items-start lg:justify-start lg:-mt-4 max-lg:bg-black animate-in fade-in duration-300 font-sans"}>
            <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-[#0f0f11] border-zinc-800' : 'bg-zinc-50 border-zinc-200'} ${isPopup ? '' : 'lg:w-[750px] lg:h-[calc(100vh-115px)] lg:rounded-md lg:border lg:shadow-2xl'} overflow-hidden`}>

                {/* HEADER */}
                <div className={`h-[68px] ${isDarkMode ? 'bg-[#18181b] border-zinc-800' : 'bg-white border-zinc-200'} flex items-center justify-between px-5 border-b shrink-0 shadow-sm z-10`}>
                    <div className="flex items-center gap-4">
                        {/* Visa bara den orangea bakåt-knappen om det INTE är en popup. ANVÄND window.Icon */}
                        {!isPopup && (
                            <button onClick={handleBack} className="w-10 h-10 theme-bg flex items-center justify-center rounded-md shadow-sm active:scale-95 transition-transform">
                                <window.Icon name={filter === 'image' ? "list" : "arrow-left"} size={20} className="text-black pointer-events-none" />
                            </button>
                        )}
                        <div>
                            <span className={`text-[9px] font-black ${isDarkMode ? 'theme-text' : 'text-orange-500'} uppercase tracking-[0.3em] block leading-none mb-1.5`}>System_Chat // OS</span>
                            <h2 className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white' : 'text-zinc-900'}`}>Mission_Log</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle. ANVÄND window.Icon */}
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-9 h-9 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'} transition-colors`}>
                            <window.Icon name={isDarkMode ? "sun" : "moon"} size={16} className="pointer-events-none" />
                        </button>
                        
                        {/* Filter (All/Image). ANVÄND window.Icon */}
                        <div className={`flex ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} p-1 rounded-full border`}>
                            {['all', 'image'].map(f => (
                                <button key={f} onClick={() => handleFilterChange(f)} className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${filter === f ? (isDarkMode ? 'bg-zinc-700 text-white' : 'bg-white text-black shadow-sm') : (isDarkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-500 hover:text-zinc-700')}`}>
                                    <window.Icon name={f === 'all' ? 'list' : 'image'} size={14} className="pointer-events-none" />
                                </button>
                            ))}
                        </div>

                        {/* Stäng-knapp (Bara för popup). ANVÄND window.Icon */}
                        {isPopup && (
                            <div className={`pl-2 border-l ml-1 ${isDarkMode ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                <button onClick={onClose} className={`w-9 h-9 flex items-center justify-center rounded-full ${isDarkMode ? 'hover:bg-red-500/20 text-zinc-400 hover:text-red-500' : 'hover:bg-red-50 text-zinc-500 hover:text-red-600'} transition-colors`}>
                                    <window.Icon name="x" size={20} className="pointer-events-none" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* FLOW */}
                <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    {filter === 'image' ? (
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-1 animate-in zoom-in duration-300">
                            {messages.filter(m => m.type === 'image' || m.image).map(msg => (
                                <img key={msg.id} src={msg.fileUrl || msg.image} className="w-full aspect-square object-cover rounded-sm border border-zinc-800 cursor-pointer" alt="Gallery" onClick={(e) => handleOpenImage(e, msg)} />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 pb-1">
                            {messages.map((msg) => {
                                const isMe = msg.sender === user.email;
                                const isImage = msg.type === 'image' || msg.image;
                                const currentLabel = getDateLabel(msg.timestamp);
                                const showSeparator = currentLabel !== lastDateLabel;
                                lastDateLabel = currentLabel;
                                return (
                                    <React.Fragment key={msg.id}>
                                        {showSeparator && (
                                            <div className="flex items-center justify-center my-6">
                                                <span className={`px-4 text-[10px] font-bold tracking-widest ${isDarkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>{currentLabel}</span>
                                            </div>
                                        )}
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] group relative`}
                                                 onMouseEnter={() => !isMobile && setActiveMenu(msg.id)}
                                                 onMouseLeave={() => !isMobile && setActiveMenu(null)}
                                                 onClick={() => isMobile && setActiveMenu(activeMenu === msg.id ? null : msg.id)}>
                                                <div className="relative max-w-max">
                                                    {isImage ? (
                                                        <img src={msg.fileUrl || msg.image} className="max-w-[250px] rounded-lg block shadow-md cursor-pointer" alt="Attachment" onClick={(e) => handleOpenImage(e, msg)} />
                                                    ) : (
                                                        <div className={`px-3 py-1.5 rounded-[18px] shadow-sm text-[14px] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : (isDarkMode ? 'bg-zinc-800 text-zinc-100 rounded-bl-none' : 'bg-zinc-100 text-zinc-800 rounded-bl-none')}`}>
                                                            <p className="leading-snug">{renderMessageText(msg.text)}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* REAKTIONER/MENY */}
                                                    {activeMenu === msg.id && (
                                                        <div ref={menuRef} className={`absolute -top-12 ${isMe ? 'right-0' : 'left-0'} pb-2 z-[9999] animate-in zoom-in duration-150`}>
                                                            <div className={`${isDarkMode ? 'bg-zinc-900 border-zinc-700 shadow-black' : 'bg-white border-zinc-200 shadow-lg'} border p-1 rounded-2xl flex items-center gap-1 shadow-2xl`}>
                                                                {['🕒', '✅', '❌', '⚠️'].map(emoji => (
                                                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className={`w-8 h-8 flex items-center justify-center rounded-full text-lg hover:scale-110 transition-transform ${isDarkMode ? 'hover:bg-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200'}`}>{emoji}</button>
                                                                ))}
                                                                <div className={`w-[1px] h-4 ${isDarkMode ? 'bg-zinc-700' : 'bg-zinc-200'} mx-1`}></div>
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setInputText(msg.text); setActiveMenu(null); }} className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-zinc-800 text-white hover:bg-blue-600' : 'bg-zinc-100 text-zinc-600 hover:bg-blue-500 hover:text-white'}`}><EditIcon /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); window.db.collection("notes").doc(msg.id).delete(); }} className={`w-8 h-8 flex items-center justify-center rounded-full ${isDarkMode ? 'bg-zinc-800 text-red-500 hover:bg-red-600' : 'bg-zinc-100 text-red-500 hover:bg-red-600'} hover:text-white`}><TrashIcon /></button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* VISNING AV REAKTIONER */}
                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                            <div key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 border cursor-pointer ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-200 text-zinc-700 shadow-sm'}`}>
                                                                <span>{emoji}</span><span className="font-bold text-xs">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                <span className={`text-[11px] font-bold mt-1 px-1 uppercase tracking-tighter ${isDarkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {!isMe && `${getSenderName(msg)} • `}{formatTime(msg.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className={`p-2 border-t shrink-0 ${isDarkMode ? 'bg-zinc-950 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                    {editingId && (
                        <div className="flex items-center justify-between mb-1.5 px-2 animate-in slide-in-from-bottom-1">
                            <span className="text-[9px] font-black theme-text tracking-widest uppercase">Redigerar meddelande</span>
                            <button onClick={() => { setEditingId(null); setInputText(""); }} className="text-zinc-500 hover:text-red-500"><CloseIcon /></button>
                        </div>
                    )}
                    <form onSubmit={handleAction} className="flex items-center gap-2 max-w-4xl mx-auto">
                        <div className="flex items-center shrink-0 gap-1">
                            {!editingId && (
                                <>
                                    <label className="p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all text-blue-500 hover:bg-zinc-900">
                                        <PlusIcon />
                                        <input type="file" className="hidden" onChange={handleFile} />
                                    </label>
                                    <label className="p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all text-blue-500 hover:bg-zinc-900">
                                        <CameraIcon />
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
                                    </label>
                                </>
                            )}
                        </div>
                        <div className={`flex-1 px-3 py-1 rounded-full border transition-all ${editingId ? 'border-blue-500 bg-blue-500/5' : (isDarkMode ? 'bg-zinc-900 border-transparent focus-within:border-zinc-700' : 'bg-white border-zinc-300')}`}>
                            <input
                                autoFocus={!!editingId}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={editingId ? "Redigera..." : "Meddelande"}
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`w-full bg-transparent border-none outline-none text-[14px] h-7 ${isDarkMode ? 'text-zinc-100 placeholder:text-zinc-700' : 'text-zinc-900 placeholder:text-zinc-400'}`}
                            />
                        </div>
                        <button type="submit" disabled={!inputText.trim()} className="flex items-center justify-center min-w-[36px] min-h-[36px] shrink-0">
                            {editingId ? (
                                <div className="bg-blue-600 p-1.5 rounded-full shadow-lg"><CheckIcon /></div>
                            ) : (
                                <SendIcon active={inputText.trim().length > 0} />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* LIGHTBOX / BILDMODAL */}
            {activeImage && activeImage.fileUrl && (
                <div className="fixed inset-0 z-[1100] bg-black animate-in fade-in duration-300 font-sans" onClick={() => {
                    if (isPopup) {
                        setActiveImage(null);
                    } else {
                        window.history.back();
                    }
                }}>
                    
                    {/* NY KNAPPPLATTA (Sticky uppe till höger på datorn, mobil ser ut som förut) */}
                    <div className={`fixed top-0 right-0 left-0 h-16 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between px-4 z-50 lg:bg-transparent lg:top-4 lg:right-4 lg:left-auto lg:h-auto lg:p-1.5 lg:bg-black/60 lg:backdrop-blur-sm lg:rounded-md lg:border lg:border-white/10 ${activeImage.sender === user.email ? 'w-auto' : 'w-auto'}`} onClick={e => e.stopPropagation()}>
                        
                        {/* Back-knapp (Bara mobil) */}
                        <button onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }} className="w-10 h-10 lg:hidden flex items-center justify-center rounded-md active:scale-95 transition-transform text-white">
                            <window.Icon name="arrow-left" size={24} />
                        </button>

                        {/* Knappar till höger */}
                        <div className="flex items-center gap-1.5 ml-auto">
                            
                            {/* NY KNAPP: Öppna i ny flik (Bara dator) */}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                // Om det är en lokal fil (base64), gör om den till en säker Blob-URL först
                                if (activeImage.fileUrl.startsWith('data:')) {
                                    fetch(activeImage.fileUrl)
                                        .then(res => res.blob())
                                        .then(blob => {
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                        }).catch(err => console.error("Kunde inte öppna bild", err));
                                } else {
                                    // Annars (vanlig länk), öppna direkt
                                    window.open(activeImage.fileUrl, '_blank');
                                }
                            }} title="Öppna i ny flik" className="hidden lg:flex w-9 h-9 items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="external-link" size={16} />
                            </button>

                            {/* Ladda ner (Används på alla enheter) */}
                            {activeImage.fileUrl.startsWith('data:') ? (
                                 <a href={activeImage.fileUrl} download={activeImage.text || 'bifogad_fil'} title="Ladda ner fil" className="flex w-9 h-9 items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={16} />
                                </a>
                            ) : (
                                <button onClick={async () => {
                                    try {
                                        const response = await fetch(activeImage.fileUrl);
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = activeImage.text || 'bifogad_fil';
                                        document.body.appendChild(a);
                                        a.click();
                                        window.URL.revokeObjectURL(url);
                                    } catch (e) { alert("Kunde inte ladda ner fil."); }
                                }} title="Ladda ner fil" className="flex w-9 h-9 items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={16} />
                                </button>
                            )}

                            {/* Papperskorg (Bara ägare) */}
                            {activeImage.sender === user.email && (
                                <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(confirm("Ta bort?")) { 
                                        window.db.collection("notes").doc(activeImage.id).delete(); 
                                        isPopup ? setActiveImage(null) : window.history.back(); 
                                    } 
                                }} title="Ta bort fil" className="flex w-9 h-9 items-center justify-center rounded text-red-400 hover:text-red-300 hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="trash" size={16} />
                                </button>
                            )}

                            {/* Stäng-knapp (Bara dator) */}
                            <button onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }} title="Stäng bild" className="hidden lg:flex w-9 h-9 items-center justify-center rounded text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="x" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* BILDINNEHÅLL */}
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-12 z-10" onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }}>
                        {activeImage.type !== 'file' ? (
                            <img src={activeImage.fileUrl} alt={activeImage.text} className="max-w-full max-h-full object-contain shadow-[0_30px_90px_rgba(0,0,0,0.7)] animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}/>
                        ) : (
                            <div className="flex flex-col items-center gap-6 p-12 bg-white/5 rounded-2xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                                <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-black border border-white/10 shadow-inner">
                                    <window.Icon name="file-text" size={48} className="text-white/40" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">{activeImage.text}</h3>
                                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">{activeImage.fileUrl.startsWith('data:') ? 'LOKAL FIL // BASE64' : 'LÄNKAD FIL // URL'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

window.ChatView = ChatView;
