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

window.ReferenceView = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentFolder, setCurrentFolder] = useState('ALLA');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: '', category: 'ÖVRIGT', text: '', link: '', image: null, file: null });

    const [portalNode, setPortalNode] = useState(null);

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
            let imageBase64 = formData.image; 
            if (formData.file) imageBase64 = await compressReferenceImage(formData.file); 
            
            const payload = { 
                title: formData.title, category: formData.category, text: formData.text, link: formData.link, 
                image: imageBase64, timestamp: formData.id ? formData.timestamp : new Date().toISOString() 
            };
            
            if (formData.id) {
                await window.db.collection("reference_docs").doc(formData.id).update(payload); 
                setSelectedDoc({ ...payload, id: formData.id, isFavorite: selectedDoc?.isFavorite });
            } else {
                payload.isFavorite = false;
                await window.db.collection("reference_docs").add(payload);
            }
            setIsUploadOpen(false);
        } catch (error) { alert("Fel vid uppladdning."); } 
        finally { setUploading(false); }
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
            <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4">
                
                {/* --- DESKTOP HEADER (0 padding) --- */}
                <div className="hidden lg:flex flex-col h-full p-0">
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

                {/* --- MOBIL HEADER (0 padding) --- */}
                <div className="lg:hidden flex flex-col bg-zinc-50/50 dark:bg-[#09090b] transition-colors duration-500">
                    {/* Tog bort pt-safe-top och all inbyggd padding */}
                    <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-2xl text-zinc-900 dark:text-white shadow-sm border-b border-zinc-200 dark:border-white/10 transition-colors duration-300 relative">                    
                        
                        {/* 1. Logga & Titel på X:0 Y:0 (p-0) */}
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
                        </div>

                        {/* 2. Sökfält med 0 padding på sidorna (px-0) */}
                        <div className="px-0 pt-3 pb-3">
                            <div className="relative group w-full">
                                <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Sök i Drive..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-zinc-100/50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 text-zinc-900 dark:text-white rounded-xl py-3 pl-11 pr-4 text-[12px] font-bold transition-all outline-none shadow-sm placeholder:text-zinc-400 uppercase tracking-widest"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* DRIVE LAYOUT */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mt-3 px-0 gap-8 pb-24 lg:pb-10">
    
                    <div className="w-full lg:w-[260px] shrink-0 hidden lg:flex flex-col gap-6">
                        <button 
                            onClick={openCreate} 
                            className="flex items-center justify-center gap-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl py-4 px-6 font-bold text-[13px] uppercase tracking-widest shadow-md transition-all active:scale-95"
                        >
                            <window.Icon name="plus" size={20} /> Ny Uppladdning
                        </button>

                        <div className="bg-white dark:bg-[#151b28] ring-1 ring-zinc-100 dark:ring-white/5 rounded-3xl p-3 shadow-sm">
                            <nav className="flex flex-col gap-1">
                                {FOLDERS.map(folder => {
                                    const isActive = currentFolder === folder.id;
                                    return (
                                        <button 
                                            key={folder.id}
                                            onClick={() => setCurrentFolder(folder.id)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 w-full text-[13px] font-bold tracking-wide uppercase ${isActive ? 'bg-zinc-100 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
                                        >
                                            <window.Icon name={folder.icon} size={18} className={`${isActive ? (folder.id === 'FAVORITER' ? 'text-orange-500 fill-orange-500/20' : 'text-orange-500') : (folder.id === 'FAVORITER' ? 'text-orange-500' : 'text-zinc-400')}`} />
                                            {folder.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                {searchQuery ? 'Sökresultat' : FOLDERS.find(f => f.id === currentFolder)?.label}
                            </h2>
                            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-100 dark:bg-[#151b28] px-3 py-1.5 rounded-md">{displayedFiles.length} objekt</span>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-orange-500"><window.Icon name="loader" size={32} className="animate-spin opacity-50" /></div>
                        ) : displayedFiles.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
                                <div className="w-24 h-24 bg-white dark:bg-[#151b28] rounded-[2rem] flex items-center justify-center text-zinc-300 dark:text-zinc-600 mb-6 shadow-sm ring-1 ring-zinc-100 dark:ring-white/5">
                                    <window.Icon name="folder-open" size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Mappen är tom</h3>
                                <p className="text-[14px] text-zinc-500 max-w-sm">Inga filer hittades här. Klicka på plusknappen för att ladda upp något nytt.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 lg:gap-6 pb-4">
                                {displayedFiles.map(doc => (
                                    <div 
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className="group relative flex flex-col bg-white dark:bg-[#151b28] rounded-[24px] overflow-hidden cursor-pointer shadow-sm ring-1 ring-zinc-200 dark:ring-white/5 hover:ring-orange-500/50 hover:shadow-lg transition-all duration-300 aspect-square md:aspect-[4/3] transform hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 bg-zinc-100 dark:bg-black/40">
                                            {doc.image ? (
                                                <img src={doc.image} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" alt={doc.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 group-hover:scale-110 group-hover:text-orange-500/50 transition-all duration-500">
                                                    <window.Icon name={doc.link ? "link" : "file-text"} size={48} strokeWidth={1.5} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity z-10 pointer-events-none"></div>

                                        <button 
                                            onClick={(e) => toggleFavorite(e, doc.id, doc.isFavorite)}
                                            className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${doc.isFavorite ? 'bg-orange-500 text-white shadow-md' : 'bg-black/30 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60 hover:text-white'}`}
                                        >
                                            <window.Icon name="star" size={14} className={doc.isFavorite ? "fill-white" : ""} />
                                        </button>

                                        <div className="absolute inset-x-0 bottom-0 p-4 pt-12 flex flex-col justify-end z-10 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 text-white">
                                                <div className="shrink-0 opacity-80">
                                                    <window.Icon name={FOLDERS.find(f => f.id === doc.category)?.icon || 'file'} size={14} />
                                                </div>
                                                <h4 className="text-[13px] font-bold truncate tracking-wide drop-shadow-md">
                                                    {doc.title}
                                                </h4>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button onClick={openCreate} className="lg:hidden fixed bottom-6 right-6 z-[90] bg-orange-500 text-white rounded-[20px] w-14 h-14 shadow-lg active:scale-95 flex items-center justify-center transition-transform">
                    <window.Icon name="plus" size={24} />
                </button>
            </div>

            {/* --- MODALER --- */}
            
            {/* CINEMA LIGHTBOX (Nu med Navigering Höger/Vänster) */}
            {selectedDoc && renderModal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 lg:p-10" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto transition-opacity" onClick={handleClosePanel}></div>
                    
                    <div className="relative w-full max-w-[1400px] h-[95vh] lg:h-[85vh] flex flex-col lg:flex-row bg-[#151b28] rounded-[32px] shadow-2xl ring-1 ring-white/10 overflow-hidden animate-in zoom-in-95 duration-200 z-10 pointer-events-auto">
                        
                        {/* Vänster sida: Bildvisaren */}
                        <div className="flex-1 flex flex-col relative bg-[#0a0d14] min-w-0 min-h-0 group" onClick={handleClosePanel}>
                            
                            <button onClick={handleClosePanel} className="absolute top-4 lg:top-6 left-4 lg:left-6 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all border border-white/10 shadow-lg cursor-pointer active:scale-90">
                                <window.Icon name="x" size={24} />
                            </button>

                            {/* NAVIGERING: Vänster-pil */}
                            {hasPrev && (
                                <button onClick={goToPrev} className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-xl active:scale-90 opacity-70 hover:opacity-100">
                                    <window.Icon name="chevron-left" size={28} />
                                </button>
                            )}

                            {/* NAVIGERING: Höger-pil */}
                            {hasNext && (
                                <button onClick={goToNext} className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-50 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all shadow-xl active:scale-90 opacity-70 hover:opacity-100">
                                    <window.Icon name="chevron-right" size={28} />
                                </button>
                            )}

                            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 min-w-0 min-h-0 overflow-hidden relative">
                                {selectedDoc.image ? (
                                    <img 
                                        src={selectedDoc.image} 
                                        className="w-auto h-auto max-w-full max-h-full object-contain rounded-[24px] ring-1 ring-white/10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300" 
                                        alt={selectedDoc.title} 
                                        onClick={(e) => e.stopPropagation()} 
                                    />
                                ) : (
                                    <window.Icon name="file-text" size={120} className="text-white/10 animate-in zoom-in-95 duration-300" />
                                )}
                            </div>
                        </div>

                        {/* Höger sida: Panel */}
                        <div className="w-full lg:w-[420px] flex flex-col shrink-0 bg-[#151b28] border-t lg:border-t-0 lg:border-l border-white/5 min-h-[40vh] lg:min-h-0">
                            
                            <div className="lg:hidden w-full flex justify-center pt-4 pb-2 cursor-pointer" onClick={handleClosePanel}>
                                <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar">
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-tight mb-4 tracking-tight">{selectedDoc.title}</h2>
                                    <div className="flex items-center gap-3">
                                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-white/5 border border-white/5 ${FOLDERS.find(f => f.id === selectedDoc.category)?.colorClass || 'text-zinc-400'}`}>
                                            <window.Icon name={FOLDERS.find(f => f.id === selectedDoc.category)?.icon || 'folder'} size={12} />
                                            {selectedDoc.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => openEdit(selectedDoc)} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all border border-white/5 active:scale-95">
                                        <window.Icon name="edit-2" size={18} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Redigera</span>
                                    </button>
                                    <button onClick={(e) => toggleFavorite(e, selectedDoc.id, selectedDoc.isFavorite)} className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl transition-all active:scale-95 ${selectedDoc.isFavorite ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'}`}>
                                        <window.Icon name="star" size={18} className={selectedDoc.isFavorite ? "fill-current" : ""} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Bokmärk</span>
                                    </button>
                                    <button onClick={() => handleDelete(selectedDoc.id)} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/10 active:scale-95">
                                        <window.Icon name="trash-2" size={18} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest mt-1">Radera</span>
                                    </button>
                                </div>

                                {selectedDoc.text && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><window.Icon name="align-left" size={14}/> Anteckningar</h4>
                                        <div className="text-[14px] text-zinc-300 whitespace-pre-wrap leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5">
                                            {selectedDoc.text}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedDoc.link && (
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2"><window.Icon name="link" size={14}/> Referenslänk</h4>
                                        <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-2xl text-[12px] font-bold text-blue-400 transition-colors group">
                                            <span className="truncate pr-4">{selectedDoc.link.replace(/^https?:\/\//, '')}</span>
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                                                <window.Icon name="external-link" size={12} />
                                            </div>
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
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
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-zinc-400" placeholder="Ange en titel..." />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Mapp</label>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDERS.filter(f => !['ALLA', 'FAVORITER'].includes(f.id)).map(f => (
                                        <button 
                                            key={f.id} 
                                            type="button"
                                            onClick={() => setFormData({...formData, category: f.id})}
                                            className={`px-4 py-2.5 rounded-xl ring-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${formData.category === f.id ? `bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 ring-transparent` : 'bg-white dark:bg-transparent text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                        >
                                            <window.Icon name={f.icon} size={14} className={formData.category === f.id ? '' : f.colorClass} /> {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Media</label>
                                <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[24px] cursor-pointer transition-all ${formData.file || formData.image ? 'border-orange-500/50 bg-orange-50 dark:bg-orange-500/5' : 'border-zinc-300 dark:border-white/10 hover:border-orange-400/50 hover:bg-zinc-50 dark:hover:bg-white/5'} text-zinc-500`}>
                                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, file: e.target.files[0]})} className="hidden" />
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${formData.file || formData.image ? 'bg-orange-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-black/40 text-zinc-400'}`}>
                                        <window.Icon name={formData.file || formData.image ? "check" : "image"} size={20} />
                                    </div>
                                    <span className={`text-[12px] font-bold text-center tracking-wide ${formData.file || formData.image ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500'}`}>
                                        {formData.file ? formData.file.name : (formData.image ? 'Befintlig bild vald. Klicka för att byta.' : 'Klicka för att välja fil från enhet')}
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-5 pt-2">
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Extern Länk (Valfritt)</label>
                                    <input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-400" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block ml-1">Anteckningar (Valfritt)</label>
                                    <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} rows="3" className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none placeholder:text-zinc-400 custom-scrollbar" placeholder="Instruktioner..."></textarea>
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
