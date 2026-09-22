const { useState, useEffect, useRef, useCallback } = React;

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

const getMessengerStyleTimestamp = (ts) => {
    if (!ts) return "";
    const date = (typeof ts.toDate === 'function') ? ts.toDate() : new Date(ts);
    // Returnerar endast klockslaget (t.ex. "23:42") eftersom datumet redan finns i pillen.
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getSenderColor = (email) => {
    if (!email) return 'bg-zinc-500';
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-amber-500'];
    let hash = 0;
    for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
};

const hapticFeedback = () => {
    if (navigator.vibrate) navigator.vibrate(50);
};

// --- NYA FELSÖKNINGS-KOMPONENTER ---
const renderMessageText = (text) => {
    if (!text) return "";
    const tokenRegex = /(https?:\/\/[^\s]+|\*\*[^*]+\*\*)/g;
    return text.split(tokenRegex).map((part, i) => {
        if (!part) return null;
        if (part.match(/^https?:\/\//)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                    className="underline decoration-1 hover:opacity-80 break-all transition-opacity font-semibold">
                    {part}
                </a>
            );
        }
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-black tracking-wide text-current">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

const MessageBubble = ({ text }) => {
    const [expanded, setExpanded] = useState(false);
    if (!text) return null;

    const parts = text.split('---MER---');
    const summary = parts[0].trim();
    const details = parts.length > 1 ? parts[1].trim() : null;

    return (
        <div className="flex flex-col w-full">
            <span className="leading-relaxed break-words whitespace-pre-wrap text-[15px]">
                {renderMessageText(summary)}
            </span>
            
            {details && (
                <div className="flex flex-col mt-2">
                    {expanded && (
                        <div className="mt-2 pt-3 border-t border-zinc-200/50 dark:border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                            <span className="leading-relaxed break-words whitespace-pre-wrap text-[14px] text-zinc-700 dark:text-zinc-200">
                                {renderMessageText(details)}
                            </span>
                        </div>
                    )}
                    
                    <button 
                        onClick={(e) => { 
                            e.stopPropagation(); // Detta hindrar klicket från att öppna menyn för bubblan
                            setExpanded(!expanded); 
                        }}
                        className="mt-3 text-[11px] font-bold uppercase tracking-widest text-orange-500 hover:text-orange-600 dark:hover:text-white self-start flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/30 px-3 py-1.5 rounded-lg transition-all active:scale-95"
                    >
                        <window.Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} />
                        {expanded ? 'Dölj felsökningsguide' : 'Visa full diagnos'}
                    </button>
                </div>
            )}
        </div>
    );
};

// --- 2. HUVUDKOMPONENT ---
const ChatView = ({ user, setView, viewParams, isPopup, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [replyTo, setReplyTo] = useState(null); 
    
    const [activeImage, setActiveImage] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [galleryTab, setGalleryTab] = useState('image'); 
    
    const [filter, setFilter] = useState(viewParams?.filter || 'all');
    const [showAi, setShowAi] = useState(false); // NYTT: Döljer AI som standard
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const scrollRef = useRef(null);
    const menuRef = useRef(null);
    const inputRef = useRef(null);
    const mediaRecorder = useRef(null);
    const audioChunks = useRef([]);
    
    const stateRef = useRef({ activeImage, filter, viewParams });
    useEffect(() => { stateRef.current = { activeImage, filter, viewParams }; }, [activeImage, filter, viewParams]);

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            });
            setShowScrollBottom(false);
            setUnreadCount(0);
        }
    }, []);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setShowScrollBottom(!isNearBottom);
        if (isNearBottom) setUnreadCount(0);
    };

    useEffect(() => {
        if (filter === 'all') setTimeout(() => scrollToBottom(false), 100);
    }, [filter, scrollToBottom]);

    const handleInputResize = (e) => {
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAction(e);
        }
    };

    useEffect(() => {
        const handlePopState = () => {
            if (isPopup) return; 
            const { activeImage, filter, viewParams } = stateRef.current;
            if (activeImage) { setActiveImage(null); return; }
            if (filter === 'image') setView('CHAT', { ...viewParams, filter: 'all' });
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isPopup, setView]);

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
        if(msg.type === 'audio') return;
        e.stopPropagation();
        setActiveMenu(null);
        setActiveImage(msg); 
    };

    const closeImageViewer = (e) => {
        if (e) e.stopPropagation();
        setActiveImage(null);
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => setActiveMenu(null));
        hapticFeedback();
    };

    // 1. Referenser för att hålla koll på värden utan att starta om Firebase-lyssnaren
    const prevMsgCount = useRef(0);
    const isScrolledUp = useRef(showScrollBottom);

    // Uppdatera referensen i bakgrunden när man scrollar
    useEffect(() => {
        isScrolledUp.current = showScrollBottom;
    }, [showScrollBottom]);

    // 2. Den optimerade Firebase-anslutningen
    useEffect(() => {
        const unsubscribe = window.db.collection("notes").orderBy("timestamp", "asc").onSnapshot(snap => {
            const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            setMessages(docs);

            // Timeout behövs så att React hinner bygga klart alla meddelanden i vyn innan vi mäter höjden
            setTimeout(() => {
                if (prevMsgCount.current === 0) {
                    // Första gången chatten laddas: Hoppa direkt längst ner (false = ingen animation)
                    scrollToBottom(false);
                } else if (docs.length > prevMsgCount.current) {
                    // Ett nytt meddelande har skickats
                    const lastMsg = docs[docs.length - 1];
                    
                    // Om vi har scrollat upp, och det inte är vi själva som skrev, visa notissiffran
                    if (lastMsg.sender !== user.email && isScrolledUp.current) {
                        setUnreadCount(prev => prev + 1);
                    } else {
                        // Annars scrollar vi ner snyggt och mjukt (true)
                        scrollToBottom(true);
                    }
                }
                // Spara det nya antalet till nästa gång
                prevMsgCount.current = docs.length;
            }, 100); 
        });

        return () => unsubscribe();
    }, [user.email, scrollToBottom]); // VIKTIGT: Vi har tagit bort messages.length och showScrollBottom härifrån!

    const toggleRecording = async () => {
        hapticFeedback();
        if (isRecording) {
            if (mediaRecorder.current) {
                mediaRecorder.current.stop();
                mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
            }
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder.current = new MediaRecorder(stream);
                
                mediaRecorder.current.ondataavailable = e => {
                    if (e.data.size > 0) audioChunks.current.push(e.data);
                };
                
                mediaRecorder.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                    audioChunks.current = [];
                    
                    if (audioBlob.size > 1000000) {
                        alert("Ljudfilen är för stor (Max 1MB).");
                        return;
                    }
                    
                    setIsUploading(true);
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        await window.db.collection("notes").add({
                            fileUrl: reader.result,
                            type: 'audio',
                            sender: user.email,
                            timestamp: new Date().toISOString()
                        });
                        setIsUploading(false);
                    };
                    reader.readAsDataURL(audioBlob);
                };
                
                mediaRecorder.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Microphone access denied:", err);
                alert("Kunde inte starta mikrofonen. Saknar behörighet.");
            }
        }
    };

    const handleAction = async (e) => {
        if (e) e.preventDefault();
        const textToSend = inputText.trim();
        if (!textToSend) {
            if (editingId) { setEditingId(null); setInputText(""); }
            return;
        }
        
        hapticFeedback();
        const currentEditId = editingId;
        const currentReplyTo = replyTo;
        
        setInputText("");
        setEditingId(null);
        setReplyTo(null);
        
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'; 
            if (!isMobile) inputRef.current.focus();
        }

        try {
            if (currentEditId) {
                await window.db.collection("notes").doc(currentEditId).update({ text: textToSend, isEdited: true });
            } else {
                const dtcRegex = /[PBUC]\s*[0-9A-Z]{4,6}|\b(BMW|VW|AUDI|VOLVO|MERCEDES|SKODA|SEAT|VAG|PORSCHE|TIGUAN)\s+[A-Z0-9]{3,8}\b/i;
                const isAiCommand = textToSend.toLowerCase().startsWith('/ai ');
                const isAiTrigger = dtcRegex.test(textToSend) || isAiCommand;

                await window.db.collection("notes").add({
                    text: textToSend, 
                    sender: user.email, 
                    timestamp: new Date().toISOString(), 
                    type: 'text',
                    isAiTrigger: isAiTrigger, // NYTT: Flaggas i databasen
                    replyTo: currentReplyTo ? { id: currentReplyTo.id, text: currentReplyTo.text, sender: currentReplyTo.sender } : null
                });

                if (isAiTrigger) {
                    setIsAiLoading(true);
                    setShowAi(true); // NYTT: Slår på filtret automatiskt när du söker
                    scrollToBottom(true);
                    
                    try {
                        // https://dash.cloudflare.com/ inloggad via Google
                        const response = await fetch("https://autogrid-ai-proxy.asut-ytube.workers.dev/", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                systemInstruction: {
                                    parts: [{ 
                                        text: `Du är "AutoGrid AI", en fordonsteknisk expert-AI för professionella mekaniker. Din huvuduppgift är att diagnostisera felkoder (DTC) med absolut högsta precision för ALLA bilmärken (Volvo, Mercedes, BMW, VAG, Ford, Toyota m.fl.).

KRITISKA REGLER:
1. Absolut Precision: När du får ett bilmärke och en kod (ex. "BMW 34FA00" eller "Volvo ECM-P0420"), agera exakt som tillverkarens egna diagnosverktyg (ISTA, VIDA, ODIS, Xentry). 
2. Inga gissningar (Noll-tolerans): Om koden är en märkesspecifik hex-kod, ge den EXAKTA OEM-definitionen. Om du inte vet med 100% säkerhet vad koden betyder för just det bilmärket, svara: "Okänd tillverkarkod".
3. Specifika komponenter: Använd tillverkarens officiella beteckningar från elscheman (t.ex. G450, N18, B65).
4. Telegrafisk stil: Svara extremt kortfattat och tekniskt. 

Använd EXAKT denna Markdown-mall för dina svar:

**Snabbsvar:** [Kort och exakt OEM-beskrivning av felkoden. Ex: "Kommunikationsfel Telematics (TCB)"]
---MER---
**Diagnos:**
* [Fysisk kontroll / Mätvärde / Pin-out]

**Åtgärd:**
* [Konkret nästa steg / Komponentbyte]

> **Verkstadstips:** [Ange specifika TPI/TSB/PUMA-åtgärder eller kända typfel om det existerar. Annars lämna tomt.]` 
                                    }]
                                },
                                contents: [{ parts: [{ text: textToSend }] }],
                                generationConfig: { temperature: 0.2 }
                            })
                        });

                        const data = await response.json();
                        setIsAiLoading(false);

                        // Skriver ut hela Googles svar i Console-fliken
                        console.log("Riktigt svar från Google:", data);

                        if (data.candidates && data.candidates.length > 0) {
                            const realAnswer = data.candidates[0].content.parts[0].text;
                            await window.db.collection("notes").add({
                                text: realAnswer, sender: "AutoGrid_AI", timestamp: new Date().toISOString(), type: 'text',
                                replyTo: { id: "user", text: textToSend, sender: user.email }
                            });
                        } else if (data.error) {
                            // Om Google skickade ett felmeddelande, kasta den exakta feltexten
                            throw new Error(`Google API Fel: ${data.error.message}`);
                        } else {
                            throw new Error("Inget svar från AI (Saknar candidates och error-objekt).");
                        }
                    } catch (aiError) {
                        console.error("AI Error:", aiError);
                        setIsAiLoading(false);
                        
                        let uiErrorMessage = `**Systemmeddelande: Anslutningsfel**\nEtt tekniskt fel uppstod: ${aiError.message}`;
                        const errText = aiError.message.toLowerCase();
                        
                        if (errText.includes("quota") || errText.includes("429")) {
                            if (errText.includes("1500") || errText.includes("daily") || errText.includes("limit: 1500")) {
                                uiErrorMessage = `**Systemmeddelande: Daglig kvot nådd**\nDen dagliga gränsen för AI-anrop är förbrukad. Systemet återställs kl. 09:00.`;
                            } else {
                                uiErrorMessage = `**Systemmeddelande: Hastighetsbegränsning**\nMax antal anrop per minut är nått. Vänligen vänta en minut.\nKvarstår felet är den dagliga kvoten förbrukad (återställs 09:00).`;
                            }
                        }

                        await window.db.collection("notes").add({
                            text: uiErrorMessage,
                            sender: "AutoGrid_AI", 
                            timestamp: new Date().toISOString(), 
                            type: 'text'
                        });
                    }
                }
            }
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
                alert("Filen är för stor (Max 1MB).");
                setIsUploading(false); return;
            }
            await window.db.collection("notes").add({
                text: file.name, fileUrl: fileData, type: file.type.startsWith('image/') ? 'image' : 'file',
                timestamp: new Date().toISOString(), sender: user.email
            });
        } catch (err) { console.error(err); }
        setIsUploading(false);
        e.target.value = null;
    };

    const toggleReaction = async (id, emoji) => {
        hapticFeedback();
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

    const scrollToMessage = (id) => {
        const el = document.getElementById(`msg-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-orange-500/20');
            setTimeout(() => el.classList.remove('bg-orange-500/20'), 1500);
        }
    };

    // 1. LÄGG TILL DENNA RAD
    let lastDateLabel = "";

    // --- RENDERING ---
    return (
    <div className={isPopup ? "w-full h-full flex flex-col bg-transparent" : "fixed inset-0 z-[1000] lg:relative lg:inset-auto lg:flex lg:items-start lg:justify-start lg:-mt-4 bg-zinc-50 dark:bg-[#090b10] animate-in fade-in duration-300 font-sans"}>

            <div className={`w-full h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0f1522] ${isPopup ? 'border-none' : 'lg:w-[1000px] lg:max-w-full lg:h-[calc(100vh-115px)] lg:rounded-2xl lg:border border-zinc-200 dark:border-white/5 lg:shadow-2xl'} overflow-hidden relative mx-auto`}>

                {/* HEADER */}
                {/* GEMINI-STYLE HEADER (Med mjuk ut-toning / Frosted Glass) */}
                <div className="sticky top-0 z-20 w-full pointer-events-none">

                {/* DEN MAGISKA BLUR-BAKGRUNDEN - Nu dynamisk beroende på vy! */}
                <div 
                    className={`absolute top-0 left-0 right-0 ${filter === 'all' ? 'h-[140px]' : 'h-[64px] border-b border-zinc-200/50 dark:border-white/5'} bg-[#f0f2f5]/80 dark:bg-[#0f1522]/80 backdrop-blur-xl -z-10 transition-all duration-300`}
                    style={filter === 'all' ? { 
                        WebkitMaskImage: 'linear-gradient(to bottom, black 64px, transparent 100%)', 
                        maskImage: 'linear-gradient(to bottom, black 64px, transparent 100%)' 
                    } : {}}
                ></div>
                
                {/* Huvudinnehållet i Headern */}
                {/* Huvudinnehållet i Headern */}
                <div className="h-[64px] flex items-center justify-between px-2 sm:px-4 pointer-events-auto relative">
                    
                    {/* VÄNSTER: Tillbaka-knapp */}
                    <div className="flex items-center justify-start flex-1">
                        {!isPopup && (
                            <button onClick={handleBack} className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95">
                                <window.Icon name="arrow-left" size={20} />
                            </button>
                        )}
                    </div>
                    
                    {/* MITTEN: Centrerad Titel fungerar nu som AI-knapp */}
                    <div className="flex justify-center shrink-0 mt-1">
                        <div 
                            onClick={() => setShowAi(!showAi)}
                            className={`flex items-center gap-1.5 cursor-pointer px-4 py-1.5 rounded-full transition-all active:scale-95 ${showAi ? 'bg-orange-50 dark:bg-orange-500/10' : 'hover:bg-zinc-200/50 dark:hover:bg-white/5'}`}
                        >
                            <h2 className="text-[16px] font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 whitespace-nowrap">
                                AutoGrid <span className="text-orange-500 font-medium">AI</span>
                                <window.Icon name={showAi ? "chevron-up" : "chevron-down"} size={16} className={showAi ? "text-orange-500" : "text-zinc-400"} />
                            </h2>
                        </div>
                    </div>

                    {/* HÖGER: Galleri-piller (Återställd till originalet) & Stäng-knapp */}
                    <div className="flex items-center justify-end gap-2 flex-1">
                        <div className="flex bg-white/50 dark:bg-white/5 p-1.5 rounded-full border border-zinc-300/30 dark:border-white/5 shadow-sm">
                            {['all', 'image'].map(f => (
                                <button key={f} onClick={() => handleFilterChange(f)} className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${filter === f ? 'bg-white dark:bg-[#1e2330] text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                    <window.Icon name={f === 'all' ? 'list' : 'image'} size={18} className="pointer-events-none" />
                                </button>
                            ))}
                        </div>

                        {isPopup && (
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-200 dark:hover:bg-white/10 transition-all active:scale-95 ml-1">
                                <window.Icon name="x" size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

                {/* FLOW (Meddelandelista) */}
                <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-3 sm:p-4 pb-6 sm:pb-8 custom-scrollbar bg-transparent relative scroll-smooth">
                    {filter === 'image' ? (
                        <div className="flex flex-col h-full animate-in zoom-in duration-300">
                            {/* Flikar för Galleri */}
                            <div className="flex gap-4 border-b border-zinc-200 dark:border-white/10 mb-4 pb-2 px-2">
                                {['image', 'file', 'link'].map(tab => (
                                    <button key={tab} onClick={() => setGalleryTab(tab)} className={`text-sm font-bold uppercase tracking-wider pb-2 border-b-2 transition-all ${galleryTab === tab ? 'border-orange-500 text-orange-500' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                                        {tab === 'image' ? 'Bilder' : tab === 'file' ? 'Filer' : 'Länkar'}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {messages.filter(m => {
                                    if (galleryTab === 'image') return m.type === 'image' || m.image;
                                    if (galleryTab === 'file') return m.type === 'file' || m.type === 'audio';
                                    if (galleryTab === 'link') return m.text && m.text.includes('http');
                                    return false;
                                }).map(msg => (
                                    <div key={msg.id} className="relative group rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 aspect-square shadow-sm bg-white dark:bg-[#1a2235] flex items-center justify-center">
                                        {galleryTab === 'image' ? (
                                            <img src={msg.fileUrl || msg.image} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" alt="Gallery" onClick={(e) => handleOpenImage(e, msg)} />
                                        ) : galleryTab === 'file' ? (
                                            <div className="flex flex-col items-center p-2 text-center">
                                                <window.Icon name={msg.type === 'audio' ? 'mic' : 'file-text'} size={24} className="text-orange-500 mb-2" />
                                                <span className="text-[10px] font-bold text-zinc-600 truncate w-full">{msg.text || 'Ljudfil'}</span>
                                            </div>
                                        ) : (
                                            (() => {
                                                const linkMatch = msg.text.match(/(https?:\/\/[^\s]+)/);
                                                if (!linkMatch) return null;
                                                const linkUrl = linkMatch[0];
                                                const domain = linkUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
                                                return (
                                                    <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-2 text-center hover:bg-zinc-50 dark:hover:bg-white/5 w-full h-full justify-center overflow-hidden">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-2 shrink-0">
                                                            <window.Icon name="link" size={18} className="text-blue-500" />
                                                        </div>
                                                        <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 truncate w-full px-1">
                                                            {domain}
                                                        </span>
                                                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate w-full mt-0.5 px-1">
                                                            {linkUrl}
                                                        </span>
                                                    </a>
                                                );
                                            })()
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1 pb-16 relative">
                            {messages.filter(msg => {
                                // Helt separerade vyer: AI för sig, vanliga chatten för sig.
                                const isAiMessage = msg.sender === 'AutoGrid_AI' || msg.isAiTrigger;
                                return showAi ? isAiMessage : !isAiMessage;
                            }).map((msg, index, filteredMessages) => {
                                const isMe = msg.sender === user.email;
                                const isImage = msg.type === 'image' || msg.image;
                                const isAudio = msg.type === 'audio';
                                const isAi = msg.sender === 'AutoGrid_AI';
                                
                                let currentLabel = "";
                                if (msg.timestamp) {
                                    currentLabel = getDateLabel(msg.timestamp);
                                }
                                const showSeparator = currentLabel !== lastDateLabel;
                                lastDateLabel = currentLabel;
                                
                                // Hjälpfunktion för att läsa av millisekunder (stödjer både string och firebase-timestamp)
                                const getTimeMs = (ts) => ts ? (typeof ts.toDate === 'function' ? ts.toDate().getTime() : new Date(ts).getTime()) : 0;
                                const TIME_LIMIT = 60 * 60 * 1000; // 1 timme gräns (ändra 60 till 30 för halvtimme)
                                
                                // Räkna ut tidsskillnaden mellan nuvarande, föregående och nästa meddelande
                                const timeDiffPrev = index > 0 ? (getTimeMs(msg.timestamp) - getTimeMs(filteredMessages[index - 1].timestamp)) : 0;
                                const timeDiffNext = index < filteredMessages.length - 1 ? (getTimeMs(filteredMessages[index + 1].timestamp) - getTimeMs(msg.timestamp)) : 0;
                                
                                // Bryt grupperingen om mer än TIME_LIMIT har passerat
                                const isSameSenderAsPrev = index > 0 && filteredMessages[index - 1].sender === msg.sender && !showSeparator && timeDiffPrev < TIME_LIMIT;
                                const isSameSenderAsNext = index < filteredMessages.length - 1 && filteredMessages[index + 1].sender === msg.sender && timeDiffNext < TIME_LIMIT;
                                
                                return (
                                    <React.Fragment key={msg.id}>
                                        
                                        {/* STICKY DATE HEADER */}
                                        {/* MESSENGER STYLE TIMESTAMP */}
                                        {!isSameSenderAsPrev && (
                                            <div className="flex items-center justify-center mt-4 mb-2 z-10 pointer-events-none">
                                                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                                                    {currentLabel} {getMessengerStyleTimestamp(msg.timestamp)}
                                                </span>
                                            </div>
                                        )}

                                        <div id={`msg-${msg.id}`} className={`flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300 transition-colors ${activeMenu === msg.id ? 'relative z-50' : 'relative z-0'} flex-col ${isSameSenderAsPrev ? 'mt-[2px]' : 'mt-1'}`}>
                                            
                                            <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                
                                                {/* Avatar */}
                                                {!isMe && (
                                                    <div className="w-8 h-8 shrink-0 mr-2 flex flex-col justify-end">
                                                        {!isSameSenderAsNext && (
                                                            isAi ? (
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white dark:bg-[#1a2235] border border-orange-500 shadow-sm relative overflow-hidden group-hover:shadow-md transition-all">
                                                                    <div className="absolute inset-0 bg-orange-500/10"></div>
                                                                    <window.Icon name="cpu" size={16} className="text-orange-500" />
                                                                </div>
                                                            ) : (
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm ${getSenderColor(msg.sender)}`}>
                                                                    {getSenderName(msg).charAt(0)}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}

                                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] group relative`}
                                                    onMouseEnter={() => !isMobile && setActiveMenu(msg.id)}
                                                    onMouseLeave={() => !isMobile && setActiveMenu(null)}
                                                    onClick={() => isMobile && setActiveMenu(activeMenu === msg.id ? null : msg.id)}>
                                                    
                                                    {!isMe && !isSameSenderAsPrev && (
                                                        <span className="text-[11px] font-bold px-1 mb-1 tracking-wide text-zinc-500 dark:text-zinc-400 pl-2">
                                                            {isAi ? "AutoGrid AI" : getSenderName(msg)}
                                                        </span>
                                                    )}

                                                    {/* NYTT CITAT/REPLY OVANFÖR BUBBLAN (Messenger-stil) */}
                                                        {msg.replyTo && (
                                                            <div onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo.id); }} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} w-fit max-w-full mb-1 cursor-pointer group/reply`}>
                                                                {/* Citat-innehållet förblir orört */}
                                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1 px-1">
                                                                    <window.Icon name="reply" size={12} className="stroke-[2.5]" />
                                                                    {isMe ? (msg.replyTo.sender === user.email ? 'Du har svarat dig själv' : `Du svarade ${getSenderName(msg.replyTo)}`) : `${getSenderName(msg)} svarade`}
                                                                </div>
                                                                <div className={`px-4 py-2 text-[14px] rounded-2xl max-w-full shadow-sm transition-opacity group-hover/reply:opacity-100 ${isMe ? 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 opacity-80' : 'bg-zinc-200 dark:bg-white/10 text-zinc-700 dark:text-zinc-300 opacity-80'}`}>
                                                                    <span className="line-clamp-2">{msg.replyTo.text || 'Ljud/Fil'}</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* ÄNDRAD TILL w-fit */}
                                                        <div className="relative w-fit max-w-full flex flex-col">
                                                        {isImage ? (
                                                            <img src={msg.fileUrl || msg.image} className={`max-w-[240px] sm:max-w-[350px] max-h-[300px] object-cover block shadow-sm cursor-pointer border border-zinc-200 dark:border-white/10 ${isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`} alt="Attachment" onClick={(e) => handleOpenImage(e, msg)} />
                                                        ) : isAudio ? (
                                                            <div className={`px-2 py-2 shadow-sm flex flex-col ${isMe ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-white/5'} ${isMe ? (isSameSenderAsPrev ? 'rounded-2xl rounded-tr-[4px]' : 'rounded-2xl rounded-tr-[4px]') : (isSameSenderAsPrev ? 'rounded-2xl rounded-tl-[4px]' : 'rounded-2xl rounded-tl-[4px]')}`}>
                                                                <audio controls src={msg.fileUrl} className="h-10 w-[200px] sm:w-[250px] rounded-lg" />
                                                            </div>
                                                        ) : (
                                                            <div className={`px-4 py-2 shadow-sm flex flex-col ${isMe ? 'bg-orange-500 text-white' : 'bg-white dark:bg-[#1a2235] text-zinc-900 dark:text-zinc-100 border border-zinc-200/50 dark:border-white/5'} ${isMe ? (isSameSenderAsPrev ? 'rounded-2xl rounded-tr-[4px]' : 'rounded-2xl rounded-tr-xl') : (isSameSenderAsPrev ? 'rounded-2xl rounded-tl-[4px]' : 'rounded-2xl rounded-tl-xl')}`}>
                                                                {isAi ? (
                                                                    <MessageBubble text={msg.text} />
                                                                ) : (
                                                                    <span className="leading-relaxed break-words whitespace-pre-wrap text-[15px]">{renderMessageText(msg.text)}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                        
                                                        {/* PILL-SHAPED MENY */}
                                                        {activeMenu === msg.id && (
                                                            <div ref={menuRef} className={`absolute -top-14 ${isMe ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} pb-2.5 z-[100] animate-in zoom-in-95 duration-200 w-max`}>
                                                                <div className="bg-white/95 dark:bg-[#182032]/95 backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-1.5 rounded-full flex items-center shadow-2xl gap-0.5">
                                                                    {['✅', '❌', '👍', '❓'].map(emoji => (
                                                                        <button key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="w-9 h-9 flex items-center justify-center rounded-full text-lg hover:scale-110 transition-transform hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 shrink-0">{emoji}</button>
                                                                    ))}
                                                                    
                                                                    <div className="w-[1px] h-5 bg-zinc-200 dark:bg-white/10 mx-1 shrink-0"></div>
                                                                    
                                                                    <button onClick={(e) => { e.stopPropagation(); setReplyTo(msg); setActiveMenu(null); inputRef.current?.focus(); }} className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-blue-500 transition-colors active:scale-95 shrink-0" title="Svara">
                                                                        <window.Icon name="corner-up-left" size={15} />
                                                                    </button>

                                                                    {!isImage && !isAudio && (
                                                                        <button onClick={(e) => { e.stopPropagation(); handleCopy(msg.text); }} className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-white transition-colors active:scale-95 shrink-0" title="Kopiera text">
                                                                            <window.Icon name="copy" size={15} />
                                                                        </button>
                                                                    )}

                                                                    {isMe && !isAudio && (
                                                                        <button onClick={(e) => { e.stopPropagation(); setEditingId(msg.id); setInputText(msg.text); setActiveMenu(null); }} className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 hover:text-orange-500 transition-colors active:scale-95 shrink-0" title="Redigera">
                                                                            <window.Icon name="edit-2" size={15} />
                                                                        </button>
                                                                    )}
                                                                    
                                                                    <button onClick={(e) => { e.stopPropagation(); window.db.collection("notes").doc(msg.id).delete(); }} className="w-9 h-9 flex items-center justify-center rounded-full text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors active:scale-95 shrink-0" title="Ta bort">
                                                                        <window.Icon name="trash-2" size={15} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Reaktioner */}
                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mt-1`}>
                                                        {(msg.reactions && Object.keys(msg.reactions).length > 0) && (
                                                            <div className={`flex gap-1 mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                                {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                                    <div key={emoji} onClick={(e) => { e.stopPropagation(); toggleReaction(msg.id, emoji); }} className="px-1.5 py-0.5 rounded-full text-[12px] flex items-center gap-1 border border-zinc-200 dark:border-white/5 bg-white/80 dark:bg-[#1a2235]/80 backdrop-blur-md text-zinc-700 dark:text-zinc-300 shadow-sm cursor-pointer active:scale-95 transition-transform">
                                                                        <span>{emoji}</span><span className="font-bold">{count}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* SCROLL TO BOTTOM BUTTON */}
                {showScrollBottom && (
                    <button onClick={() => scrollToBottom(true)} className="absolute bottom-24 right-6 w-10 h-10 bg-white dark:bg-[#1a2235] border border-zinc-200 dark:border-white/10 rounded-full shadow-xl flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-orange-500 hover:scale-105 transition-all z-40 animate-in fade-in slide-in-from-bottom-5">
                        <window.Icon name="chevron-down" size={24} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-sm animate-in zoom-in">
                                {unreadCount}
                            </span>
                        )}
                    </button>
                )}

                {/* FOOTER / INPUT */}
                {/* GEMINI-STYLE FOOTER / INPUT */}
                <div className="absolute bottom-0 left-0 right-0 z-[100] pb-4 sm:pb-6 px-3 sm:px-4 pointer-events-none flex flex-col justify-end">
                    
                    {/* TYPING INDICATOR */}
                    {isAiLoading && (
                        <div className="pointer-events-auto self-start ml-4 mb-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium animate-pulse flex items-center gap-1.5 bg-white/90 dark:bg-[#1e2330]/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-zinc-200 dark:border-white/5">
                            <window.Icon name="cpu" size={12} className="text-orange-500" /> AutoGrid AI tänker...
                        </div>
                    )}

                    {/* REDIGERINGS/SVAR-BAR */}
                    {(editingId || replyTo) && (
                        <div className="pointer-events-auto flex flex-col animate-in slide-in-from-bottom-2 mb-3 w-full max-w-3xl mx-auto bg-white/95 dark:bg-[#1a2235]/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-zinc-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-[12px] font-bold text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                    <window.Icon name={editingId ? "edit-2" : "reply"} size={14} className="text-orange-500" />
                                    {editingId ? 'Redigera meddelande' : `Svarar ${getSenderName(replyTo)}`}
                                </span>
                                <button type="button" onClick={() => { setEditingId(null); setReplyTo(null); setInputText(""); }} className="w-7 h-7 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/20 transition-all active:scale-95">
                                    <window.Icon name="x" size={14} className="stroke-[3]" />
                                </button>
                            </div>
                            {replyTo && (
                                <div className="bg-zinc-50 dark:bg-black/20 rounded-xl px-3 py-2 text-[13px] text-zinc-500 dark:text-zinc-400 truncate border border-zinc-200/50 dark:border-white/5">
                                    {replyTo.text || 'Ljud/Fil'}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SJÄLVA INMATNINGS-PILLRET */}
                    <form onSubmit={handleAction} className="pointer-events-auto flex items-center w-full max-w-4xl mx-auto relative shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.4)] rounded-[32px] bg-white dark:bg-[#1e2330] border border-zinc-200/80 dark:border-white/5">
    
                        <div className={`flex-1 flex items-end transition-all min-h-[56px] overflow-hidden px-1 py-1 ${isRecording ? 'ring-2 ring-red-500/50 rounded-[32px]' : ''}`}>
                            
                            {/* VÄNSTER: Plus-ikon */}
                            {!isRecording && (
                                <div className="flex items-center shrink-0 h-[48px] px-1 animate-in fade-in zoom-in duration-200">
                                    <label className="w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-all text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 active:scale-95">
                                        <window.Icon name="plus" size={24} className="stroke-[1.5]" />
                                        <input type="file" className="hidden" onChange={handleFile} />
                                    </label>
                                </div>
                            )}

                            {/* MITTEN: Textfält */}
                            {isRecording ? (
                                <div className="flex-1 flex items-center px-4 py-3 animate-pulse text-red-500 text-[15px] font-bold min-h-[48px]">
                                    <div className="flex items-center gap-1.5 mr-3">
                                        <span className="w-1 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1 h-4 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                    Spelar in ljud...
                                </div>
                            ) : (
                                <textarea
                                    ref={inputRef}
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onInput={handleInputResize}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                                    placeholder="Fråga AutoGrid AI..."
                                    rows={1}
                                    style={{ minHeight: '24px' }}
                                    className="flex-1 bg-transparent border-none outline-none text-[16px] font-medium text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400 resize-none custom-scrollbar py-3.5 px-2 self-center leading-snug"
                                />
                            )}
                            
                            {/* HÖGER: Mikrofon, Kamera eller Skicka */}
                            <div className="flex items-center shrink-0 h-[48px] px-1 gap-0.5">
                                {(inputText.trim() || isUploading || editingId || isRecording) ? (
                                    <button key="action-btn" type="submit" disabled={(!inputText.trim() && !isRecording && !isUploading)} className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm transition-all active:scale-90 ${isRecording ? 'bg-red-500 hover:bg-red-400' : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'}`}>
                                        {isRecording ? (
                                            <span key="rec" className="w-3.5 h-3.5 rounded-sm bg-white" onClick={toggleRecording}></span>
                                        ) : editingId ? (
                                            <window.Icon key="chk" name="check" size={20} className="stroke-[2.5]" />
                                        ) : (
                                            <window.Icon key="arr" name="arrow-right" size={20} className="stroke-[2.5]" />
                                        )}
                                    </button>
                                ) : (
                                    <>
                                        {isMobile && (
                                            <label key="cam-btn" className="w-10 h-10 rounded-full cursor-pointer flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-all active:scale-95">
                                                <window.Icon name="camera" size={20} className="stroke-[1.5]" />
                                                <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
                                            </label>
                                        )}
                                        <button key="mic-btn" type="button" onClick={toggleRecording} className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-700 dark:text-zinc-300 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-all active:scale-95">
                                            <window.Icon key="mic" name="mic" size={20} className="stroke-[1.5]" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* LIGHTBOX */}
            {activeImage && activeImage.fileUrl && (
                <div className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 font-sans" onClick={closeImageViewer}>
                    
                    <div className={`absolute top-0 right-0 left-0 h-safe-top min-h-[80px] bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-4 z-50 lg:bg-transparent lg:top-4 lg:right-4 lg:left-auto lg:min-h-0 lg:p-2 lg:bg-black/60 lg:backdrop-blur-md lg:rounded-2xl lg:border lg:border-white/10`} onClick={e => e.stopPropagation()}>
                        
                        <button onClick={closeImageViewer} className="w-12 h-12 lg:hidden flex items-center justify-center rounded-xl active:scale-95 transition-transform text-white">
                            <window.Icon name="arrow-left" size={24} />
                        </button>

                        <div className="flex items-center gap-2 ml-auto">
                            <button onClick={(e) => {
                                e.stopPropagation();
                                if (activeImage.fileUrl.startsWith('data:')) {
                                    fetch(activeImage.fileUrl).then(res => res.blob()).then(blob => window.open(URL.createObjectURL(blob), '_blank'));
                                } else {
                                    window.open(activeImage.fileUrl, '_blank');
                                }
                            }} title="Öppna i ny flik" className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="external-link" size={20} />
                            </button>

                            {activeImage.fileUrl.startsWith('data:') ? (
                                 <a href={activeImage.fileUrl} download={activeImage.text || 'bifogad_fil'} className="flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={20} />
                                </a>
                            ) : (
                                <button onClick={async () => {
                                    try {
                                        const response = await fetch(activeImage.fileUrl);
                                        const blob = await response.blob();
                                        const url = window.URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url; a.download = activeImage.text || 'bifogad_fil';
                                        document.body.appendChild(a); a.click();
                                        window.URL.revokeObjectURL(url);
                                    } catch (e) { alert("Kunde inte ladda ner fil."); }
                                }} className="flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="download" size={20} />
                                </button>
                            )}

                            {activeImage.sender === user.email && (
                                <button onClick={(e) => { 
                                    e.stopPropagation(); 
                                    if(confirm("Ta bort filen?")) { window.db.collection("notes").doc(activeImage.id).delete(); closeImageViewer(); } 
                                }} className="flex w-10 h-10 items-center justify-center rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 active:scale-95 transition-all">
                                    <window.Icon name="trash-2" size={20} />
                                </button>
                            )}

                            <button onClick={closeImageViewer} className="hidden lg:flex w-10 h-10 items-center justify-center rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all">
                                <window.Icon name="x" size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-full flex flex-col items-center justify-center p-4 lg:p-12 z-10" onClick={closeImageViewer}>
                        {activeImage.type !== 'file' ? (
                            <img src={activeImage.fileUrl} alt={activeImage.text} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg" onClick={e => e.stopPropagation()}/>
                        ) : (
                            <div className="flex flex-col items-center gap-6 p-12 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                                <div className="w-24 h-24 flex items-center justify-center rounded-2xl bg-black/50 border border-white/10 shadow-inner">
                                    <window.Icon name="file-text" size={48} className="text-white/40" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">{activeImage.text}</h3>
                                    <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-widest">{activeImage.fileUrl.startsWith('data:') ? 'LOKAL FIL' : 'LÄNKAD FIL'}</p>
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
