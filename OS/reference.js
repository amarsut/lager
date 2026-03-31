// reference.js

const { useState, useEffect, useMemo } = React;

// --- IKONER (Google Drive Style) ---
const IconPlus = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconX = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconImage = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const IconFileText = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconFolder = ({ size = 24, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>;
const IconMore = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconChevronRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const IconLink = ({ size = 24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const IconLoader = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;
const IconEdit = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

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
        
        // Stäng menyer om man klickar utanför
        const handleClickOutside = () => setMenuOpenId(null);
        document.addEventListener('click', handleClickOutside);
        return () => { unsubscribe(); document.removeEventListener('click', handleClickOutside); };
    }, []);

    const filteredDocs = useMemo(() => {
        let filtered = docs;
        if (currentFolder !== 'ALLA') {
            filtered = filtered.filter(d => d.category === currentFolder);
        }
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(d => d.title?.toLowerCase().includes(q) || d.text?.toLowerCase().includes(q));
        }
        return filtered;
    }, [docs, currentFolder, searchQuery]);

    const handleEdit = (doc) => {
        setEditingId(doc.id); setNewTitle(doc.title); setNewCategory(doc.category); setNewText(doc.text || ''); setNewLink(doc.link || ''); setExistingImage(doc.image || null); setFile(null); setShowUploadModal(true); setMenuOpenId(null);
    };

    const handleDelete = async (doc) => { 
        if (!confirm("Vill du verkligen flytta dokumentet till papperskorgen?")) return; 
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
        if (!newTitle || !hasContent) return alert("Ange titel och minst en fil, text eller länk.");
        setUploading(true);
        try {
            let imageBase64 = existingImage; 
            if (file) { 
                imageBase64 = await compressReferenceImage(file); 
                if (imageBase64.length > 1048487) { alert("Filen är för stor."); setUploading(false); return; } 
            }
            const docData = { title: newTitle, category: newCategory, text: newText, link: newLink, image: imageBase64, timestamp: new Date().toISOString(), createdBy: window.firebase.auth().currentUser.email };
            if (editingId) await window.db.collection("reference_docs").doc(editingId).update(docData); 
            else await window.db.collection("reference_docs").add(docData);
            resetForm();
        } catch (error) { console.error("Save error:", error); alert("Kunde inte spara."); setUploading(false); }
    };

    return (
        <div className="flex flex-col min-h-screen bg-transparent text-zinc-900 dark:text-zinc-100 transition-colors duration-300 pb-0">
            
            {/* DRIVE HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 pb-4 border-b border-zinc-200 dark:border-white/5 gap-4 px-4 pt-2 lg:px-0 lg:pt-0 w-full">
                <div className="flex items-center gap-4 md:gap-5">
                    <div className="relative group cursor-default shrink-0">
                        <div className="absolute inset-0 bg-orange-500/40 blur-xl rounded-full transition-all duration-700 group-hover:bg-orange-500/60" />
                        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl border border-white/20 transition-colors bg-gradient-to-br from-orange-400 to-orange-600">
                            <IconFolder size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white uppercase tracking-tight leading-none">
                            DRIVE <span className="text-zinc-400 dark:text-zinc-500 font-light">REFERENCE</span>
                        </h1>
                        <p className="text-[10px] md:text-[11px] font-bold text-orange-500 dark:text-orange-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                            Dokument & Filer
                        </p>
                    </div>
                </div>
                
                {/* Sökfältet och knappen hamnar till höger här... */}
                <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500 group-focus-within:text-orange-500 transition-colors">
                            <IconSearch />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Sök i Drive..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white rounded-full py-3 pl-11 pr-4 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-sm transition-all text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>
                    <button 
                        onClick={() => { resetForm(); setShowUploadModal(true); }}
                        className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg rounded-full sm:rounded-2xl h-[46px] w-[46px] sm:w-auto sm:px-6 flex items-center justify-center gap-2 font-medium transition-all active:scale-95"
                    >
                        <IconPlus /> 
                        <span className="hidden sm:block text-[13px] tracking-wide">Nytt</span>
                    </button>
                </div>
            </div>

            {/* BREADCRUMBS */}
            <div className="px-5 lg:px-2 mb-6 flex items-center gap-2 text-[15px] font-medium text-zinc-700 dark:text-zinc-300">
                <span 
                    onClick={() => { setCurrentFolder('ALLA'); setSearchQuery(''); }}
                    className={`cursor-pointer hover:bg-zinc-100 dark:hover:bg-white/5 px-2 py-1 rounded-md transition-colors ${currentFolder === 'ALLA' ? 'text-zinc-900 dark:text-white font-bold' : ''}`}
                >
                    Min enhet
                </span>
                {currentFolder !== 'ALLA' && (
                    <>
                        <IconChevronRight />
                        <span className="text-zinc-900 dark:text-white font-bold px-2 py-1">{currentFolder}</span>
                    </>
                )}
            </div>

            <div className="px-5 lg:px-2 flex-1">
                {loading ? (
                    <div className="flex items-center gap-3 text-zinc-400 mt-10 ml-2 animate-pulse">
                        <IconLoader /> Laddar enhet...
                    </div>
                ) : (
                    <>
                        {/* FOLDERS SECTION */}
                        {currentFolder === 'ALLA' && searchQuery === '' && (
                            <div className="mb-8">
                                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 ml-1">Mappar</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {categories.map(cat => {
                                        const count = docs.filter(d => d.category === cat).length;
                                        return (
                                            <div 
                                                key={cat}
                                                onClick={() => setCurrentFolder(cat)}
                                                className="flex items-center p-3 bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl cursor-pointer hover:bg-zinc-50 dark:hover:bg-[#25324d] transition-all shadow-sm active:scale-[0.98] group"
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-zinc-100 dark:bg-[#0f1522] mr-3 group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-colors">
                                                    <IconFolder className="text-zinc-500 dark:text-zinc-400 group-hover:text-orange-500" size={22} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">{cat}</span>
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{count} filer</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* FILES SECTION */}
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-4 ml-1">
                                {searchQuery ? 'Sökresultat' : (currentFolder === 'ALLA' ? 'Filer' : `Filer i ${currentFolder}`)}
                            </h2>
                            
                            {filteredDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center mt-20 text-zinc-400 dark:text-zinc-600">
                                    <IconImage className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-sm font-medium">Inga filer hittades</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredDocs.map(doc => {
                                        const isImage = !!doc.image;
                                        const isLink = !!doc.link && !isImage;
                                        const isText = !!doc.text && !isImage && !isLink;
                                        
                                        // Kontrollerar om just detta korts meny är öppen
                                        const isMenuOpen = menuOpenId === doc.id;

                                        return (
                                            <div 
                                                key={doc.id} 
                                                onClick={() => setSelectedDoc(doc)}
                                                // FIX 1: Tog bort 'overflow-hidden'. Lade till dynamiskt z-index för att kortet med öppen meny alltid ligger överst.
                                                className={`group bg-white dark:bg-[#182032] border border-zinc-200 dark:border-white/5 rounded-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-[#1f2940] transition-all cursor-pointer relative flex flex-col h-[200px] ${isMenuOpen ? 'z-50 ring-2 ring-orange-500/50' : 'z-10 hover:z-20'}`}
                                            >
                                                {/* Thumbnail Area */}
                                                {/* FIX 2: Eftersom 'overflow-hidden' togs bort från föräldern, lägger vi till 'rounded-t-xl' här för att behålla runda hörn */}
                                                <div className="h-[140px] rounded-t-xl bg-zinc-100 dark:bg-[#0f1522] border-b border-zinc-100 dark:border-white/5 relative overflow-hidden flex items-center justify-center">
                                                    {isImage ? (
                                                        <img src={doc.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                                    ) : isLink ? (
                                                        <div className="text-blue-500 dark:text-blue-400 bg-white dark:bg-[#182032] p-4 rounded-full shadow-sm"><IconLink size={32} /></div>
                                                    ) : (
                                                        <div className="w-[80%] h-[80%] bg-white dark:bg-[#182032] rounded-md shadow-sm border border-zinc-200 dark:border-white/5 p-3 overflow-hidden">
                                                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-2"></div>
                                                            <div className="w-3/4 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-2"></div>
                                                            <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-2"></div>
                                                            <div className="w-1/2 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full"></div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Card Footer */}
                                                <div className="flex-1 p-3 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {isImage ? <IconImage className="text-orange-500 shrink-0" size={16} /> : 
                                                         isLink ? <IconLink className="text-blue-500 shrink-0" size={16} /> : 
                                                         <IconFileText className="text-blue-400 shrink-0" size={16} />}
                                                        <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-200 truncate">{doc.title}</span>
                                                    </div>
                                                    
                                                    {/* Context Menu */}
                                                    <div className="relative shrink-0">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === doc.id ? null : doc.id); }}
                                                            className={`p-1 rounded-full transition-colors ${isMenuOpen ? 'bg-zinc-200 dark:bg-white/10 text-zinc-900 dark:text-white' : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-white/10'}`}
                                                        >
                                                            <IconMore />
                                                        </button>
                                                        
                                                        {isMenuOpen && (
                                                            /* FIX 3: Gjorde menyn lite bredare (w-36) och säkerställde att den ligger riktigt snyggt */
                                                            <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-[#1f2940] rounded-lg shadow-2xl border border-zinc-200 dark:border-white/10 z-[100] py-1 animate-in fade-in zoom-in-95 origin-top-right">
                                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(doc); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-[12px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/5">
                                                                    Redigera
                                                                </button>
                                                                <div className="h-px bg-zinc-100 dark:bg-white/5 my-1"></div>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(doc); }} className="w-full flex items-center gap-2 text-left px-4 py-2 text-[12px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10">
                                                                    Ta bort
                                                                </button>
                                                            </div>
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

            {/* --- UPLOAD / EDIT MODAL --- */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={resetForm}>
                    <div className="bg-white dark:bg-[#182032] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{editingId ? 'Redigera fil' : 'Ny fil'}</h2>
                            <button onClick={resetForm} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"><IconX /></button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            <form id="drive-upload-form" onSubmit={handleSave} className="flex flex-col gap-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide ml-1">Filnamn / Titel *</label>
                                    <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="T.ex. Instruktionsbok V70" className="w-full p-3 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50" />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide ml-1">Mapplacering</label>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full p-3 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm font-medium text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 appearance-none">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide ml-1">Bifoga Bild</label>
                                    <div className="relative">
                                        <input type="file" id="file-upload" accept="image/*" onChange={e => setFile(e.target.files[0])} className="hidden" />
                                        <label htmlFor="file-upload" className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file || existingImage ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600' : 'border-zinc-300 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-500'}`}>
                                            <IconImage />
                                            <span className="text-sm font-medium truncate max-w-[200px]">{file ? file.name : (existingImage ? "Ny bild ersätter nuvarande" : "Klicka för att ladda upp")}</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide ml-1">Text / Noteringar</label>
                                    <textarea value={newText} onChange={e => setNewText(e.target.value)} placeholder="Skriv instruktioner här..." rows="3" className="w-full p-3 bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"></textarea>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide ml-1">Extern Länk</label>
                                    <div className="flex items-center bg-zinc-50 dark:bg-[#0f1522] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500/50">
                                        <div className="pl-3 text-zinc-400"><IconLink size={16} /></div>
                                        <input type="url" value={newLink} onChange={e => setNewLink(e.target.value)} placeholder="https://" className="w-full p-3 bg-transparent text-sm text-zinc-900 dark:text-white focus:outline-none" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-[#0f1522] flex justify-end gap-3">
                            <button onClick={resetForm} type="button" className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-lg transition-colors">Avbryt</button>
                            <button form="drive-upload-form" disabled={uploading} type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors shadow-sm flex items-center gap-2">
                                {uploading && <IconLoader />} {uploading ? 'Sparar...' : 'Spara'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- PREVIEW MODAL --- */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[9999] bg-zinc-900/95 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10 animate-in fade-in" onClick={() => setSelectedDoc(null)}>
                    
                    {/* Top bar like Drive */}
                    <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 text-white">
                            <div className="p-2 bg-white/10 rounded-md"><IconFileText size={20} /></div>
                            <span className="font-medium text-lg tracking-wide">{selectedDoc.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => { handleEdit(selectedDoc); setSelectedDoc(null); }} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Redigera"><IconEdit /></button>
                            <button onClick={() => setSelectedDoc(null)} className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"><IconX /></button>
                        </div>
                    </div>

                    <div className="max-w-5xl w-full h-full flex flex-col lg:flex-row items-center justify-center gap-6 mt-12" onClick={e => e.stopPropagation()}>
                        {selectedDoc.image && (
                            <div className="flex-1 flex items-center justify-center h-full max-h-[80vh]">
                                <img src={selectedDoc.image} className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm" />
                            </div>
                        )}
                        
                        {(selectedDoc.text || selectedDoc.link) && (
                            <div className={`bg-white dark:bg-[#182032] rounded-xl p-6 shadow-2xl overflow-y-auto max-h-[60vh] ${selectedDoc.image ? 'w-full lg:w-1/3' : 'w-full max-w-2xl'}`}>
                                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4 border-b border-zinc-200 dark:border-white/10 pb-2">Information</h3>
                                {selectedDoc.text && (
                                    <div className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed mb-6 font-mono">
                                        {selectedDoc.text}
                                    </div>
                                )}
                                {selectedDoc.link && (
                                    <a href={selectedDoc.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors border border-blue-200 dark:border-blue-500/20">
                                        <IconLink size={18} /> Öppna Extern Länk
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
