// reference.js

const { useState, useEffect, useMemo } = React;

// --- IKONER (Google Drive Style) ---
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconImage = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const IconFileText = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconFolder = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>;
const IconMore = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const IconLink = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const IconLoader = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
// --- NYA IKONER FÖR FAVORITER & KOMMENTARER ---
const IconStar = ({ filled, className = "" }) => <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconMessage = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;

// --- BILDKOMPRIMERING ---
const compressReferenceImage = async (file, maxWidth = 1000, quality = 0.7) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image(); img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); let width = img.width; let height = img.height;
                if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
                canvas.width = width; canvas.height = height; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/webp', quality));
            };
        };
        reader.onerror = (error) => reject(error);
    });
};

window.ReferenceView = ({ setView }) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    
    // Drive State
    const [activeTab, setActiveTab] = useState('ALLA'); // 'ALLA' eller 'FAVORITER'
    const [currentFolder, setCurrentFolder] = useState('ALLA'); // 'ALLA' = Root
    const [searchQuery, setSearchQuery] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [menuOpenId, setMenuOpenId] = useState(null);

    // Form State
    const [editingId, setEditingId] = useState(null); 
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('OLJA');
    const [newText, setNewText] = useState(''); 
    const [newLink, setNewLink] = useState(''); 
    const [file, setFile] = useState(null);
    const [existingImage, setExistingImage] = useState(null); 

    const categories = ['OLJA', 'DÄCK', 'MANUALER', 'ÖVRIGT'];

    useEffect(() => {
        const unsubscribe = window.db.collection("reference_docs").orderBy("timestamp", "desc").limit(100).onSnapshot(snap => {
            setDocs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))); setLoading(false);
        });
        
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => { unsubscribe(); document.removeEventListener('click', handleClickOutside); };
    }, []);

    const filteredDocs = useMemo(() => {
        let filtered = docs;
        
        if (activeTab === 'FAVORITER') {
            filtered = filtered.filter(d => d.isFavorite);
        }
        if (currentFolder !== 'ALLA') {
            filtered = filtered.filter(d => d.category === currentFolder);
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(d => d.title?.toLowerCase().includes(q) || d.text?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q));
        }
        return filtered;
    }, [docs, currentFolder, searchQuery, activeTab]);

    const toggleFavorite = async (e, doc) => {
        e.stopPropagation(); // Förhindra att modalen öppnas
        try {
            await window.db.collection("reference_docs").doc(doc.id).update({ 
                isFavorite: !doc.isFavorite 
            });
        } catch (error) {
            console.error("Kunde inte uppdatera bokmärke:", error);
        }
    };

    const handleEdit = (doc) => {
        setEditingId(doc.id); setNewTitle(doc.title); setNewCategory(doc.category); setNewText(doc.text || ''); setNewLink(doc.link || ''); setExistingImage(doc.image || null); setFile(null); setShowUploadModal(true); setMenuOpenId(null);
    };

    const handleDelete = async (doc) => { 
        if (!confirm("Vill du verkligen ta bort dokumentet permanent?")) return; 
        try { 
            await window.db.collection("reference_docs").doc(doc.id).delete(); 
            if (selectedDoc?.id === doc.id) setSelectedDoc(null); 
        } catch (error) { console.error("Error deleting:", error); } 
        setMenuOpenId(null);
    };

    const resetForm = () => { setUploading(false); setShowUploadModal(false); setEditingId(null); setFile(null); setNewTitle(''); setNewText(''); setNewLink(''); setExistingImage(null); };

    const handleSave = async (e) => {
        e.preventDefault();
        const hasContent = file || newText.trim().length > 0 || existingImage || newLink.trim().length > 0;
        if (!newTitle || !hasContent) return alert("Ange titel och minst en fil, kommentar eller länk.");
        setUploading(true);
        try {
            let imageBase64 = existingImage; 
            if (file) { 
                imageBase64 = await compressReferenceImage(file); 
                if (imageBase64.length > 1048487) { alert("Filen är för stor."); setUploading(false); return; } 
            }
            const docData = { 
                title: newTitle, 
                category: newCategory, 
                text: newText, 
                link: newLink, 
                image: imageBase64, 
                timestamp: new Date().toISOString(), 
                createdBy: window.firebase.auth().currentUser.email 
            };
            
            if (editingId) {
                await window.db.collection("reference_docs").doc(editingId).update(docData); 
            } else {
                docData.isFavorite = false; // Standardvärde för nya
                await window.db.collection("reference_docs").add(docData);
            }
            resetForm();
        } catch (error) { console.error("Save error:", error); alert("Kunde inte spara."); setUploading(false); }
    };

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] md:min-h-screen bg-transparent text-zinc-900 dark:text-white pb-0 transition-colors duration-500 relative max-w-[1400px] ml-0 w-full animate-in fade-in slide-in-from-left-4">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-[-10%] w-[60%] h-[400px] bg-orange-500/10 dark:bg-orange-500/5 blur-[120px] rounded-full pointer-events-none -z-10 hidden lg:block"></div>

            <div className="px-4 pt-4 lg:px-0 lg:pt-0"> {/* Upplinjering! */}
                {/* TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-zinc-200/50 dark:border-white/5 gap-4">
                    {/* Titel & Logotyp */}
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative group cursor-default shrink-0">
                            <div className="absolute inset-0 bg-orange-500/40 blur-lg rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-md border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                                <IconFolder size={20} className="md:w-6 md:h-6" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                                WORK<span className="text-zinc-400 dark:text-zinc-500 font-light">SPACE</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <button 
                                    onClick={() => setActiveTab('ALLA')}
                                    className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeTab === 'ALLA' ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                >
                                    {activeTab === 'ALLA' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                                    Min Enhet
                                </button>
                                <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                <button 
                                    onClick={() => setActiveTab('FAVORITER')}
                                    className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 ${activeTab === 'FAVORITER' ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                                >
                                    {activeTab === 'FAVORITER' && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>}
                                    <IconStar size={10} filled={activeTab === 'FAVORITER'} /> Bokmärken
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sökfältet */}
                    <div className="flex-1 max-w-xl w-full">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-orange-500 transition-colors">
                                <IconSearch />
                            </div>
                            <input 
                                type="text" 
                                placeholder="Sök filer, kommentarer eller mappar..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-zinc-100/80 dark:bg-[#1a2332] border-none text-zinc-900 dark:text-white rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-inner transition-all text-sm placeholder:text-zinc-500"
                            />
                        </div>
                    </div>

                    {/* Skapa Ny-knapp (Desktop) */}
                    <button 
                        onClick={() => { resetForm(); setShowUploadModal(true); }}
                        className="hidden md:flex bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/30 rounded-xl px-5 py-2.5 items-center justify-center gap-2 font-semibold transition-all active:scale-95"
                    >
                        <IconPlus /> <span className="text-sm">Nytt Dokument</span>
                    </button>
                </div>
            </div>

            {/* HUVUDINNEHÅLL (Borttaget mx-auto för vänsterställning) */}
            <div className="px-4 md:px-8 max-w-7xl w-full flex-1">
                
                {/* BREADCRUMBS */}
                {activeTab === 'ALLA' && (
                    <div className="mb-6 flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 bg-white dark:bg-[#1a2332] w-fit px-4 py-2 rounded-lg shadow-sm border border-zinc-200 dark:border-white/5">
                        <span 
                            onClick={() => { setCurrentFolder('ALLA'); setSearchQuery(''); }}
                            className={`cursor-pointer hover:text-orange-500 transition-colors ${currentFolder === 'ALLA' ? 'text-zinc-900 dark:text-white font-bold' : ''}`}
                        >
                            Alla Mappar
                        </span>
                        {currentFolder !== 'ALLA' && (
                            <>
                                <IconChevronRight />
                                <span className="text-zinc-900 dark:text-white font-bold">{currentFolder}</span>
                            </>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center gap-3 text-zinc-400 mt-10 ml-2 animate-pulse font-medium">
                        <IconLoader /> Hämtar din arbetsyta...
                    </div>
                ) : (
                    <>
                        {/* FOLDERS SECTION */}
                        {activeTab === 'ALLA' && currentFolder === 'ALLA' && searchQuery === '' && (
                            <div className="mb-10">
                                <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                                    <IconFolder size={18} className="text-orange-500" /> Mappar
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {categories.map(cat => {
                                        const count = docs.filter(d => d.category === cat).length;
                                        return (
                                            <div 
                                                key={cat}
                                                onClick={() => setCurrentFolder(cat)}
                                                className="flex items-center p-4 bg-white dark:bg-[#1a2332] border border-zinc-200 dark:border-white/5 rounded-2xl cursor-pointer hover:shadow-md hover:border-orange-500/30 transition-all active:scale-[0.98] group"
                                            >
                                                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 mr-4 group-hover:scale-110 transition-transform">
                                                    <IconFolder className="text-orange-500" size={24} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 truncate">{cat}</span>
                                                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{count} filer</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FILES SECTION */}
                        <div>
                            <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
                                {activeTab === 'FAVORITER' ? <><IconStar size={18} className="text-orange-500" filled /> Dina Bokmärken</> : 
                                 searchQuery ? 'Sökresultat' : 
                                 (currentFolder === 'ALLA' ? 'Senaste Filer' : `Filer i ${currentFolder}`)}
                            </h2>
                            
                            {filteredDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-500 bg-white dark:bg-[#1a2332] rounded-3xl border border-dashed border-zinc-300 dark:border-white/10">
                                    {activeTab === 'FAVORITER' ? <IconStar size={48} className="mb-4 opacity-20" /> : <IconImage className="w-16 h-16 mb-4 opacity-20" />}
                                    <p className="text-sm font-medium">Inga filer hittades här.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                    {filteredDocs.map(doc => {
                                        const isImage = !!doc.image;
                                        const isLink = !!doc.link && !isImage;
                                        const hasText = !!doc.text;
                                        const isMenuOpen = menuOpenId === doc.id;

                                        return (
                                            <div 
                                                key={doc.id} 
                                                onClick={() => setSelectedDoc(doc)}
                                                className={`group bg-white dark:bg-[#1a2332] border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-lg transition-all cursor-pointer relative flex flex-col h-[220px] ${isMenuOpen ? 'z-50 ring-2 ring-orange-500/50' : 'z-10 hover:z-20 hover:-translate-y-1'}`}
                                            >
                                                {/* Favorit-knapp (Bokmärke) - Syns på hover eller om den är favorit */}
                                                <button 
                                                    onClick={(e) => toggleFavorite(e, doc)}
                                                    className={`absolute top-2 right-2 z-20 p-2 rounded-full backdrop-blur-md transition-all ${doc.isFavorite ? 'bg-orange-500/10 text-orange-500 opacity-100' : 'bg-black/20 text-white opacity-0 group-hover:opacity-100 hover:bg-black/40'}`}
                                                    title={doc.isFavorite ? "Ta bort bokmärke" : "Bokmärk"}
                                                >
                                                    <IconStar filled={doc.isFavorite} />
                                                </button>

                                                {/* Thumbnail Area */}
                                                <div className="h-[140px] rounded-t-2xl bg-zinc-50 dark:bg-[#0f1522] border-b border-zinc-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center">
                                                    {isImage ? (
                                                        <img src={doc.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    ) : isLink ? (
                                                        <div className="text-blue-500 bg-white dark:bg-[#182032] p-4 rounded-2xl shadow-sm"><IconLink size={32} /></div>
                                                    ) : (
                                                        <div className="w-[70%] h-[70%] bg-white dark:bg-[#182032] rounded-lg shadow-sm border border-zinc-200 dark:border-white/5 p-4 flex flex-col gap-2">
                                                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                                                            <div className="w-3/4 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                                                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                                                            <div className="w-1/2 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-auto"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Footer */}
                                                <div className="flex-1 p-3 flex flex-col justify-between">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                                            {isImage ? <IconImage className="text-orange-500 shrink-0" size={16} /> : 
                                                             isLink ? <IconLink className="text-blue-500 shrink-0" size={16} /> : 
                                                             <IconFileText className="text-blue-400 shrink-0" size={16} />}
                                                            <span className="text-[13px] font-bold text-zinc-800 dark:text-zinc-100 truncate" title={doc.title}>{doc.title}</span>
                                                        </div>
                                                        
                                                        {/* Context Menu */}
                                                        <div className="relative shrink-0">
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}
                                                                className={`p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10'}`}
                                                            >
                                                                <IconMore />
                                                            </button>
                                                            
                                                            {isMenuOpen && (
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#1f2940] rounded-xl shadow-2xl border border-zinc-200 dark:border-white/10 z-[100] py-1.5 animate-in fade-in zoom-in-95 origin-top-right">
                                                                    <button onClick={(e) => { e.stopPropagation(); handleEdit(doc); }} className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-[13px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5">
                                                                        <IconEdit /> Redigera
                                                                    </button>
                                                                    <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(doc); }} className="w-full flex items-center gap-3 text-left px-4 py-2.5 text-[13px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                                                                        <IconX /> Ta bort
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Meta-info radar (Kategori och kommentar-ikon) */}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-[#0f1522] text-zinc-500 dark:text-zinc-400">
                                                            {doc.category}
                                                        </span>
                                                        {hasText && (
                                                            <span className="text-zinc-400 flex items-center gap-1 text-[10px] font-medium" title="Innehåller kommentar/anteckning">
                                                                <IconMessage size={12} /> Anteckning
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Skapa Ny-knapp (Flytande FAB för Mobil) - UPPFLYTTAD TILL z-[100] & bottom-24 */}
            <button 
                onClick={() => { resetForm(); setShowUploadModal(true); }}
                className="md:hidden fixed bottom-24 right-6 z-[100] bg-orange-500 text-white rounded-full p-4 shadow-xl shadow-orange-500/40 active:scale-95 transition-transform flex items-center justify-center"
            >
                <IconPlus />
            </button>

            {/* --- UPLOAD / EDIT MODAL --- */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={resetForm}>
                    <div className="bg-white dark:bg-[#1a2332] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-transparent">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                {editingId ? <><IconEdit /> Redigera Dokument</> : <><IconPlus /> Skapa Nytt Dokument</>}
                            </h2>
                            <button onClick={resetForm} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10 dark:hover:text-white transition-colors"><IconX /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <form id="drive-upload-form" onSubmit={handleSave} className="flex flex-col gap-6">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Titel *</label>
                                    <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ange tydligt filnamn..." className="w-full p-3.5 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Mapp</label>
                                        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full p-3.5 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none cursor-pointer">
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Extern Länk</label>
                                        <input type="url" value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://..." className="w-full p-3.5 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">Bifoga Bild</label>
                                    <div className="relative">
                                        <input type="file" id="file-upload" accept="image/*" onChange={e => setFile(e.target.files[0])} className="hidden" />
                                        <label htmlFor="file-upload" className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${file || existingImage ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/5 text-orange-600' : 'border-zinc-300 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}>
                                            <IconImage />
                                            <span className="text-sm font-medium text-center">
                                                {file ? file.name : (existingImage ? "Ny bild ersätter nuvarande. Klicka för att ändra." : "Klicka eller dra för att ladda upp bild")}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                                        <IconMessage size={14} /> Anteckningar / Kommentarer
                                    </label>
                                    <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Lägg till viktig information, instruktioner eller kommentarer..." rows="4" className="w-full p-4 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none leading-relaxed"></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="p-5 border-t border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#121826]/50 flex justify-end gap-3">
                            <button onClick={resetForm} type="button" className="px-6 py-3 text-sm font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-colors">Avbryt</button>
                            <button form="drive-upload-form" disabled={uploading} type="submit" className="px-8 py-3 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
                                {uploading && <IconLoader />} {uploading ? 'Sparar...' : 'Spara Dokument'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREVIEW MODAL (UPPDATERAD, CLEAN DESIGN) --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[9999] bg-black/50 dark:bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedDoc(null)}>
                    
                    {/* Dynamisk kort-layout beroende på om bild finns */}
                    <div className={`w-full flex flex-col bg-white dark:bg-[#182032] rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-white/10 ${selectedDoc.image ? 'max-w-6xl md:h-[80vh] flex-col lg:flex-row' : 'max-w-3xl'}`} onClick={e => e.stopPropagation()}>
                        
                        {/* Bildsektion (Visas bara om bild finns) */}
                        {selectedDoc.image && (
                            <div className="flex-1 bg-zinc-50 dark:bg-[#0f1522] p-4 md:p-8 flex items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-white/5">
                                <img src={selectedDoc.image} className="max-w-full max-h-full object-contain drop-shadow-md rounded-lg" />
                            </div>
                        )}
                        
                        {/* Info/Antecknings-sektion */}
                        <div className={`flex flex-col ${selectedDoc.image ? 'w-full lg:w-[400px] shrink-0' : 'w-full'}`}>
                            
                            {/* Top bar inne i kortet */}
                            <div className="p-5 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-zinc-50/50 dark:bg-[#1a2332]">
                                <div className="flex items-center gap-4 min-w-0 pr-4">
                                    <div className="p-2.5 bg-white dark:bg-[#252f43] rounded-xl shadow-sm border border-zinc-100 dark:border-white/5 shrink-0">
                                        <IconFileText size={22} className="text-zinc-700 dark:text-zinc-300" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="font-bold text-lg text-zinc-900 dark:text-white truncate leading-tight">{selectedDoc.title}</span>
                                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold tracking-wide uppercase">{selectedDoc.category}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={(e) => toggleFavorite(e, selectedDoc)} className={`p-2 rounded-lg transition-colors ${selectedDoc.isFavorite ? 'text-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-white/10'}`} title="Bokmärk">
                                        <IconStar filled={selectedDoc.isFavorite} />
                                    </button>
                                    <button onClick={() => { handleEdit(selectedDoc); setSelectedDoc(null); }} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors" title="Redigera">
                                        <IconEdit />
                                    </button>
                                    <div className="w-px h-5 bg-zinc-200 dark:bg-white/10 mx-1"></div>
                                    <button onClick={() => setSelectedDoc(null)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-white dark:hover:bg-red-500/20 rounded-lg transition-colors">
                                        <IconX />
                                    </button>
                                </div>
                            </div>

                            {/* Anteckningar innehåll */}
                            <div className="p-6 overflow-y-auto flex-1 bg-white dark:bg-[#182032]">
                                {selectedDoc.text ? (
                                    <div className="mb-6">
                                        <h3 className="text-[11px] font-bold text-orange-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <IconMessage size={14} /> Anteckningar
                                        </h3>
                                        <div className="bg-zinc-50 dark:bg-[#121826] border border-zinc-100 dark:border-white/5 rounded-xl p-5 shadow-sm">
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-medium">
                                                {selectedDoc.text}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-sm italic">Inga anteckningar tillagda.</div>
                                )}
                                
                                {selectedDoc.link && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-3">Bifogad Länk</h3>
                                        <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-blue-500/10 text-zinc-700 dark:text-blue-400 font-semibold rounded-xl hover:bg-zinc-100 dark:hover:bg-blue-500/20 transition-colors border border-zinc-200 dark:border-blue-500/20 group">
                                            <span className="truncate pr-4 text-sm">Öppna Extern Länk</span>
                                            <IconLink size={18} className="text-zinc-400 dark:text-blue-400 group-hover:scale-110 transition-transform" className="" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
