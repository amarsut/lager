// reference.js - AutoGrid Premium Drive UX

const { useState, useEffect, useMemo } = React;

const compressReferenceImage = async (file, maxWidth = 1600, quality = 0.8) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;
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
        reader.onerror = reject;
    });
};

const FOLDERS = [
    { id: 'ALLA', label: 'Min Enhet', icon: 'hard-drive', colorClass: 'text-zinc-500' },
    { id: 'FAVORITER', label: 'Favoriter', icon: 'star', colorClass: 'text-orange-500' },
    { id: 'OLJA', label: 'Olja & Vätskor', icon: 'droplet', colorClass: 'text-emerald-500' },
    { id: 'DÄCK', label: 'Däck & Fälg', icon: 'disc', colorClass: 'text-blue-500' },
    { id: 'MANUALER', label: 'Manualer & Guider', icon: 'book-open', colorClass: 'text-purple-500' },
    { id: 'ÖVRIGT', label: 'Övrigt', icon: 'package', colorClass: 'text-zinc-500' }
];

// --- NEDLADDNING AV FILER ---
const handleDownload = (doc) => {
    if (!doc.image) return;
    let ext = '';
    if (!doc.title.includes('.')) {
        const mimeMatch = doc.image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
        if (mimeMatch && mimeMatch.length > 1) {
            const mime = mimeMatch[1];
            if (mime === 'application/pdf') ext = '.pdf';
            else if (mime === 'text/html') ext = '.html';
            else if (mime === 'image/jpeg') ext = '.jpg';
            else if (mime === 'image/png') ext = '.png';
        }
    }
    const a = document.createElement('a');
    a.href = doc.image;
    a.download = `${doc.title}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

window.ReferenceView = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState('ALLA');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: '', category: 'ÖVRIGT', text: '', link: '', image: null, file: null });

    const [portalNode, setPortalNode] = useState(null);

    const [viewMode, setViewMode] = useState('grid'); // 'grid' eller 'list'

    // Hjälpfunktion för att kolla om en fil är PDF
    const isPdf = (base64String) => {
        return base64String && base64String.startsWith('data:application/pdf');
    };

    // Räknar ut storlek på Base64-strängar
    const storageStats = useMemo(() => {
        let totalBytes = 0;
        docs.forEach(doc => {
            if (doc.image) {
                // Base64 tar ca 3/4 av stränglängden i bytes. Ta bort 'data:image/...;base64,' i beräkningen.
                const base64Data = doc.image.split(',')[1] || doc.image;
                totalBytes += (base64Data.length * 3) / 4;
            }
            if (doc.text) totalBytes += doc.text.length;
        });

        const mbUsed = (totalBytes / (1024 * 1024)).toFixed(1);
        const maxMb = 50; // Visuell maxgräns (justera vid behov)
        const percentage = Math.min(100, Math.round((mbUsed / maxMb) * 100));

        return { mbUsed, percentage, maxMb };
    }, [docs]);

    useEffect(() => {
        setPortalNode(document.body || document.documentElement);
    }, []);

    const renderModal = (content) => {
        if (portalNode && window.ReactDOM) {
            return window.ReactDOM.createPortal(content, portalNode);
        }
        return content;
    };

    useEffect(() => {
        if (!window.db) return;
        const unsubscribe = window.db.collection("reference_docs").orderBy("timestamp", "desc").onSnapshot(snap => {
            setDocs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        let timeoutId;
        if (window.lucide) {
            timeoutId = setTimeout(() => {
                try { window.lucide.createIcons(); } catch (e) { console.error(e); }
            }, 50);
        }
        return () => clearTimeout(timeoutId);
    });

    const displayedFiles = useMemo(() => {
        return docs.filter(d => {
            if (searchQuery) return (d.title + d.text + d.category).toLowerCase().includes(searchQuery.toLowerCase());
            if (currentFolder === 'ALLA') return true;
            if (currentFolder === 'FAVORITER') return d.isFavorite;
            return d.category === currentFolder;
        });
    }, [docs, currentFolder, searchQuery]);

    const handleClosePanel = () => setSelectedDoc(null);

    const openCreate = () => {
        setFormData({ id: null, title: '', category: ['ALLA', 'FAVORITER'].includes(currentFolder) ? 'ÖVRIGT' : currentFolder, text: '', link: '', image: null, file: null });
        setIsUploadOpen(true);
    };

    const openEdit = (doc) => {
        setFormData({ ...doc, file: null });
        setIsUploadOpen(true);
    };

    const toggleFavorite = async (e, docId, currentState) => {
        e.stopPropagation();
        try {
            await window.db.collection("reference_docs").doc(docId).update({ isFavorite: !currentState });
            if (selectedDoc?.id === docId) setSelectedDoc(prev => ({ ...prev, isFavorite: !currentState }));
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Är du säker på att du vill radera filen från din Drive?")) return;
        try {
            await window.db.collection("reference_docs").doc(docId).delete();
            setSelectedDoc(null);
        } catch (error) { console.error(error); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.title) return;
        setUploading(true);
        try {
            let fileBase64 = formData.image;

            if (formData.file) {
                // Om det är en bild, komprimera den
                if (formData.file.type.startsWith('image/')) {
                    fileBase64 = await compressReferenceImage(formData.file);
                } else {
                    // Om det är PDF eller annat dokument, läs in som ren Base64
                    fileBase64 = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.readAsDataURL(formData.file);
                        reader.onload = (event) => resolve(event.target.result);
                        reader.onerror = reject;
                    });
                }
            }

            const payload = {
                title: formData.title, 
                category: formData.category, 
                text: formData.text, 
                link: formData.link,
                image: fileBase64, // Lagrar filens data (eller bild)
                fileType: formData.file ? formData.file.type : (formData.image ? 'image' : 'document'),
                timestamp: formData.id ? formData.timestamp : new Date().toISOString()
            };

            if (formData.id) {
                await window.db.collection("reference_docs").doc(formData.id).update(payload);
                setSelectedDoc({ ...payload, id: formData.id, isFavorite: selectedDoc?.isFavorite });
            } else {
                payload.isFavorite = false;
                await window.db.collection("reference_docs").add(payload);
            }
            setIsUploadOpen(false);
        } catch (error) { 
            console.error(error);
            alert("Fel vid uppladdning."); 
        } finally { 
            setUploading(false); 
        }
    };

    // --- NAVIGERING I LIGHTBOX ---
    const currentIndex = selectedDoc ? displayedFiles.findIndex(d => d.id === selectedDoc.id) : -1;
    const hasNext = currentIndex !== -1 && currentIndex < displayedFiles.length - 1;
    const hasPrev = currentIndex > 0;

    const goToNext = (e) => {
        if (e) e.stopPropagation();
        if (hasNext) setSelectedDoc(displayedFiles[currentIndex + 1]);
    };

    const goToPrev = (e) => {
        if (e) e.stopPropagation();
        if (hasPrev) setSelectedDoc(displayedFiles[currentIndex - 1]);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!selectedDoc) return;
            if (e.key === 'ArrowRight') goToNext();
            if (e.key === 'ArrowLeft') goToPrev();
            if (e.key === 'Escape') handleClosePanel();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDoc, currentIndex, displayedFiles]);
    // ----------------------------

    return (
        <>
            {/* --- HUVUDVY (DRIVE) --- */}
            <div className="flex flex-col bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4 lg:h-full lg:max-h-[100dvh] lg:overflow-hidden">

                {/* --- DESKTOP HEADER --- */}
                <div className="hidden lg:flex flex-col p-0 shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/10 gap-4 p-0 shrink-0 z-10">
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="relative group cursor-default shrink-0">
                                <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                    <window.Icon name="cloud" size={20} className="md:w-6 md:h-6" />
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                    AUTO<span className="font-light text-zinc-400 dark:text-zinc-500">DRIVE</span>
                                </h1>
                                <p className="text-[9px] md:text-[10px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                    Filer & Dokument
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex-1 w-full md:w-72 relative group">
                                <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Sök i Drive..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white/50 dark:bg-[#1e293b] border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-zinc-900 dark:text-white rounded-xl h-[46px] pl-11 pr-4 text-[12px] font-bold transition-all outline-none shadow-sm placeholder:text-zinc-400 uppercase tracking-widest"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-zinc-100 dark:bg-white/10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors">
                                        <window.Icon name="x" size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- MOBIL HEADER --- */}
                <div className="lg:hidden flex flex-col bg-zinc-50/50 dark:bg-[#09090b] transition-colors duration-500 shrink-0">
                    <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl text-zinc-900 dark:text-white shadow-sm border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 relative">

                        <div className="p-0 flex items-center justify-between border-b border-zinc-100 dark:border-white/10">
                            <div className="flex items-center gap-4">
                                <div className="relative group cursor-default shrink-0">
                                    <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700" />
                                    <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 bg-gradient-to-br from-orange-400 to-orange-600">
                                        <window.Icon name="cloud" size={24} />
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none drop-shadow-sm dark:drop-shadow-none">
                                        AUTO<span className="text-zinc-400 dark:text-zinc-500 font-light">DRIVE</span>
                                    </h1>
                                    <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                        Filer & Dokument
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={openCreate}
                                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-black/20 text-zinc-500 dark:text-zinc-400 hover:text-orange-500 dark:hover:text-white transition-colors border border-transparent dark:border-white/10 active:scale-90"
                                >
                                    <window.Icon name="plus" size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex overflow-x-auto px-0 pt-2 pb-0 space-x-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                            {FOLDERS.map(folder => {
                                const isActive = currentFolder === folder.id;
                                return (
                                    <button
                                        key={folder.id}
                                        onClick={() => setCurrentFolder(folder.id)}
                                        className={`py-3 px-1 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap relative flex items-center gap-1.5 ${isActive ? 'text-orange-500 border-orange-500' : 'text-zinc-400 dark:text-zinc-400 border-transparent hover:text-zinc-700 dark:hover:text-zinc-200'}`}
                                    >
                                        <window.Icon name={folder.icon} size={14} className={isActive && folder.id === 'FAVORITER' ? 'fill-current' : ''} />
                                        {folder.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="px-0 pt-3 pb-4">
                            <div className="relative group w-full mb-3">
                                <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Sök i Drive..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-100/50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-zinc-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-[12px] font-bold transition-all outline-none shadow-sm placeholder:text-zinc-400 uppercase tracking-widest"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-white/10 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors shadow-sm border border-zinc-200 dark:border-white/5">
                                        <window.Icon name="x" size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-3 bg-zinc-100/30 dark:bg-black/10 rounded-xl p-2.5 border border-zinc-200/50 dark:border-white/5">
                                <div className="w-7 h-7 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                    <window.Icon name="hard-drive" size={12} />
                                </div>
                                <div className="flex-1 min-w-0 pr-1">
                                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1.5">
                                        <span className="text-zinc-500 dark:text-zinc-400">Databas Lagring</span>
                                        <span className="text-zinc-900 dark:text-white">{storageStats.mbUsed} / {storageStats.maxMb} MB</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-200 dark:bg-black/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${storageStats.percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- DRIVE LAYOUT --- */}
                <div className="flex flex-col lg:flex-row flex-1 mt-2 px-0 gap-8 pb-4 relative items-start">
                    
                    {/* VÄNSTER MENY (Originalfärger men mer kompakt) */}
                    <div 
                        className="w-full lg:w-[230px] shrink-0 hidden lg:flex flex-col gap-4 sticky top-[130px]" 
                        style={{ height: 'calc(100vh - 150px)' }}
                    >
                        {/* Huvudknapp: Samma orange färg men smidigare storlek */}
                        <button 
                            onClick={openCreate} 
                            className="shrink-0 flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-3 px-4 font-bold text-[12px] uppercase tracking-widest shadow-sm transition-all active:scale-95"
                        >
                            <window.Icon name="plus" size={18} /> Ny Uppladdning
                        </button>

                        <div className="flex flex-col flex-1 gap-4 min-h-0">
                            {/* Mapplista: Vit bakgrund tillbaka, men tajtare */}
                            <div className="bg-white dark:bg-[#151b28] ring-1 ring-zinc-100 dark:ring-white/5 rounded-2xl p-2 shadow-sm shrink-0">
                                <nav className="flex flex-col gap-0.5">
                                    {FOLDERS.map(folder => {
                                        const isActive = currentFolder === folder.id;
                                        return (
                                            <button 
                                                key={folder.id}
                                                onClick={() => setCurrentFolder(folder.id)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-[11px] font-bold tracking-wide uppercase ${isActive ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
                                            >
                                                <window.Icon name={folder.icon} size={16} className={`${isActive ? (folder.id === 'FAVORITER' ? 'text-orange-500 fill-orange-500/20' : 'text-orange-500') : (folder.id === 'FAVORITER' ? 'text-orange-500' : 'text-zinc-400')}`} />
                                                {folder.label}
                                            </button>
                                        );
                                    })}
                                </nav>
                            </div>

                            {/* Databas: Samma stil, lite tajtare */}
                            <div className="bg-white dark:bg-[#151b28] ring-1 ring-zinc-100 dark:ring-white/5 rounded-2xl p-4 shadow-sm mt-auto shrink-0">
                                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <window.Icon name="hard-drive" size={14} /> Databas (Base64)
                                </h3>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-black/40 rounded-full overflow-hidden mb-2">
                                    <div className="h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${storageStats.percentage}%` }}></div>
                                </div>
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className="text-zinc-900 dark:text-white">{storageStats.mbUsed} MB</span>
                                    <span className="text-zinc-400">{storageStats.maxMb} MB</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* HÖGER SIDA (Med aktiv intern scroll) */}
                    <div className="flex-1 flex flex-col min-w-0 pb-12 lg:h-[calc(100vh-140px)] lg:overflow-y-auto custom-scrollbar lg:pr-4">
                        
                        {/* Sektionstitel, Action Bar & Vy-växlare */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 shrink-0 gap-4">
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                {searchQuery ? 'Sökresultat' : FOLDERS.find(f => f.id === currentFolder)?.label}
                            </h2>

                            <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                                
                                {/* ACTION BAR (Visas endast när en fil är markerad via 3-prickarna) */}
                                {selectedFiles.length > 0 && (
                                    <div className="flex items-center gap-1 bg-white dark:bg-[#151b28] border border-blue-200 dark:border-blue-900/50 shadow-sm rounded-xl px-1.5 py-1 mr-1 animate-in fade-in zoom-in-95 duration-200">
                                        {selectedFiles.length === 1 && (
                                            <button 
                                                onClick={() => openEdit(displayedFiles.find(f => f.id === selectedFiles[0]))} 
                                                className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-blue-500 dark:hover:bg-white/10 transition-colors" title="Redigera"
                                            >
                                                <window.Icon name="edit-2" size={14} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => {
                                                selectedFiles.forEach(id => {
                                                    const doc = displayedFiles.find(f => f.id === id);
                                                    if (doc) toggleFavorite({ stopPropagation: () => {} }, doc.id, doc.isFavorite);
                                                });
                                                setSelectedFiles([]);
                                            }} 
                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-white/10 transition-colors" title="Bokmärk"
                                        >
                                            <window.Icon name="star" size={14} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                selectedFiles.forEach(id => {
                                                    const doc = displayedFiles.find(f => f.id === id);
                                                    if (doc) handleDownload(doc);
                                                });
                                                setSelectedFiles([]);
                                            }} 
                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-white/10 transition-colors" title="Ladda ner"
                                        >
                                            <window.Icon name="download" size={14} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                selectedFiles.forEach(id => handleDelete(id));
                                                setSelectedFiles([]);
                                            }} 
                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-red-50 hover:text-red-500 dark:hover:bg-white/10 transition-colors" title="Radera"
                                        >
                                            <window.Icon name="trash-2" size={14} />
                                        </button>
                                        <div className="w-[1px] h-4 bg-zinc-200 dark:bg-white/10 mx-1"></div>
                                        <button 
                                            onClick={() => setSelectedFiles([])} 
                                            className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10 transition-colors" title="Avbryt"
                                        >
                                            <window.Icon name="x" size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* VY-VÄXLARE */}
                                <div className="flex items-center bg-zinc-100 dark:bg-[#151b28] rounded-xl p-1 border border-zinc-200 dark:border-white/5 shadow-sm">
                                    <button onClick={() => setViewMode('grid')} className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                                        <window.Icon name="grid" size={14} />
                                    </button>
                                    <button onClick={() => setViewMode('list')} className={`w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-orange-500 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}>
                                        <window.Icon name="list" size={14} />
                                    </button>
                                </div>
                                <span className="hidden sm:block text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-[#151b28] px-3 py-2 rounded-xl border border-zinc-200 dark:border-white/5 shadow-sm">{displayedFiles.length} objekt</span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-orange-500"><window.Icon name="loader" size={32} className="animate-spin opacity-50" /></div>
                        ) : displayedFiles.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                                <div className="w-24 h-24 bg-white dark:bg-[#151b28] rounded-[2rem] flex items-center justify-center text-zinc-300 dark:text-zinc-600 mb-6 shadow-sm ring-1 ring-zinc-100 dark:ring-white/5">
                                    <window.Icon name="folder-open" size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Mappen är tom</h3>
                                <p className="text-[14px] text-zinc-500 max-w-sm">Inga filer hittades här. Klicka på ladda upp för att lägga till dokument.</p>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    /* --- GOOGLE DRIVE GRID-KORT --- */
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 pb-4">
                                        {displayedFiles.map(doc => {
                                            const formattedDate = doc.timestamp ? new Date(doc.timestamp).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                            const pdfFile = isPdf(doc.image);
                                            const isHtmlFile = doc.title.toLowerCase().endsWith('.html') || (doc.image && doc.image.includes('text/html'));
                                            const isSelected = selectedFiles.includes(doc.id);
                                            
                                            let topIcon = "file-text", topIconColor = "text-blue-500";
                                            if (pdfFile) { topIcon = "file-text"; topIconColor = "text-red-500"; }
                                            else if (isHtmlFile) { topIcon = "code"; topIconColor = "text-orange-500"; }
                                            else if (doc.link) { topIcon = "link"; topIconColor = "text-sky-500"; }
                                            else if (doc.image && doc.image.startsWith('data:image/')) { topIcon = "image"; topIconColor = "text-emerald-500"; }
                                            else if (doc.text) { topIcon = "align-left"; topIconColor = "text-amber-500"; }

                                            return (
                                                <div 
                                                    key={doc.id}
                                                    onClick={() => setSelectedDoc(doc)}
                                                    className={`group flex flex-col rounded-xl md:rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md border ${isSelected ? 'bg-blue-50/40 dark:bg-[#1a2333] border-blue-400 ring-1 ring-blue-400' : 'bg-white dark:bg-[#151b28] border-zinc-200/80 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/10'}`}
                                                >
                                                    {/* Header */}
                                                    <div className={`px-2.5 md:px-3.5 pt-2.5 md:pt-3 pb-2 flex items-center justify-between gap-1.5 md:gap-2 border-b bg-transparent ${isSelected ? 'border-blue-200 dark:border-blue-900/50' : 'border-zinc-100 dark:border-white/5'}`}>
                                                        <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                                                            <window.Icon name={topIcon} size={14} className={`${topIconColor} shrink-0 w-3 h-3 md:w-3.5 md:h-3.5`} />
                                                            <h4 className={`text-[11px] md:text-[12px] font-medium truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-white'}`}>
                                                                {doc.title}
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            {doc.isFavorite && <window.Icon name="star" size={12} className="fill-orange-400 text-orange-400 shrink-0 mr-1" />}
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedFiles(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [doc.id]);
                                                                }}
                                                                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                                                            >
                                                                <window.Icon name="more-vertical" size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Preview (Nu med äkta Google Drive #f0f4f9 bakgrund) */}
                                                    <div className={`h-28 sm:h-36 md:h-40 w-full relative overflow-hidden flex items-center justify-center p-2 md:p-3 border-b ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50' : 'bg-[#f0f4f9] dark:bg-[#0a0d14]/60 border-zinc-100 dark:border-white/5'}`}>
                                                        {doc.image && doc.image.startsWith('data:image/') ? (
                                                            <img src={doc.image} className="w-full h-full object-cover rounded-md shadow-sm group-hover:scale-105 transition-transform duration-300" loading="lazy" alt={doc.title} />
                                                        ) : isHtmlFile ? (
                                                            <div className="w-full h-full relative pointer-events-none overflow-hidden rounded-md bg-white border border-zinc-200 shadow-sm">
                                                                <iframe src={doc.image} className="w-[400%] h-[400%] absolute top-0 left-0 border-0 bg-white pointer-events-none select-none" style={{ transform: 'scale(0.25)', transformOrigin: 'top left' }} title={doc.title} />
                                                            </div>
                                                        ) : pdfFile ? (
                                                            <div className="flex flex-col items-center justify-center gap-1.5 md:gap-3 group-hover:scale-105 transition-transform duration-300 scale-75 md:scale-100">
                                                                <window.Icon name="file-text" size={48} className="text-red-400 drop-shadow-sm" strokeWidth={1.2} />
                                                                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-red-500">PDF-Dokument</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center gap-1.5 md:gap-3 group-hover:scale-105 transition-transform duration-300 scale-75 md:scale-100">
                                                                <window.Icon name={doc.link ? "link" : "file-text"} size={48} className="text-zinc-300 dark:text-zinc-600 group-hover:text-zinc-400 transition-colors drop-shadow-sm" strokeWidth={1.2} />
                                                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-400 text-center leading-tight">Ingen<br className="md:hidden" /> förhandsvisning</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className={`px-2.5 md:px-3.5 py-2 flex items-center justify-between text-[9px] md:text-[10px] bg-transparent ${isSelected ? 'text-blue-500/70 dark:text-blue-400/70' : 'text-zinc-400'}`}>
                                                        <span className="truncate">{doc.category}</span>
                                                        {formattedDate && <span className="font-mono shrink-0">{formattedDate}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* --- LISTVY MED MARKERING --- */
                                    <div className="bg-white dark:bg-[#151b28] rounded-2xl border border-zinc-200 dark:border-white/5 overflow-hidden shadow-sm">
                                        <div className="grid grid-cols-12 px-4 py-3 bg-zinc-50 dark:bg-white/5 border-b border-zinc-200 dark:border-white/5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                            <div className="col-span-7 sm:col-span-6">Namn</div>
                                            <div className="col-span-4 sm:col-span-3">Kategori</div>
                                            <div className="hidden sm:block col-span-2">Datum</div>
                                            <div className="col-span-1 text-right"></div>
                                        </div>
                                        <div className="divide-y divide-zinc-100 dark:divide-white/5">
                                            {displayedFiles.map(doc => {
                                                const formattedDate = doc.timestamp ? new Date(doc.timestamp).toLocaleDateString('sv-SE', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                                const pdfFile = isPdf(doc.image);
                                                const isHtmlFile = doc.title.toLowerCase().endsWith('.html') || (doc.image && doc.image.includes('text/html'));
                                                const isSelected = selectedFiles.includes(doc.id);
                                                
                                                let iconName = "file-text", iconBg = "bg-blue-500/10 text-blue-500";
                                                if (pdfFile) { iconName = "file-text"; iconBg = "bg-red-500/10 text-red-500"; }
                                                else if (isHtmlFile) { iconName = "code"; iconBg = "bg-orange-500/10 text-orange-500"; }
                                                else if (doc.image && doc.image.startsWith('data:image/')) { iconName = "image"; iconBg = "bg-emerald-500/10 text-emerald-500"; }
                                                else if (doc.link) { iconName = "link"; iconBg = "bg-sky-500/10 text-sky-500"; }
                                                else if (doc.text) { iconName = "align-left"; iconBg = "bg-amber-500/10 text-amber-500"; }

                                                return (
                                                    <div 
                                                        key={doc.id}
                                                        onClick={() => setSelectedDoc(doc)}
                                                        className={`grid grid-cols-12 px-4 py-3 items-center cursor-pointer transition-colors group border-l-2 ${isSelected ? 'bg-blue-50/40 dark:bg-[#1a2333] border-blue-500' : 'hover:bg-zinc-50 dark:hover:bg-white/5 border-transparent'}`}
                                                    >
                                                        <div className="col-span-7 sm:col-span-6 flex items-center gap-3 min-w-0 pr-2 sm:pr-4">
                                                            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 overflow-hidden`}>
                                                                {doc.image && doc.image.startsWith('data:image/') ? <img src={doc.image} className="w-full h-full object-cover" alt="" /> : <window.Icon name={iconName} size={16} />}
                                                            </div>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className={`text-[12px] md:text-[13px] font-medium truncate transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-900 dark:text-white group-hover:text-blue-500'}`}>{doc.title}</span>
                                                                {doc.text && <span className="hidden sm:block text-[10px] text-zinc-400 truncate max-w-[250px]">{doc.text}</span>}
                                                            </div>
                                                        </div>

                                                        <div className="col-span-4 sm:col-span-3 flex items-center gap-1.5 text-[10px] md:text-[11px] text-zinc-500 font-medium">
                                                            <window.Icon name={FOLDERS.find(f => f.id === doc.category)?.icon || 'folder'} size={12} className={FOLDERS.find(f => f.id === doc.category)?.colorClass} />
                                                            <span className="truncate">{doc.category}</span>
                                                        </div>

                                                        <div className="hidden sm:block col-span-2 text-[11px] text-zinc-400 font-mono">
                                                            {formattedDate}
                                                        </div>

                                                        <div className="col-span-1 text-right flex items-center justify-end gap-1 sm:gap-2">
                                                            {doc.isFavorite && <window.Icon name="star" size={14} className="fill-orange-400 text-orange-400 hidden sm:block" />}
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedFiles(prev => prev.includes(doc.id) ? prev.filter(id => id !== doc.id) : [doc.id]);
                                                                }}
                                                                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${isSelected ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                                                            >
                                                                <window.Icon name="more-vertical" size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODALER --- */}

            {/* CINEMA LIGHTBOX (Proffsigare Premium-UX) */}
            {/* CINEMA LIGHTBOX (Google Drive Premium UI) */}
            {selectedDoc && renderModal(
                <div className="fixed inset-0 z-[99999] flex flex-col bg-[#0f111a] text-white animate-in fade-in duration-200">
                    
                    {/* TOP HEADER */}
                    <div className="h-16 px-2 md:px-4 flex items-center justify-between border-b border-white/10 bg-[#0f111a] shrink-0">
                        {/* Vänster: Tillbaka/Stäng & Titel */}
                        <div className="flex items-center gap-2 md:gap-4 min-w-0 pr-2">
                            <button onClick={handleClosePanel} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors shrink-0 text-zinc-300 hover:text-white" title="Stäng (Esc)">
                                <window.Icon name="arrow-left" size={24} />
                            </button>
                            <div className="flex items-center gap-3 min-w-0">
                                <div className={`hidden md:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 ${FOLDERS.find(f => f.id === selectedDoc.category)?.colorClass.replace('text-', 'bg-').concat('/20') || 'bg-white/10'}`}>
                                    <window.Icon name={FOLDERS.find(f => f.id === selectedDoc.category)?.icon || 'file'} size={16} className={FOLDERS.find(f => f.id === selectedDoc.category)?.colorClass} />
                                </div>
                                <h2 className="text-[14px] md:text-[16px] font-bold truncate tracking-wide">{selectedDoc.title}</h2>
                                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-white/10 text-zinc-400 shrink-0">
                                    {selectedDoc.category}
                                </span>
                            </div>
                        </div>

                        {/* Höger: Actions */}
                        <div className="flex items-center gap-1 md:gap-2 shrink-0">
                            <button onClick={() => openEdit(selectedDoc)} className="h-10 px-2 md:px-4 flex items-center gap-2 rounded-full hover:bg-white/10 transition-colors text-zinc-300 hover:text-white" title="Redigera">
                                <window.Icon name="edit-2" size={18} />
                                <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest">Redigera</span>
                            </button>
                            <button onClick={() => handleDownload(selectedDoc)} className="h-10 px-2 md:px-4 flex items-center gap-2 rounded-full hover:bg-white/10 transition-colors text-zinc-300 hover:text-white" title="Ladda ner">
                                <window.Icon name="download" size={18} />
                                <span className="hidden md:block text-[11px] font-bold uppercase tracking-widest">Ladda ner</span>
                            </button>
                            <button onClick={(e) => toggleFavorite(e, selectedDoc.id, selectedDoc.isFavorite)} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${selectedDoc.isFavorite ? 'text-orange-500 hover:bg-orange-500/10' : 'text-zinc-300 hover:bg-white/10 hover:text-white'}`} title="Bokmärk">
                                <window.Icon name="star" size={18} className={selectedDoc.isFavorite ? "fill-current" : ""} />
                            </button>
                            <button onClick={() => handleDelete(selectedDoc.id)} className="w-10 h-10 flex items-center justify-center rounded-full text-zinc-300 hover:bg-red-500/10 hover:text-red-400 transition-colors md:ml-1" title="Radera">
                                <window.Icon name="trash-2" size={18} />
                            </button>
                        </div>
                    </div>

                    {/* MAIN CONTENT AREA */}
                    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0a0c12]">
                        
                        {/* Dokumentvisare */}
                        <div className="flex-1 relative flex items-center justify-center min-w-0 group p-4 md:p-8">
                            {hasPrev && (
                                <button onClick={goToPrev} className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 opacity-0 md:opacity-100 hover:opacity-100 group-hover:opacity-100 border border-white/10">
                                    <window.Icon name="chevron-left" size={32} strokeWidth={1.5} />
                                </button>
                            )}
                            {hasNext && (
                                <button onClick={goToNext} className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/40 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-90 opacity-0 md:opacity-100 hover:opacity-100 group-hover:opacity-100 border border-white/10">
                                    <window.Icon name="chevron-right" size={32} strokeWidth={1.5} />
                                </button>
                            )}

                            <div className="w-full h-full max-w-6xl flex items-center justify-center">
                                {isPdf(selectedDoc.image) || selectedDoc.title.toLowerCase().endsWith('.html') || (selectedDoc.image && selectedDoc.image.includes('text/html')) ? (
                                    <iframe 
                                        src={selectedDoc.image} 
                                        className="w-full h-full bg-white rounded-lg shadow-2xl" 
                                        title={selectedDoc.title}
                                    />
                                ) : selectedDoc.image ? (
                                    <img
                                        src={selectedDoc.image}
                                        className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300"
                                        alt={selectedDoc.title}
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-6 opacity-30">
                                        <window.Icon name="file-text" size={120} strokeWidth={1} />
                                        <span className="text-xl font-bold uppercase tracking-widest">Ingen förhandsvisning</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidopanel för Info (Visas BARA om text eller länk finns) */}
                        {(selectedDoc.text || selectedDoc.link) && (
                            <div className="w-full lg:w-[400px] bg-[#0f111a] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shrink-0">
                                <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                                    
                                    <h3 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest border-b border-white/10 pb-4">
                                        Filinformation
                                    </h3>

                                    {selectedDoc.text && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <window.Icon name="align-left" size={14} /> Anteckningar
                                            </h4>
                                            <div className="text-[14px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                {selectedDoc.text}
                                            </div>
                                        </div>
                                    )}

                                    {selectedDoc.link && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                <window.Icon name="link" size={14} /> Länk till system
                                            </h4>
                                            <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl text-[13px] font-bold text-blue-400 transition-colors group border border-white/5">
                                                <span className="truncate pr-4">{selectedDoc.link.replace(/^https?:\/\//, '')}</span>
                                                <window.Icon name="external-link" size={16} className="group-hover:text-white transition-colors" />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* UPPLADDNINGS-MODAL */}
            {isUploadOpen && renderModal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>

                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsUploadOpen(false)}></div>

                    <div className="relative bg-white dark:bg-[#151b28] rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in zoom-in-95 duration-200 z-10">

                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50 dark:bg-[#1a2133]">
                            <h2 className="text-[13px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                                <window.Icon name={formData.id ? "edit-2" : "upload-cloud"} size={16} className="text-orange-500" />
                                {formData.id ? 'Redigera Dokument' : 'Ladda upp till Drive'}
                            </h2>
                            <button onClick={() => setIsUploadOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 transition-colors"><window.Icon name="x" size={16} /></button>
                        </div>

                        <form id="upload-form" onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Filnamn / Titel</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400" placeholder="Ange en titel..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Mapp</label>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDERS.filter(f => !['ALLA', 'FAVORITER'].includes(f.id)).map(f => (
                                        <button
                                            key={f.id}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, category: f.id })}
                                            className={`px-4 py-2.5 rounded-xl ring-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${formData.category === f.id ? `bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 ring-transparent` : 'bg-white dark:bg-transparent text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                        >
                                            <window.Icon name={f.icon} size={14} className={formData.category === f.id ? '' : f.colorClass} /> {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Media / Dokument</label>
                                <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[24px] cursor-pointer transition-all ${formData.file || formData.image ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-500/5' : 'border-zinc-300 dark:border-white/10 hover:border-orange-400/50 hover:bg-zinc-50 dark:hover:bg-white/5'} text-zinc-500`}>
                                    <input 
                                        type="file" 
                                        accept="image/*,application/pdf,.doc,.docx,.txt,.bin,.mod" 
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                // Rensa filändelsen (t.ex. ".pdf" eller ".jpg")
                                                const fileNameWithoutExtension = file.name.replace(/\.[^/.]+$/, "");
                                                
                                                // Uppdatera formData: sätt filen, och om titeln är tom, sätt filnamnet
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    file: file,
                                                    title: prev.title === '' ? fileNameWithoutExtension : prev.title
                                                }));
                                            }
                                        }} 
                                        className="hidden" 
                                    />
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${formData.file || formData.image ? 'bg-orange-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-black/40 text-zinc-400'}`}>
                                        <window.Icon name={formData.file || formData.image ? "check" : "upload"} size={20} />
                                    </div>
                                    <span className={`text-[12px] font-bold text-center tracking-wide ${formData.file || formData.image ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500'}`}>
                                        {formData.file ? formData.file.name : (formData.image ? 'Befintlig fil vald. Klicka för att byta.' : 'Klicka för att välja fil (Bilder eller PDF)')}
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-5 pt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Extern Länk (Valfritt)</label>
                                    <input type="url" value={formData.link} onChange={e => setFormData({ ...formData, link: e.target.value })} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-400" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Anteckningar (Valfritt)</label>
                                    <textarea value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} rows="3" className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none placeholder:text-zinc-400 custom-scrollbar" placeholder="Instruktioner..."></textarea>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#1a2133]">
                            <button form="upload-form" type="submit" disabled={uploading} className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                {uploading ? <><window.Icon name="loader" size={18} className="animate-spin" /> Sparar...</> : <><window.Icon name="save" size={18} /> Spara</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
