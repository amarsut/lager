const { useState, useEffect, useRef } = React;

const ChatView = ({ user, setView, viewParams }) => {
    // --- NY HJÄLPFUNKTION FÖR KOMPRIMERING ---
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

                    // Skapar en optimerad WebP Base64-sträng
                    const dataUrl = canvas.toDataURL('image/webp', quality);
                    resolve(dataUrl);
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    const Icon = window.Icon;
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    //const [filter, setFilter] = useState('all');
    const filter = viewParams?.filter || 'all'; // 3. Filtret styrs nu av URL/Historik
    const [activeImage, setActiveImage] = useState(null); // 4. NYTT state för Lightbox
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('chat_theme_dark') !== 'false');
    const scrollRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const openImageId = viewParams?.openImage;
        
        if (openImageId) {
            // Hitta meddelandet som matchar ID:t i historiken
            const msg = messages.find(m => m.id === openImageId);
            if (msg) {
                setActiveImage(msg);
            }
        } else {
            // Om parametern försvinner (t.ex. vid backåt-swajp), stäng bilden
            setActiveImage(null);
        }
    }, [viewParams, messages]);

    // Sparar valet i localStorage varje gång isDarkMode ändras
    useEffect(() => {
        localStorage.setItem('chat_theme_dark', isDarkMode);
    }, [isDarkMode]);

    // --- NYA NAVIGERINGSFUNKTIONER ---
    const handleFilterChange = (newFilter) => {
        if (newFilter === filter) return; // Gör inget om vi redan är i den vyn

        if (newFilter === 'all' && filter === 'image') {
            // Om vi står i galleriet och trycker på "lista", backar vi bara 
            // i historiken istället för att skapa en ny punkt.
            window.history.back();
        } else {
            // Om vi går från loggen till galleriet, skapar vi en historikpunkt
            setView('CHAT', { filter: newFilter });
        }
    };

    const handleBack = () => {
        if (filter === 'image') {
            handleFilterChange('all'); // Om i galleri, gå till loggen
        } else {
            window.history.back(); // Annars gå ur chatten helt
        }
    };

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    let lastDateLabel = null;

    // --- 1. HJÄLPFUNKTIONER ---
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (activeMenu && menuRef.current && !menuRef.current.contains(event.target)) {
                setActiveMenu(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [activeMenu]);

    // --- 2. FIREBASE & REAKTIONER ---
    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            let fileData;
            let type = 'file';

            if (file.type.startsWith('image/')) {
                // Använd vår nya komprimeringsmetod för bilder
                fileData = await compressImage(file);
                type = 'image';
            } else {
                // För vanliga filer, läs in som standard Base64 (om de är små nog)
                fileData = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                });
            }

            // Kontrollera att filen inte överskrider Firestores gräns (ca 1MB)
            if (fileData.length > 1048487) {
                alert("Filen är för stor även efter komprimering. Försök med en mindre bild.");
                setIsUploading(false);
                return;
            }

            await window.db.collection("notes").add({
                text: file.name,
                fileUrl: fileData, // Här sparar vi nu Base64-strängen direkt istället för Storage-URL
                type: type,
                timestamp: new Date().toISOString(),
                sender: user.email
            });

        } catch (err) {
            console.error("Upload Error:", err);
            alert("Kunde inte ladda upp bilden.");
        }
        setIsUploading(false);
        e.target.value = null;
    };

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
        } catch (error) { console.error("Action Error:", error); }
    };

    const toggleReaction = async (id, emoji) => {
        try {
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
        } catch (err) { console.error("Reaction error:", err); }
    };

    useEffect(() => {
        const unsubscribe = window.db.collection("notes").orderBy("timestamp", "asc").onSnapshot(snap => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(docs);
            setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (filter === 'all' && scrollRef.current) {
            setTimeout(() => { scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
        }
    }, [filter]);

    // --- 3. SVG-IKONER ---
    const PlusIcon = () => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    );

    const CameraIcon = () => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
        </svg>
    );

    const SendIcon = ({ active }) => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-blue-500" : "text-zinc-600"}>
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
    );

    const ModalCloseIcon = () => (
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    );

    const DownloadIcon = () => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
    );

    const TrashLargeIcon = () => (
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    );

    const EditIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
    const TrashIcon = () => <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
    const CheckIcon = () => <svg viewBox="0 0 24 24" width="20" height="20" stroke="white" strokeWidth="3" fill="none"><polyline points="20 6 9 17 4 12"></polyline></svg>;
    const CloseIcon = () => <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;

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

    return (
        <div className={`fixed inset-0 z-[1000] lg:relative lg:inset-auto lg:flex lg:items-start lg:justify-start lg:-mt-4 max-lg:bg-black animate-in fade-in duration-300 font-sans`}>
            <div className={`w-full h-full flex flex-col ${isDarkMode ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'} lg:w-[750px] lg:h-[calc(100vh-115px)] lg:rounded-md lg:border lg:shadow-2xl overflow-hidden`}>

                {/* HEADER */}
                <div className="h-16 bg-zinc-950 flex items-center justify-between px-4 border-b border-zinc-900 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="w-11 h-11 theme-bg flex items-center justify-center rounded-md shadow-lg active:scale-95 transition-transform">
                            <Icon name={filter === 'image' ? "list" : "arrow-left"} size={24} className="text-black pointer-events-none" />
                        </button>
                        <div>
                            <span className="text-[8px] font-black theme-text uppercase tracking-[0.3em] block leading-none mb-1">System_Log // OS</span>
                            <h2 className="text-xs font-black uppercase tracking-widest text-white">Mission_Log</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                            <Icon name={isDarkMode ? "sun" : "moon"} size={22} className="pointer-events-none" />
                        </button>
                        <div className="flex bg-zinc-900/50 border-zinc-800 p-1 rounded-full border ml-1">
                            {['all', 'image'].map(f => (
                                <button key={f} onClick={() => handleFilterChange(f)} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${filter === f ? 'bg-zinc-700 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}>
                                    <Icon name={f === 'all' ? 'list' : 'image'} size={20} className="pointer-events-none" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FLOW */}
                <div ref={scrollRef} className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
                    {filter === 'image' ? (
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-1 animate-in zoom-in duration-300">
                            {messages.filter(m => m.type === 'image' || m.image).map(msg => (
                                <img
                                    key={msg.id}
                                    src={msg.fileUrl || msg.image}
                                    className="w-full aspect-square object-cover rounded-sm border border-zinc-800 cursor-pointer"
                                    alt="Gallery"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenu(null);
                                        setActiveImage(msg);
                                        setView('CHAT', { ...viewParams, openImage: msg.id });
                                    }}
                                />
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
                                                        <img src={msg.fileUrl || msg.image} className="max-w-[250px] rounded-lg block shadow-md cursor-pointer" alt="Attachment" onClick={(e) => { e.stopPropagation(); setActiveMenu(null); setActiveImage(msg); setView('CHAT', { ...viewParams, openImage: msg.id }); }} />
                                                    ) : (
                                                        <div className={`px-3 py-1.5 rounded-[18px] shadow-sm text-[14px] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : (isDarkMode ? 'bg-zinc-800 text-zinc-100 rounded-bl-none' : 'bg-zinc-100 text-zinc-800 rounded-bl-none')}`}>
                                                            <p className="leading-snug">{renderMessageText(msg.text)}</p>
                                                        </div>
                                                    )}
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
                                    <label className={`p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all ${isDarkMode ? 'text-blue-500 hover:bg-zinc-900' : 'text-blue-600 hover:bg-zinc-200'}`}>
                                        <PlusIcon />
                                        <input type="file" className="hidden" onChange={handleFile} />
                                    </label>
                                    <label className={`p-1.5 rounded-full cursor-pointer flex items-center justify-center transition-all ${isDarkMode ? 'text-blue-500 hover:bg-zinc-900' : 'text-blue-600 hover:bg-zinc-200'}`}>
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
                                // INLINE STIL HÄR FÖR ATT TRUMFA WEBBLÄSAREN
                                style={{ outline: 'none', boxShadow: 'none' }}
                                className={`w-full bg-transparent border-none appearance-none outline-none focus:outline-none text-[14px] focus:ring-0 shadow-none h-7 ${isDarkMode ? 'text-zinc-100 placeholder:text-zinc-700' : 'text-zinc-900 placeholder:text-zinc-400'}`}
                            />
                        </div>
                        <button type="submit" disabled={!inputText.trim()} className={`flex items-center justify-center min-w-[36px] min-h-[36px] transition-all shrink-0`}>
                            {editingId ? (
                                <div className="bg-blue-600 p-1.5 rounded-full shadow-lg"><CheckIcon /></div>
                            ) : (
                                <SendIcon active={inputText.trim().length > 0} />
                            )}
                        </button>
                    </form>
                </div>
            </div>
            {/* LIGHTBOX / FULLSCREEN VIEW */}
            {activeImage && (
                <div className="fixed inset-0 z-[10001] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200 overflow-hidden" 
                    onClick={() => setActiveImage(null)}>
                    
                    {/* HEADER BAR: Ligger kvar i toppen */}
                    <div className="h-16 lg:h-20 flex items-center justify-between px-4 lg:px-12 shrink-0 relative z-[10002] bg-zinc-950/80 border-b border-white/5" 
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setActiveImage(null); }} 
                                className="p-2 rounded-full hover:bg-white/10 transition-all active:scale-90 cursor-pointer">
                                <ModalCloseIcon />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-sm lg:text-base tracking-tight">
                                    {getSenderName(activeImage)}
                                </span>
                                <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mt-0.5">
                                    {getDateLabel(activeImage.timestamp)} <span className="mx-1 opacity-30">|</span> {formatTime(activeImage.timestamp)}
                                </span>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 lg:gap-4">
                            <a 
                                href={activeImage.fileUrl || activeImage.image} 
                                download={`IMG_${activeImage.timestamp}.webp`} 
                                className="p-3 rounded-full hover:bg-white/10 transition-all cursor-pointer" 
                                onClick={(e) => e.stopPropagation()}>
                                <DownloadIcon />
                            </a>
                            <button 
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(window.confirm("Radera bild permanent?")) { 
                                        window.db.collection("notes").doc(activeImage.id).delete(); 
                                        setActiveImage(null); 
                                    }
                                }} 
                                className="p-3 rounded-full hover:bg-red-500/20 transition-all group cursor-pointer">
                                <TrashLargeIcon />
                            </button>
                        </div>
                    </div>

                    {/* BILD-CONTAINER: Nu med perfekt centrering utan "push" i botten */}
                    <div className="flex-1 relative flex items-center justify-center p-4 lg:p-8 overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                            <img 
                                src={activeImage.fileUrl || activeImage.image} 
                                // max-h-full ser till att den aldrig blir högre än det tillgängliga utrymmet
                                className="max-w-full max-h-full object-contain rounded-lg lg:rounded-2xl shadow-2xl border border-white/5 animate-in zoom-in duration-300 select-none" 
                                alt="Full size preview"
                                onClick={(e) => e.stopPropagation()} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

window.ChatView = ChatView;
