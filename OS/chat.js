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

// --- 2. HUVUDKOMPONENT ---

const ChatView = ({ user, setView, viewParams, isPopup, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [activeImage, setActiveImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    
    // Filter styrs lokalt
    const [filter, setFilter] = useState(viewParams?.filter || 'all');
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const scrollRef = useRef(null);
    const menuRef = useRef(null);
    
    const stateRef = useRef({ activeImage, filter, viewParams });
    useEffect(() => { stateRef.current = { activeImage, filter, viewParams }; }, [activeImage, filter, viewParams]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [filter, isPopup, activeImage, messages, activeMenu]); // Lade till activeMenu här

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

    // --- HANTERA BAKÅT (Historik) ---
    useEffect(() => {
        const handlePopState = () => {
            if (isPopup) return; 
            
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
    }, [isPopup, setView]);

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

    // --- FILTER & NAVIGATION ---
    const handleFilterChange = (newFilter) => {
        if (newFilter === filter) return;
        
        setFilter(newFilter);

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
        setActiveImage(msg); 
        
        if (!isPopup) {
            // Vi pushar bara ett tomt state så hårdvaruknappen fungerar, 
            // men vi ropar inte på setView() längre för då kraschar navigationen.
            window.history.pushState({ imageOpen: true }, "", window.location.href);
        }
    };

    // Lägg till denna nya funktion direkt under:
    const closeImageViewer = (e) => {
        if (e) e.stopPropagation();
        setActiveImage(null);
        if (!isPopup) {
            window.history.back(); // Tar bort det tillfälliga statet vi lade till ovan
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
                        className="underline decoration-1 hover:opacity-70 break-all transition-opacity font-medium">
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // --- RENDERING ---
    return (
        <div className={isPopup ? "w-full h-full flex flex-col bg-transparent" : "fixed inset-0 z-[1000] lg:relative lg:inset-auto lg:flex lg:items-start lg:justify-start lg:-mt-4 max-lg:bg-zinc-50 max-lg:dark:bg-[#0f1522] animate-in fade-in duration-300 font-sans"}>
            <div className={`w-full h-full flex flex-col bg-zinc-50 dark:bg-[#0f1522] ${isPopup ? 'border-none' : 'lg:w-[750px] lg:h-[calc(100vh-115px)] lg:rounded-2xl lg:border border-zinc-200 dark:border-white/5 lg:shadow-2xl'} overflow-hidden`}>

                {/* HEADER - Premium Dashboard Style */}
                <div className="h-[72px] bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5 flex items-center justify-between px-5 shrink-0 z-10 shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4">
                        {!isPopup && (
                            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-[#1a2235] border border-transparent dark:border-white/5 text-zinc-500 hover:text-orange-500 dark:hover:text-white shadow-sm transition-all active:scale-95">
                                <window.Icon name={filter === 'image' ? "grid" : "arrow-left"} size={20} className="pointer-events-none" />
                            </button>
                        )}
                        <div className="flex items-center gap-3">
                            {/* Premium Logo (Hidden on mobile to save space if needed, visible here) */}
                            <div className="relative group cursor-default shrink-0 hidden md:block">
                                <div className="absolute inset-0 bg-orange-500/40 blur-md rounded-full transition-all group-hover:bg-orange-500/60" />
                                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="message-square" size={18} />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-[16px] font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none">
                                    System_<span className="text-zinc-400 dark:text-zinc-500 font-light">Chat</span>
                                </h2>
                                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    Mission_Log
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Filter Tabs */}
                        <div className="flex bg-zinc-100 dark:bg-[#0f1522] p-1 rounded-xl border border-zinc-200 dark:border-white/5">
                            {['all', 'image'].map(f => (
                                <button key={f} onClick={() => handleFilterChange(f)} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${filter === f ? 'bg-white dark:bg-[#1a2235] text-orange-500 shadow-sm border border-zinc-200/50 dark:border-white/10' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                    <window.Icon name={f === 'all' ? 'list' : 'image'} size={14} className="pointer-events-none" />
                                </button>
                            ))}
                        </div>

                        {/* Stäng-knapp för popup */}
                        {isPopup && (
                            <div className="pl-2 border-l border-zinc-200 dark:border-white/5 ml-1">
                                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 hover:text-red-500 transition-colors">
                                    <window.Icon name="x" size={20} className="pointer-events-none" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* FLOW (Meddelandelista) */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar bg-transparent">
                    {filter === 'image' ? (
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 animate-in zoom-in duration-300">
                            {messages.filter(m => m.type === 'image' || m.image).map(msg => (
                                <div key={msg.id} className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 aspect-square shadow-sm">
                                    <img src={msg.fileUrl || msg.image} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" alt="Gallery" onClick={(e) => handleOpenImage(e, msg)} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-5 pb-2">
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
                                                <span className="px-3 py-1.5 rounded-full text-[9px] font-bold tracking-widest uppercase bg-zinc-100 dark:bg-white/5 text-zinc-500 border border-zinc-200 dark:border-white/5 shadow-sm">
                                                    {currentLabel}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full`}>
                                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] lg:max-w-[70%] group relative`}
                                                 onMouseEnter={() => !isMobile && setActiveMenu(msg.id)}
                                                 onMouseLeave={() => !isMobile && setActiveMenu(null)}
                                                 onClick={() => isMobile && setActiveMenu(activeMenu === msg.id ? null : msg.id)}>
                                                
                                                {!isMe && (
                                                    <span className="text-[10px] font-bold px-1 mb-1 uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                                        {getSenderName(msg)}
                                                    </span>
                                                )}

                                                <div className="relative max-w-max">
                                                    {isImage ? (
                                                        <img src={msg.fileUrl || msg.image} className={`max-w-[250px] lg:max-w-[300px] block shadow-md cursor-pointer border border-zinc-200 dark:border-white/10 ${isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`} alt="Attachment" onClick={(e) => handleOpenImage(e, msg)} />
                                                    ) : (
                                                        <div className={`px-4 py-2.5 text-[14px] shadow-sm font-medium ${isMe ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl rounded-tr-[4px] border border-orange-400/50 shadow-[0_4px_14px_rgba(249,115,22,0.3)]' : 'bg-white dark:bg-[#1a2235] text-zinc-800 dark:text-zinc-200 rounded-2xl rounded-tl-[4px] border border-zinc-200 dark:border-white/5'}`}>
                                                            <p className="leading-snug break-words whitespace-pre-wrap">{renderMessageText(msg.text)}</p>
                                                        </div>
                                                    )}
                                                    
                                                    {/* REAKTIONER/MENY (Glassy Dashboard Look) */}
                                                    {activeMenu === msg.id && (
                                                        <div ref={menuRef} className={`absolute -top-14 ${isMe ? 'right-0' : 'left-0'} pb-2 z-[100] animate-in zoom-in duration-150`}>
                                                            <div className="bg-white/95 dark:bg-[#182032]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-1.5 rounded-2xl flex items-center gap-1 shadow-2xl">
                                                                {['🕒', '✅', '❌', '⚠️'].map(emoji => (
                                                                    <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-lg hover:scale-110 transition-transform hover:bg-zinc-100 dark:hover:bg-white/5">{emoji}</button>
                                                                ))}
                                                                <div className="w-[1px] h-5 bg-zinc-200 dark:bg-white/10 mx-1"></div>
                                                                <button onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setInputText(msg.text); setActiveMenu(null); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                                                                    <window.Icon name="edit-2" size={14} />
                                                                </button>
                                                                <button onClick={(e) => { e.stopPropagation(); window.db.collection("notes").doc(msg.id).delete(); }} className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors">
                                                                    <window.Icon name="trash-2" size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* VISNING AV REAKTIONER */}
                                                {(msg.reactions && Object.keys(msg.reactions).length > 0) ? (
                                                    <div className={`flex gap-1.5 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                            <div key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="px-2 py-1 rounded-lg text-sm flex items-center gap-1.5 border border-zinc-200 dark:border-white/5 bg-white dark:bg-[#1a2235] text-zinc-700 dark:text-zinc-300 shadow-sm cursor-pointer active:scale-95 transition-transform">
                                                                <span>{emoji}</span><span className="font-bold text-[10px]">{count}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] font-bold mt-1 px-1 uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                )}
                                                
                                                {/* Tidstämpel om reaktioner finns (för att hålla layouten snygg) */}
                                                {(msg.reactions && Object.keys(msg.reactions).length > 0) && (
                                                    <span className={`text-[9px] font-bold mt-1 px-1 uppercase tracking-widest text-zinc-400 dark:text-zinc-600`}>
                                                        {formatTime(msg.timestamp)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* FOOTER / INPUT */}
                <div className="p-3 border-t border-zinc-200 dark:border-white/5 bg-white/90 dark:bg-[#182032]/90 backdrop-blur-xl shrink-0 z-10 transition-colors duration-300">
                    {editingId && (
                        <div className="flex items-center justify-between mb-2 px-3 animate-in slide-in-from-bottom-2">
                            <span className="text-[10px] font-black text-orange-500 tracking-widest uppercase flex items-center gap-2">
                                <window.Icon name="edit-2" size={12} /> Redigerar meddelande
                            </span>
                            <button onClick={() => { setEditingId(null); setInputText(""); }} className="text-zinc-400 hover:text-red-500 transition-colors">
                                <window.Icon name="x" size={16} />
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleAction} className="flex items-center gap-2 max-w-4xl mx-auto">
                        <div className="flex items-center shrink-0 gap-1">
                            {!editingId && (
                                <>
                                    <label className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all text-zinc-500 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-[#1a2235]">
                                        <window.Icon name="paperclip" size={20} />
                                        <input type="file" className="hidden" onChange={handleFile} />
                                    </label>
                                    <label className="w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all text-zinc-500 hover:text-orange-500 hover:bg-zinc-100 dark:hover:bg-[#1a2235]">
                                        <window.Icon name="camera" size={20} />
                                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
                                    </label>
                                </>
                            )}
                        </div>
                        <div className="flex-1 px-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-white/10 transition-all bg-zinc-50 dark:bg-[#0f1522] focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 shadow-inner">
                            <input
                                autoFocus={!!editingId}
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={editingId ? "Redigera..." : "Skriv ett meddelande..."}
                                className="w-full bg-transparent border-none outline-none text-[14px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                            />
                        </div>
                        <button type="submit" disabled={!inputText.trim()} className="flex items-center justify-center w-11 h-11 shrink-0 rounded-2xl bg-orange-500 hover:bg-orange-400 disabled:bg-zinc-200 disabled:dark:bg-white/5 disabled:text-zinc-400 dark:disabled:text-zinc-600 text-white shadow-md transition-all active:scale-95 disabled:active:scale-100 disabled:cursor-not-allowed">
                            {editingId ? (
                                <window.Icon name="check" size={20} />
                            ) : (
                                <window.Icon name="send" size={20} className="rotate-45 -ml-0.5 mt-0.5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* LIGHTBOX / BILDMODAL */}
            {activeImage && activeImage.fileUrl && (
                <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 font-sans" onClick={() => {
                    if (isPopup) {
                        setActiveImage(null);
                    } else {
                        window.history.back();
                    }
                }}>
                    
                    {/* KNAPPPLATTA (Sticky uppe) */}
                    <div className={`absolute top-0 right-0 left-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 z-50 lg:bg-transparent lg:top-4 lg:right-4 lg:left-auto lg:h-auto lg:p-2 lg:bg-black/60 lg:backdrop-blur-md lg:rounded-2xl lg:border lg:border-white/10`} onClick={e => e.stopPropagation()}>
                        
                        {/* Back-knapp (Bara mobil) */}
                        <button onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }} className="w-12 h-12 lg:hidden flex items-center justify-center rounded-xl active:scale-95 transition-transform text-white">
                            <window.Icon name="arrow-left" size={24} />
                        </button>

                        {/* Knappar till höger */}
                        <div className="flex items-center gap-2 ml-auto">
                            
                            <button onClick={(e) => {
                                e.stopPropagation();
                                if (activeImage.fileUrl.startsWith('data:')) {
                                    fetch(activeImage.fileUrl)
                                        .then(res => res.blob())
                                        .then(blob => {
                                            const url = URL.createObjectURL(blob);
                                            window.open(url, '_blank');
                                        }).catch(err => console.error("Kunde inte öppna bild", err));
                                } else {
                                    window.open(activeImage.fileUrl, '_blank');
                                }
                            }} title="Öppna i ny flik" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="external-link" size={20} />
                            </button>

                            {/* Ladda ner */}
                            {activeImage.fileUrl.startsWith('data:') ? (
                                 <a href={activeImage.fileUrl} download={activeImage.text || 'bifogad_fil'} title="Ladda ner fil" className="flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={20} />
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
                                }} title="Ladda ner fil" className="flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={20} />
                                </button>
                            )}

                            {/* Papperskorg (Bara ägare) */}
                            {activeImage.sender === user.email && (
                                <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(confirm("Ta bort filen?")) { 
                                        window.db.collection("notes").doc(activeImage.id).delete(); 
                                        isPopup ? setActiveImage(null) : window.history.back(); 
                                    } 
                                }} title="Ta bort fil" className="flex w-10 h-10 items-center justify-center rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="trash-2" size={20} />
                                </button>
                            )}

                            {/* Stäng-knapp (Bara dator) */}
                            <button onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }} title="Stäng bild" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="x" size={24} />
                            </button>
                        </div>
                    </div>

                    {/* BILDINNEHÅLL */}
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-12 z-10" onClick={() => { isPopup ? setActiveImage(null) : window.history.back(); }}>
                        {activeImage.type !== 'file' ? (
                            <img src={activeImage.fileUrl} alt={activeImage.text} className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-300 rounded-lg" onClick={e => e.stopPropagation()}/>
                        ) : (
                            <div className="flex flex-col items-center gap-6 p-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                                <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-black/50 border border-white/10 shadow-inner">
                                    <window.Icon name="file-text" size={48} className="text-white/40" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">{activeImage.text}</h3>
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
