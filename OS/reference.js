// reference.js
const { useState, useEffect, useMemo } = React;

// --- PREMIUM IKONER (Skalad ner till korrekt storlek) ---
const Icons = {
    FolderOutline: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/></svg>,
    File: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>,
    Image: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>,
    Link: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    Search: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
    Plus: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
    X: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>,
    ChevronRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>,
    Star: ({ filled }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    Info: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>,
    Loader: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
};

const compressReferenceImage = async (file, maxWidth = 1200, quality = 0.75) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); 
                let { width, height } = img;
                if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
                canvas.width = width; canvas.height = height; 
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', quality));
            };
        };
        reader.onerror = reject;
    });
};

window.ReferenceView = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPath, setCurrentPath] = useState('root');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: '', category: 'OLJA', text: '', link: '', image: null, file: null });

    const folders = ['FAVORITER', 'OLJA', 'DÄCK', 'MANUALER', 'ÖVRIGT'];

    useEffect(() => {
        const unsubscribe = window.db.collection("reference_docs").orderBy("timestamp", "desc").onSnapshot(snap => {
            setDocs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); 
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const currentFiles = useMemo(() => {
        return docs.filter(d => {
            if (searchQuery) return (d.title + d.text + d.category).toLowerCase().includes(searchQuery.toLowerCase());
            if (currentPath === 'root') return false; 
            if (currentPath === 'FAVORITER') return d.isFavorite;
            return d.category === currentPath;
        });
    }, [docs, currentPath, searchQuery]);

    const handleClosePanel = () => setSelectedDoc(null);
    
    const openCreate = () => {
        setFormData({ id: null, title: '', category: currentPath !== 'root' && currentPath !== 'FAVORITER' ? currentPath : 'OLJA', text: '', link: '', image: null, file: null });
        setIsCreateModalOpen(true);
    };

    const openEdit = (doc) => {
        setFormData({ ...doc, file: null });
        setIsCreateModalOpen(true);
    };

    const toggleFavorite = async (e, docId, currentState) => {
        e.stopPropagation();
        try {
            await window.db.collection("reference_docs").doc(docId).update({ isFavorite: !currentState });
            if (selectedDoc?.id === docId) setSelectedDoc(prev => ({ ...prev, isFavorite: !currentState }));
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (docId) => {
        if (!confirm("Är du säker på att du vill radera filen permanent?")) return;
        try {
            await window.db.collection("reference_docs").doc(docId).delete();
            handleClosePanel();
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
            setIsCreateModalOpen(false);
        } catch (error) { alert("Fel vid sparning."); } 
        finally { setUploading(false); }
    };

    return (
        <div className="w-full pb-24 font-sans text-zinc-900 dark:text-zinc-100 animate-in fade-in">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                    {/* Logotyp - Tillbaka till standard 48px för exakt matchning */}
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-orange-500/30 blur-[8px] rounded-[14px] transform translate-y-1"></div>
                        <div className="relative w-[44px] h-[44px] md:w-[48px] md:h-[48px] bg-gradient-to-br from-orange-400 to-orange-500 rounded-[14px] flex items-center justify-center text-white shadow-sm border border-orange-400/50">
                            <Icons.FolderOutline />
                        </div>
                    </div>
                    {/* Rubrik - Nedskalad till standard text-xl/2xl */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-[20px] md:text-[22px] font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                            DRIVE<span className="font-light text-zinc-400 ml-1">WORKSPACE</span>
                        </h1>
                        <p className="text-[9px] md:text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            DOKUMENT & REFERENSER
                        </p>
                    </div>
                </div>

                {/* Nytt-knapp Desktop */}
                <div className="hidden md:block">
                    <button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 font-bold text-[11px] uppercase tracking-wide transition-all shadow-sm">
                        <Icons.Plus /> NYTT DOKUMENT
                    </button>
                </div>
            </div>

            {/* --- SÖKFÄLT --- */}
            <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Icons.Search />
                </div>
                <input 
                    type="text" 
                    placeholder="SÖK DOKUMENT, MAPPAR..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-white/10 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 text-zinc-900 dark:text-white rounded-xl py-3 pl-10 pr-4 text-sm font-medium transition-all outline-none shadow-sm"
                />
            </div>

            {/* --- BRÖDSMULOR --- */}
            <div className="flex items-center gap-2 mb-6 text-[10px] md:text-[11px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-white/5 pb-3">
                <button onClick={() => { setCurrentPath('root'); setSearchQuery(''); }} className="hover:text-zinc-900 dark:hover:text-white transition-colors">MIN ENHET</button>
                {currentPath !== 'root' && (
                    <>
                        <Icons.ChevronRight />
                        <span className="text-zinc-900 dark:text-white">{currentPath}</span>
                    </>
                )}
                {searchQuery && (
                    <>
                        <Icons.ChevronRight />
                        <span className="text-zinc-900 dark:text-white">SÖKRESULTAT</span>
                    </>
                )}
            </div>

            {/* --- INNEHÅLL --- */}
            {loading ? (
                <div className="flex justify-center p-10 text-zinc-400"><Icons.Loader /></div>
            ) : searchQuery ? (
                <div>
                    <h2 className="text-[10px] md:text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-widest">FILER</h2>
                    {currentFiles.length === 0 ? (
                        <div className="text-center text-sm font-medium text-zinc-400 py-10">Inga filer matchar sökningen.</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            {currentFiles.map(doc => <FileCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} toggleFav={toggleFavorite} />)}
                        </div>
                    )}
                </div>
            ) : currentPath === 'root' ? (
                <div>
                    <h2 className="text-[10px] md:text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-widest">MAPPAR</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
                        {folders.map(folder => {
                            const isFav = folder === 'FAVORITER';
                            return (
                                <div 
                                    key={folder} 
                                    onClick={() => setCurrentPath(folder)}
                                    className="group bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-white/10 rounded-2xl p-3 flex items-center gap-3 cursor-pointer hover:border-orange-500/50 transition-all shadow-sm"
                                >
                                    {isFav ? (
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                                            <Icons.Star filled />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-[#0f1115] flex items-center justify-center shrink-0 text-zinc-400">
                                            <Icons.FolderOutline />
                                        </div>
                                    )}
                                    <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wide truncate">{folder}</span>
                                </div>
                            );
                        })}
                    </div>
                    
                    <h2 className="text-[10px] md:text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-widest">SENASTE FILER</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {docs.slice(0, 6).map(doc => <FileCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} toggleFav={toggleFavorite} />)}
                    </div>
                </div>
            ) : (
                <div>
                    <h2 className="text-[10px] md:text-[11px] font-bold text-zinc-800 dark:text-zinc-200 mb-3 uppercase tracking-widest">
                        {currentPath === 'FAVORITER' ? 'DINA BOKMÄRKEN' : `FILER I ${currentPath}`}
                    </h2>
                    {currentFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-white/10 rounded-3xl border-dashed">
                            <div className="w-14 h-14 bg-zinc-50 dark:bg-[#222630] rounded-full flex items-center justify-center text-zinc-400 mb-3">
                                <Icons.File />
                            </div>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">MAPPEN ÄR TOM</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                            {currentFiles.map(doc => <FileCard key={doc.id} doc={doc} onClick={() => setSelectedDoc(doc)} toggleFav={toggleFavorite} />)}
                        </div>
                    )}
                </div>
            )}

            {/* --- DETALJPANEL --- */}
            {selectedDoc && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[90] transition-opacity backdrop-blur-sm" onClick={handleClosePanel}></div>
                    <div className="fixed top-0 right-0 z-[100] w-full md:w-[400px] h-full bg-white dark:bg-[#1a1d24] shadow-2xl flex flex-col animate-in slide-in-from-right">
                        
                        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#1a1d24]">
                            <h3 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 text-zinc-800 dark:text-white">
                                <Icons.Info /> DETALJER
                            </h3>
                            <button onClick={handleClosePanel} className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 transition-colors"><Icons.X /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 pb-32 space-y-6">
                            
                            <div className="bg-zinc-50 dark:bg-[#0f1115] rounded-2xl border border-zinc-200 dark:border-white/10 flex items-center justify-center overflow-hidden min-h-[180px]">
                                {selectedDoc.image ? (
                                    <img src={selectedDoc.image} className="w-full h-auto object-contain max-h-[300px]" />
                                ) : (
                                    <div className="text-zinc-300 dark:text-zinc-600"><Icons.File /></div>
                                )}
                            </div>

                            <div>
                                <h2 className="text-[20px] font-black text-zinc-900 dark:text-white leading-tight mb-2">{selectedDoc.title}</h2>
                                <span className="inline-block px-2.5 py-1 bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-widest rounded-md">
                                    {selectedDoc.category}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 border-y border-zinc-100 dark:border-white/5 py-4">
                                <button onClick={() => openEdit(selectedDoc)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-600 dark:text-zinc-300 transition-colors">
                                    <Icons.Plus /> <span className="text-[9px] font-bold uppercase tracking-widest">REDIGERA</span>
                                </button>
                                <button onClick={(e) => toggleFavorite(e, selectedDoc.id, selectedDoc.isFavorite)} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors ${selectedDoc.isFavorite ? 'text-orange-500' : 'text-zinc-600 dark:text-zinc-300'}`}>
                                    <Icons.Star filled={selectedDoc.isFavorite} /> <span className="text-[9px] font-bold uppercase tracking-widest">BOKMÄRK</span>
                                </button>
                                <button onClick={() => handleDelete(selectedDoc.id)} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 transition-colors">
                                    <Icons.X /> <span className="text-[9px] font-bold uppercase tracking-widest">RADERA</span>
                                </button>
                            </div>

                            {selectedDoc.text && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">ANTECKNINGAR</h4>
                                    <p className="text-[13px] text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap bg-zinc-50 dark:bg-[#0f1115] p-4 rounded-xl border border-zinc-100 dark:border-white/5 leading-relaxed">{selectedDoc.text}</p>
                                </div>
                            )}
                            {selectedDoc.link && (
                                <div>
                                    <h4 className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">EXTERN LÄNK</h4>
                                    <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3.5 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 dark:border-white/5 rounded-xl text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:underline">
                                        <Icons.Link /> ÖPPNA LÄNK
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* --- MOBIL FAB --- */}
            <button onClick={openCreate} className="md:hidden fixed bottom-24 right-4 z-[80] bg-orange-500 text-white rounded-[14px] p-4 shadow-xl shadow-orange-500/30 active:scale-95 flex items-center justify-center">
                <Icons.Plus />
            </button>

            {/* --- UPLOAD MODAL --- */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[110] bg-zinc-900/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-[#1a1d24] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-zinc-200 dark:border-white/10">
                        <div className="p-4 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-transparent">
                            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
                                {formData.id ? 'REDIGERA FIL' : 'LADDA UPP FIL'}
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500"><Icons.X /></button>
                        </div>
                        
                        <form id="upload-form" onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">FILNAMN</label>
                                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-orange-500/50 transition-all" />
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">PLATS / MAPP</label>
                                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none appearance-none">
                                    {folders.filter(f => f !== 'FAVORITER').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">BILD / DOKUMENT</label>
                                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors text-zinc-400">
                                    <input type="file" accept="image/*" onChange={e => setFormData({...formData, file: e.target.files[0]})} className="hidden" />
                                    <Icons.Image />
                                    <span className="text-[10px] font-bold mt-2 text-center text-zinc-500 uppercase tracking-widest">
                                        {formData.file ? formData.file.name : (formData.image ? 'NY BILD ERSÄTTER BEFINTLIG' : 'KLICKA FÖR ATT VÄLJA FIL')}
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">ANTECKNINGAR (VALFRITT)</label>
                                <textarea value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} rows="3" className="w-full p-3 bg-zinc-50 dark:bg-[#0f1115] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none resize-none"></textarea>
                            </div>
                        </form>

                        <div className="p-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-transparent flex justify-end">
                            <button form="upload-form" type="submit" disabled={uploading} className="w-full bg-orange-500 text-white hover:bg-orange-600 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md">
                                {uploading && <Icons.Loader />} SPARA FIL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- FIL-KORT KOMPONENT ---
const FileCard = ({ doc, onClick, toggleFav }) => {
    return (
        <div 
            onClick={onClick}
            className="group flex flex-col bg-white dark:bg-[#1a1d24] border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/50 transition-all shadow-sm h-40 md:h-48 relative"
        >
            <button 
                onClick={(e) => toggleFav(e, doc.id, doc.isFavorite)}
                className={`absolute top-2 right-2 z-10 p-1.5 rounded-lg backdrop-blur-md transition-all ${doc.isFavorite ? 'bg-orange-500/10 text-orange-500 opacity-100' : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'}`}
            >
                <Icons.Star filled={doc.isFavorite} />
            </button>

            <div className="h-[65%] bg-zinc-50 dark:bg-[#0f1115] border-b border-zinc-100 dark:border-white/5 flex items-center justify-center overflow-hidden">
                {doc.image ? (
                    <img src={doc.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                ) : (
                    <div className="text-zinc-300 dark:text-zinc-700">
                        <Icons.File />
                    </div>
                )}
            </div>

            <div className="flex-1 p-2 md:p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5">
                    <span className="shrink-0 text-zinc-400 dark:text-zinc-500 scale-75 md:scale-100">
                        {doc.image ? <Icons.Image /> : doc.link ? <Icons.Link /> : <Icons.File />}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate leading-tight">
                        {doc.title}
                    </span>
                </div>
            </div>
        </div>
    );
};
