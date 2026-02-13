const { useState, useEffect } = React;

// --- 1. SÄKRA IKONER ---
const IconPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconX = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconImage = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>;
const IconFileText = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const IconTrash = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const IconEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const IconLoader = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>;
const IconFolder = () => <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>;
const IconCloseLarge = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconLink = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const IconExternalLink = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>;

// --- 2. KOMPRIMERING ---
const compressReferenceImage = async (file, maxWidth = 1000, quality = 0.7) => {
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

window.ReferenceView = ({ setView }) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [filter, setFilter] = useState('ALLA');
    const [showUpload, setShowUpload] = useState(false);
    
    // State för formulär
    const [editingId, setEditingId] = useState(null); 
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('OLJA');
    const [newText, setNewText] = useState(''); 
    const [newLink, setNewLink] = useState(''); // NYTT: Länk-state
    const [file, setFile] = useState(null);
    const [existingImage, setExistingImage] = useState(null); 

    const categories = ['OLJA', 'DÄCK', 'MANUALER', 'ÖVRIGT'];

    // --- HÄMTA DATA ---
    useEffect(() => {
        const unsubscribe = window.db.collection("reference_docs")
            .orderBy("timestamp", "desc")
            .limit(50) 
            .onSnapshot(snap => {
                const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDocs(data);
                setLoading(false);
            });
        return () => unsubscribe();
    }, []);

    // --- FÖRBERED REDIGERING ---
    const handleEdit = (doc) => {
        setEditingId(doc.id);
        setNewTitle(doc.title);
        setNewCategory(doc.category);
        setNewText(doc.text || '');
        setNewLink(doc.link || ''); // Hämta länk om det finns
        setExistingImage(doc.image || null);
        setFile(null);
        setShowUpload(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- SPARA / UPPDATERA ---
    const handleSave = async (e) => {
        e.preventDefault();
        // Validering: Måste ha innehåll av något slag
        const hasContent = file || newText.trim().length > 0 || existingImage || newLink.trim().length > 0;
        if (!newTitle || !hasContent) return alert("Ange titel och minst en bild, text eller länk.");

        setUploading(true);

        try {
            let imageBase64 = existingImage; 

            if (file) {
                imageBase64 = await compressReferenceImage(file);
                if (imageBase64.length > 1048487) {
                    alert("Bilden är för stor.");
                    setUploading(false);
                    return;
                }
            }

            const docData = {
                title: newTitle.toUpperCase(),
                category: newCategory,
                text: newText,
                link: newLink, // Sparar länken
                image: imageBase64,
                timestamp: new Date().toISOString(), 
                createdBy: window.firebase.auth().currentUser.email
            };

            if (editingId) {
                await window.db.collection("reference_docs").doc(editingId).update(docData);
            } else {
                await window.db.collection("reference_docs").add(docData);
            }

            resetForm();

        } catch (error) {
            console.error("Save error:", error);
            alert("Kunde inte spara dokumentet.");
            setUploading(false);
        }
    };

    const resetForm = () => {
        setUploading(false);
        setShowUpload(false);
        setEditingId(null);
        setFile(null);
        setNewTitle('');
        setNewText('');
        setNewLink('');
        setExistingImage(null);
    };

    const handleDelete = async (doc) => {
        if (!confirm("Radera detta dokument permanent?")) return;
        try {
            await window.db.collection("reference_docs").doc(doc.id).delete();
            if (selectedDoc?.id === doc.id) setSelectedDoc(null);
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const filteredDocs = filter === 'ALLA' ? docs : docs.filter(d => d.category === filter);

    return (
        <div className="bg-[#f4f4f5] font-sans min-h-full pb-20">
            
            {/* HEADER */}
            <div className="bg-white border-b border-zinc-200 px-5 py-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900 leading-none mb-1">Referensbibliotek</h1>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Dokumentation & Specs</p>
                    </div>
                    
                    <button 
                        onClick={() => {
                            if(showUpload) resetForm();
                            else setShowUpload(true);
                        }} 
                        className={`w-full sm:w-auto px-5 py-3 rounded-[2px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm
                        ${showUpload ? 'bg-zinc-100 text-zinc-800 border border-zinc-200' : 'bg-black text-white hover:bg-zinc-800'}`}
                    >
                        {showUpload ? <IconX /> : <IconPlus />}
                        {showUpload ? "Stäng panel" : "Nytt Dokument"}
                    </button>
                </div>

                {/* FORMULÄR */}
                {showUpload && (
                    <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-md shadow-inner animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {editingId ? "Redigera dokument" : "Nytt dokument"}
                            </h3>
                            {editingId && (
                                <button onClick={resetForm} className="text-[9px] font-bold text-red-500 uppercase hover:underline">Avbryt redigering</button>
                            )}
                        </div>

                        <form onSubmit={handleSave} className="flex flex-col gap-4">
                            {/* TITEL */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Titel</label>
                                <input 
                                    type="text" 
                                    placeholder="T.EX. CASTROL 5W-30" 
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full p-3 text-xs font-bold border border-zinc-300 rounded-[2px] uppercase focus:border-black focus:ring-0 outline-none transition-all"
                                />
                            </div>

                            {/* TEXT / ANTECKNINGAR */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Anteckningar</label>
                                <textarea 
                                    placeholder="Specifikationer eller noteringar..." 
                                    value={newText}
                                    onChange={e => setNewText(e.target.value)}
                                    rows={3}
                                    className="w-full p-3 text-xs border border-zinc-300 rounded-[2px] focus:border-black focus:ring-0 outline-none transition-all resize-none"
                                />
                            </div>

                            {/* EXTERN LÄNK (NYTT) */}
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Extern Länk / URL</label>
                                <div className="flex items-center bg-white border border-zinc-300 rounded-[2px] px-3 transition-all focus-within:border-black">
                                    <span className="text-zinc-400 shrink-0 mr-2"><IconLink /></span>
                                    <input 
                                        type="url" 
                                        placeholder="https://..." 
                                        value={newLink}
                                        onChange={e => setNewLink(e.target.value)}
                                        className="w-full py-3 text-xs font-mono border-none outline-none bg-transparent"
                                    />
                                </div>
                            </div>

                            {/* KATEGORI & BILD */}
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Kategori & Bild</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <select 
                                        value={newCategory} 
                                        onChange={e => setNewCategory(e.target.value)}
                                        className="p-3 text-xs font-bold border border-zinc-300 rounded-[2px] uppercase sm:w-1/3 focus:border-black outline-none bg-white h-[42px]"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            id="ref-file-upload"
                                            accept="image/*"
                                            onChange={e => setFile(e.target.files[0])}
                                            className="hidden" 
                                        />
                                        <label 
                                            htmlFor="ref-file-upload" 
                                            className={`flex items-center justify-center gap-2 px-3 h-[42px] border rounded-[2px] cursor-pointer transition-all w-full
                                            ${(file || existingImage) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100'}`}
                                        >
                                            {(file || existingImage) ? <IconCheck /> : <IconImage />}
                                            <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                                {file ? file.name : (existingImage ? "Bild finns (klicka för att byta)" : "Välj bild (valfritt)")}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <button disabled={uploading} className={`mt-2 font-black h-[46px] text-xs uppercase rounded-[2px] w-full transition-all flex items-center justify-center gap-2 ${uploading ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm'}`}>
                                {uploading && <IconLoader />}
                                {uploading ? "Bearbetar..." : (editingId ? "Uppdatera Dokument" : "Spara Dokument")}
                            </button>
                        </form>
                    </div>
                )}

                {/* FILTERS */}
                <div className="flex gap-2 overflow-x-auto pb-1 pt-1 border-t border-zinc-100" style={{scrollbarWidth: 'none'}}>
                    <button onClick={() => setFilter('ALLA')} className={`shrink-0 px-4 py-2 text-[10px] font-black uppercase rounded-[2px] border transition-all ${filter === 'ALLA' ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200'}`}>Alla</button>
                    {categories.map(c => (
                        <button key={c} onClick={() => setFilter(c)} className={`shrink-0 px-4 py-2 text-[10px] font-black uppercase rounded-[2px] border transition-all ${filter === c ? 'bg-black text-white border-black' : 'bg-white text-zinc-500 border-zinc-200'}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* CONTENT GRID */}
            <div className="p-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-400 animate-pulse mt-10">
                         <IconLoader />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Laddar arkiv...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredDocs.map(doc => {
                            const hasImage = !!doc.image;
                            const hasText = !!doc.text;
                            const hasLink = !!doc.link; // Check om länk finns

                            return (
                                <div key={doc.id} className="group bg-white border border-zinc-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all relative flex flex-col h-full">
                                    
                                    {/* Action Buttons */}
                                    <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-all">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(doc); }}
                                            className="bg-black/60 hover:bg-blue-600 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm"
                                        >
                                            <IconEdit />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                                            className="bg-black/60 hover:bg-red-600 text-white w-7 h-7 flex items-center justify-center rounded-full backdrop-blur-sm"
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>

                                    {/* Content Area */}
                                    <div 
                                        onClick={() => setSelectedDoc(doc)}
                                        className="aspect-[3/4] overflow-hidden cursor-pointer relative bg-zinc-50"
                                    >
                                        {hasImage ? (
                                            <>
                                                <img src={doc.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-12">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-white uppercase tracking-wider bg-orange-500 px-1.5 py-0.5 rounded-[2px] shadow-sm">
                                                            {doc.category}
                                                        </span>
                                                        {hasText && <div className="bg-white/20 text-white p-1 rounded-sm"><IconFileText /></div>}
                                                        {hasLink && <div className="bg-blue-500/80 text-white p-1 rounded-sm"><IconLink /></div>}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            /* TEXT ONLY LAYOUT */
                                            <div className="w-full h-full flex flex-col relative p-4">
                                                <div className="absolute top-3 right-3">
                                                    <span className="text-[8px] font-black text-zinc-400 uppercase bg-zinc-200/50 px-2 py-1 rounded-[2px]">
                                                        {doc.category}
                                                    </span>
                                                </div>

                                                <div className="flex-1 flex items-center justify-center pt-6 pb-6 overflow-hidden">
                                                    <p className="text-xs font-bold text-zinc-700 text-center leading-relaxed break-words line-clamp-[8]">
                                                        "{doc.text}"
                                                    </p>
                                                </div>

                                                <div className="flex justify-center items-center gap-2 text-zinc-300 pb-1">
                                                    <IconFileText />
                                                    {hasLink && <span className="text-blue-400"><IconLink /></span>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Footer */}
                                    <div className="p-3 bg-white mt-auto border-t border-zinc-100">
                                        <h3 className="text-[11px] font-black uppercase leading-tight text-zinc-900 truncate">{doc.title}</h3>
                                        <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-tight">{new Date(doc.timestamp).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                
                {!loading && filteredDocs.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-20 text-zinc-300">
                        <IconFolder />
                        <span className="text-[10px] font-black uppercase tracking-widest mt-2">Tomt i denna kategori</span>
                    </div>
                )}
            </div>

            {/* LIGHTBOX / MODAL */}
            {selectedDoc && (
                <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedDoc(null)}>
                    <button className="absolute top-4 right-4 text-white p-3 hover:bg-white/10 rounded-full transition-colors active:scale-95 z-50">
                        <IconCloseLarge />
                    </button>
                    
                    <div 
                        className="max-w-4xl w-full max-h-full flex flex-col items-center overflow-y-auto custom-scrollbar p-4" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Om det finns bild */}
                        {selectedDoc.image && (
                            <img 
                                src={selectedDoc.image} 
                                className="max-w-full max-h-[60vh] rounded-lg shadow-2xl border border-white/10 animate-in zoom-in duration-300 mb-6" 
                            />
                        )}

                        {/* Text / Info Box */}
                        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300">
                            <h2 className="text-white font-black uppercase tracking-widest text-lg mb-2">{selectedDoc.title}</h2>
                            
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-orange-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-orange-400/10 rounded-[2px]">
                                    {selectedDoc.category}
                                </span>
                                <span className="text-zinc-500 text-[10px] font-mono uppercase">
                                    | {new Date(selectedDoc.timestamp).toLocaleString()}
                                </span>
                            </div>

                            {/* LÄNK-KNAPP (NYTT) */}
                            {selectedDoc.link && (
                                <div className="mb-4">
                                    <a 
                                        href={selectedDoc.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-[2px] text-xs font-black uppercase tracking-wider w-full justify-center transition-colors"
                                    >
                                        <IconExternalLink />
                                        Öppna extern länk
                                    </a>
                                </div>
                            )}

                            {selectedDoc.text && (
                                <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed border-t border-zinc-800 pt-4 font-mono">
                                    {selectedDoc.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
