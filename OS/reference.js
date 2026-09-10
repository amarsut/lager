// reference.js - AutoGrid Cloud Drive UX

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

    return (
        <>
            {/* --- HUVUDVY (DRIVE) --- */}
            <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white transition-colors duration-500 relative max-w-[1600px] ml-0 lg:mx-auto w-full animate-in fade-in slide-in-from-left-4 pb-0">
                
                <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

                {/* TOPP HEADER */}
                <div className="px-4 pt-4 lg:px-8 lg:pt-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg bg-gradient-to-br from-orange-400 to-orange-600 shrink-0">
                            <window.Icon name="cloud" size={24} />
                            <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full -z-10"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                AUTO<span className="font-light text-zinc-400 dark:text-zinc-500">DRIVE</span>
                            </h1>
                            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1">Dokument & Filer</p>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:max-w-md relative group">
                        <window.Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Sök i Drive..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-black/20 ring-1 ring-zinc-200/80 dark:ring-white/10 focus:ring-2 focus:ring-orange-500 text-zinc-900 dark:text-white rounded-2xl py-3.5 pl-11 pr-4 text-[13px] font-medium transition-all outline-none shadow-sm placeholder:text-zinc-400"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1">
                                <window.Icon name="x" size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* DRIVE LAYOUT (Sidebar + Main Grid) */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mt-6 lg:mt-10 px-4 lg:px-8 gap-8 pb-24 lg:pb-8">
                    
                    <div className="w-full lg:w-64 shrink-0 flex flex-col gap-6">
                        <button 
                            onClick={openCreate} 
                            className="hidden lg:flex items-center justify-center gap-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white rounded-2xl py-4 px-6 font-bold text-[13px] uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                        >
                            <window.Icon name="plus" size={18} /> Ny Uppladdning
                        </button>

                        <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 custom-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
                            {FOLDERS.map(folder => {
                                const isActive = currentFolder === folder.id;
                                return (
                                    <button 
                                        key={folder.id}
                                        onClick={() => setCurrentFolder(folder.id)}
                                        className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink text-[12px] font-bold tracking-wide uppercase ${isActive ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'}`}
                                    >
                                        <window.Icon name={folder.icon} size={16} className={isActive ? (folder.id === 'FAVORITER' ? 'fill-orange-500 text-orange-500' : '') : (folder.id === 'FAVORITER' ? 'text-orange-500' : '')} />
                                        {folder.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                {searchQuery ? 'Sökresultat' : FOLDERS.find(f => f.id === currentFolder)?.label}
                            </h2>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-md">{displayedFiles.length} objekt</span>
                        </div>

                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-orange-500"><window.Icon name="loader" size={32} className="animate-spin opacity-50" /></div>
                        ) : displayedFiles.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center text-zinc-300 dark:text-zinc-600 mb-6">
                                    <window.Icon name="image" size={40} />
                                </div>
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Inga filer här</h3>
                                <p className="text-[13px] text-zinc-500 max-w-xs">Mappen är tom eller så matchar inga filer din sökning.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 pb-10">
                                {displayedFiles.map(doc => (
                                    <div 
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc)}
                                        className="group relative flex flex-col bg-zinc-100 dark:bg-[#0f1522] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10 hover:ring-orange-500/50 aspect-square md:aspect-[4/3] transform hover:-translate-y-1"
                                    >
                                        <div className="absolute inset-0 bg-zinc-200 dark:bg-black/50">
                                            {doc.image ? (
                                                <img src={doc.image} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" alt={doc.title} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400 dark:text-zinc-600/50 group-hover:scale-110 transition-transform duration-500">
                                                    <window.Icon name={doc.link ? "link" : "file-text"} size={48} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors z-10 pointer-events-none"></div>

                                        <button 
                                            onClick={(e) => toggleFavorite(e, doc.id, doc.isFavorite)}
                                            className={`absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 ${doc.isFavorite ? 'bg-orange-500 text-white shadow-md' : 'bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50'}`}
                                        >
                                            <window.Icon name="star" size={14} className={doc.isFavorite ? "fill-white" : ""} />
                                        </button>

                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12 flex flex-col justify-end z-10 translate-y-1 group-hover:translate-y-0 transition-transform">
                                            <div className="flex items-center gap-2 text-white">
                                                <window.Icon name={FOLDERS.find(f => f.id === doc.category)?.icon || 'file'} size={14} className="opacity-70 shrink-0" />
                                                <h4 className="text-[13px] font-bold truncate leading-none drop-shadow-md">
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

                {/* MOBIL FAB */}
                <button onClick={openCreate} className="lg:hidden fixed bottom-24 right-4 z-[90] bg-orange-500 text-white rounded-2xl w-14 h-14 shadow-lg shadow-orange-500/30 active:scale-95 flex items-center justify-center transition-transform">
                    <window.Icon name="plus" size={24} />
                </button>
            </div>

            {/* --- MODALER (FRISTÅENDE FÖR ATT UNDVIKA ANIMATION GLITCHES) --- */}
            
            {/* CINEMA LIGHTBOX (Förhandsgranskning / Detaljer) */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">
                    
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl pointer-events-auto" onClick={handleClosePanel}></div>
                    
                    <div className="relative w-full h-full flex flex-col lg:flex-row z-10 pointer-events-none overflow-hidden">
                        
                        {/* Bildvisaren (helt låst så den inte kan trycka ut fönstret) */}
                        <div className="flex-1 flex flex-col relative pointer-events-auto min-w-0 min-h-0" onClick={handleClosePanel}>
                            <button onClick={handleClosePanel} className="absolute top-4 lg:top-8 left-4 lg:left-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all border border-white/10 shadow-lg cursor-pointer active:scale-90">
                                <window.Icon name="x" size={24} />
                            </button>

                            <div className="flex-1 flex items-center justify-center p-4 lg:p-12 min-w-0 min-h-0 overflow-hidden">
                                {selectedDoc.image ? (
                                    <img 
                                        src={selectedDoc.image} 
                                        className="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-[0_0_40px_rgba(0,0,0,0.5)]" 
                                        alt={selectedDoc.title} 
                                        onClick={(e) => e.stopPropagation()} 
                                    />
                                ) : (
                                    <window.Icon name="file-text" size={120} className="text-white/10" />
                                )}
                            </div>
                        </div>

                        {/* Detaljpanel */}
                        <div className="w-full lg:w-[400px] h-[50vh] lg:h-full bg-white dark:bg-[#121826] flex flex-col shrink-0 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] pointer-events-auto lg:rounded-l-[32px] overflow-hidden animate-in slide-in-from-bottom lg:slide-in-from-right duration-300 rounded-t-[32px] lg:rounded-tr-none border-l border-zinc-200 dark:border-white/5">
                            
                            <div className="lg:hidden w-full flex justify-center pt-3 pb-1 cursor-pointer" onClick={handleClosePanel}>
                                <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full"></div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar">
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white leading-tight mb-4 tracking-tight">{selectedDoc.title}</h2>
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg ${FOLDERS.find(f => f.id === selectedDoc.category)?.bgClass || 'bg-zinc-100 dark:bg-white/5'} ${FOLDERS.find(f => f.id === selectedDoc.category)?.colorClass || 'text-zinc-500'}`}>
                                            <window.Icon name={FOLDERS.find(f => f.id === selectedDoc.category)?.icon || 'folder'} size={12} />
                                            {selectedDoc.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button onClick={() => openEdit(selectedDoc)} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 transition-all border border-zinc-200/50 dark:border-white/5 active:scale-95 shadow-sm">
                                        <window.Icon name="edit-2" size={18} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Redigera</span>
                                    </button>
                                    <button onClick={(e) => toggleFavorite(e, selectedDoc.id, selectedDoc.isFavorite)} className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl transition-all border active:scale-95 shadow-sm ${selectedDoc.isFavorite ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-200 dark:border-orange-500/20' : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-white/5 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-300 border-zinc-200/50 dark:border-white/5'}`}>
                                        <window.Icon name="star" size={18} className={selectedDoc.isFavorite ? "fill-current" : ""} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Bokmärk</span>
                                    </button>
                                    <button onClick={() => handleDelete(selectedDoc.id)} className="flex flex-col items-center justify-center gap-2 p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all border border-red-100 dark:border-red-500/10 active:scale-95 shadow-sm">
                                        <window.Icon name="trash-2" size={18} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Radera</span>
                                    </button>
                                </div>

                                {selectedDoc.text && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest flex items-center gap-1.5"><window.Icon name="align-left" size={14}/> Anteckningar</h4>
                                        <div className="text-[14px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-black/20 p-5 rounded-2xl border border-zinc-200/50 dark:border-white/5 shadow-inner">
                                            {selectedDoc.text}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedDoc.link && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-zinc-500 mb-3 uppercase tracking-widest flex items-center gap-1.5"><window.Icon name="link" size={14}/> Referenslänk</h4>
                                        <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 border border-blue-200 dark:border-blue-500/20 rounded-2xl text-[12px] font-bold text-blue-700 dark:text-blue-400 transition-colors group shadow-sm">
                                            <span className="truncate pr-4">{selectedDoc.link.replace(/^https?:\/\//, '')}</span>
                                            <window.Icon name="external-link" size={16} className="shrink-0 group-hover:scale-110 transition-transform" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UPPLADDNINGS-MODAL */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsUploadOpen(false)}></div>
                    <div className="relative bg-white dark:bg-[#1e293b] rounded-[32px] w-full max-w-lg shadow-2xl flex flex-col ring-1 ring-black/5 dark:ring-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        <div className="p-6 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-transparent">
                            <h2 className="text-[12px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white flex items-center gap-2">
                                <window.Icon name={formData.id ? "edit-2" : "upload-cloud"} size={16} className="text-orange-500" /> 
                                {formData.id ? 'Redigera Dokument' : 'Ladda upp till Drive'}
                            </h2>
                            <button onClick={() => setIsUploadOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 transition-colors"><window.Icon name="x" size={16} /></button>
                        </div>
                        
                        <form id="upload-form" onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                            
                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Filnamn / Titel</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-orange-500 transition-all placeholder:text-zinc-400 font-sans shadow-sm" placeholder="T.ex. Kamremsbyte Audi A4..." />
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Plats / Mapp</label>
                                <div className="flex flex-wrap gap-2">
                                    {FOLDERS.filter(f => !['ALLA', 'FAVORITER'].includes(f.id)).map(f => (
                                        <button 
                                            key={f.id} 
                                            type="button"
                                            onClick={() => setFormData({...formData, category: f.id})}
                                            className={`px-4 py-2.5 rounded-xl ring-1 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all ${formData.category === f.id ? `${f.bgClass} ${f.colorClass} ring-current/30 shadow-sm` : 'bg-white dark:bg-transparent text-zinc-600 dark:text-zinc-400 ring-zinc-200 dark:ring-white/10 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                                        >
                                            <window.Icon name={f.icon} size={14} /> {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Bild / Dokument (Klicka för att välja)</label>
                                <label className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[24px] cursor-pointer transition-all ${formData.file || formData.image ? 'border-orange-500/50 bg-orange-50/50 dark:bg-orange-500/5' : 'border-zinc-300 dark:border-white/10 hover:border-orange-400/50 hover:bg-zinc-50 dark:hover:bg-white/5'} text-zinc-500`}>
                                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, file: e.target.files[0]})} className="hidden" />
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors ${formData.file || formData.image ? 'bg-orange-500 text-white shadow-md' : 'bg-zinc-100 dark:bg-black/40 text-zinc-400'}`}>
                                        <window.Icon name={formData.file || formData.image ? "check" : "image"} size={24} />
                                    </div>
                                    <span className={`text-[11px] font-bold text-center uppercase tracking-widest ${formData.file || formData.image ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-500'}`}>
                                        {formData.file ? formData.file.name : (formData.image ? 'Bild vald. Klicka för att byta.' : 'Klicka för att välja fil från enhet')}
                                    </span>
                                </label>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Extern Länk (Valfritt)</label>
                                    <input type="url" value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-orange-500 transition-all font-mono placeholder:text-zinc-400 placeholder:font-sans shadow-sm" placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Anteckningar (Valfritt)</label>
                                    <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} rows="3" className="w-full p-4 bg-zinc-50 dark:bg-black/20 ring-1 ring-zinc-200 dark:ring-white/10 rounded-2xl text-[14px] text-zinc-900 dark:text-white focus:outline-none focus:ring-orange-500 transition-all resize-none placeholder:text-zinc-400 custom-scrollbar shadow-sm" placeholder="Instruktioner, dimensioner etc..."></textarea>
                                </div>
                            </div>
                        </form>

                        <div className="p-6 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-transparent">
                            <button form="upload-form" type="submit" disabled={uploading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-400 hover:to-orange-500 py-4 rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed">
                                {uploading ? <><window.Icon name="loader" size={18} className="animate-spin" /> Sparar...</> : <><window.Icon name="save" size={18} /> Spara i Drive</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
