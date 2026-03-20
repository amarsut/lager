import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-storage.js";
import { db, storage, AppState, showToast } from "./core.js";

AppState.docViewMode = localStorage.getItem('bmg_drive_view') || 'grid'; 
AppState.docFilter = 'all';
AppState.docSort = 'name';
AppState.docSearchQuery = '';
AppState.currentFolderId = 'root';
AppState.folderPath = [{ id: 'root', name: 'Min Drive' }];
AppState.selectedDocs = new Set();
let allDocuments = [];

export function initDocuments() {
    startDocListener();
    setupDocumentListeners();
    setupDragAndDrop();
    setupContextMenu();
    updateViewToggleUI();
    updateFilterButtonsUI();
}

function startDocListener() {
    onSnapshot(collection(db, "documents"), snap => {
        allDocuments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // VIKTIGT: Gör dokumenten synliga för Spotlight-sökmotorn!
        if (!window.AppState) window.AppState = {};
        window.AppState.documents = allDocuments;
        
        renderDrive();
    });
}

function getFileIcon(type, name) {
    const ext = name.split('.').pop().toLowerCase();
    if(type === 'folder') return `<i data-lucide="folder" class="w-full h-full text-slate-400 fill-slate-100 dark:fill-slate-800"></i>`;
    if(type.includes('image')) return `<i data-lucide="image" class="w-full h-full text-purple-500"></i>`;
    if(type.includes('pdf') || ext === 'pdf') return `<i data-lucide="file-text" class="w-full h-full text-red-500"></i>`;
    if(ext === 'xls' || ext === 'xlsx' || ext === 'csv') return `<i data-lucide="sheet" class="w-full h-full text-emerald-500"></i>`;
    if(ext === 'doc' || ext === 'docx') return `<i data-lucide="file-type-2" class="w-full h-full text-blue-500"></i>`;
    return `<i data-lucide="file" class="w-full h-full text-brand-500"></i>`;
}

function renderDrive() {
    updateStorageMeter();
    renderBreadcrumbs();
    
    let visibleDocs = allDocuments.filter(d => {
        const isTrashed = !!d.trashed;
        
        // 1. Är vi i Papperskorgen?
        if(AppState.docFilter === 'trash') {
            if(AppState.docSearchQuery) return isTrashed && d.name.toLowerCase().includes(AppState.docSearchQuery.toLowerCase());
            return isTrashed;
        }

        // 2. I alla andra vyer, dölj filer som är i papperskorgen!
        if(isTrashed) return false;

        // 3. Vanlig filtrering
        if(AppState.docSearchQuery) {
            return d.name.toLowerCase().includes(AppState.docSearchQuery.toLowerCase());
        }
        if(AppState.docFilter === 'starred') return d.pinned;
        if(AppState.docFilter !== 'all') return d.category === AppState.docFilter && d.type !== 'folder';
        
        return (d.parentId || 'root') === AppState.currentFolderId;
    });

    visibleDocs.sort((a, b) => {
        if (AppState.docSort === 'newest') return b.createdAt - a.createdAt;
        if (AppState.docSort === 'size') return (b.size || 0) - (a.size || 0);
        return a.name.localeCompare(b.name);
    });

    const folders = visibleDocs.filter(d => d.type === 'folder');
    const files = visibleDocs.filter(d => d.type !== 'folder');
    const pinnedFiles = allDocuments.filter(d => d.pinned && d.type !== 'folder' && !d.trashed);

    const quickAccessArea = document.getElementById('quickAccessArea');
    if(AppState.currentFolderId === 'root' && AppState.docFilter === 'all' && !AppState.docSearchQuery && pinnedFiles.length > 0) {
        quickAccessArea.classList.remove('hidden');
        document.getElementById('quickAccessList').innerHTML = pinnedFiles.map(d => generateQuickAccessCard(d)).join('');
    } else {
        quickAccessArea.classList.add('hidden');
    }

    const foldersArea = document.getElementById('foldersArea');
    if(folders.length > 0 && AppState.docFilter === 'all' && !AppState.docSearchQuery) {
        foldersArea.classList.remove('hidden');
        document.getElementById('foldersList').innerHTML = folders.map(f => generateFolderCard(f)).join('');
    } else {
        foldersArea.classList.add('hidden');
    }

    const filesTitle = document.getElementById('filesTitle');
    const docList = document.getElementById('docList');
    
    if(folders.length > 0 || pinnedFiles.length > 0) filesTitle.classList.remove('hidden');
    else filesTitle.classList.add('hidden');

    if (files.length === 0 && folders.length === 0) {
        docList.className = "flex-1 flex items-center justify-center h-full min-h-[400px]";
        
        const emptyTitle = AppState.docFilter === 'trash' ? 'Papperskorgen är tom' : 'Det ekar tomt här';
        const emptySub = AppState.docFilter === 'trash' ? 'Här hamnar raderade filer.' : 'Dra in filer eller skapa en ny mapp.';
        const emptyIcon = AppState.docFilter === 'trash' ? 'trash-2' : 'ghost';

        docList.innerHTML = `
            <div class="text-center text-slate-400 dark:text-slate-600 flex flex-col items-center gap-4 opacity-70 mt-10">
                <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <i data-lucide="${emptyIcon}" class="w-12 h-12"></i>
                </div>
                <div>
                    <h3 class="text-lg font-black text-slate-700 dark:text-slate-300">${emptyTitle}</h3>
                    <p class="text-sm font-medium mt-1">${emptySub}</p>
                </div>
            </div>`;
    } else {
        if (AppState.docViewMode === 'grid') {
            docList.className = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 p-1 min-w-0";
        } else {
            docList.className = "space-y-1 min-w-0 w-full";
        }
        docList.innerHTML = files.map(d => generateFileCard(d)).join('');
    }

    // Dölj listorna snabbt för att undvika flicker
    const docScrollArea = document.getElementById('docListScrollArea');
    if (docScrollArea) docScrollArea.style.opacity = '0';

    if (window.lucide) window.lucide.createIcons();
    updateActionBar();

    // Fadea in allt mjukt efter att webbläsaren fått rita upp layouten och ikonerna
    setTimeout(() => {
        if (docScrollArea) {
            docScrollArea.style.transition = 'opacity 0.15s ease-in-out';
            docScrollArea.style.opacity = '1';
        }
    }, 50);
}

function renderBreadcrumbs() {
    const nav = document.getElementById('breadcrumbNav');
    if(!nav) return;
    
    if(AppState.docSearchQuery) {
        nav.innerHTML = `<span class="text-brand-500">Sökresultat för "${AppState.docSearchQuery}"</span>`;
        return;
    }
    if(AppState.docFilter !== 'all') {
        const filterNames = { starred: 'Stjärnmarkerat', trash: 'Papperskorg', avtal: 'Avtal & Kontrakt', bilder: 'Media & Bilder', varudeklaration: 'Varudeklarationer' };
        nav.innerHTML = `<span class="text-slate-500 font-black">${filterNames[AppState.docFilter] || ''}</span>`;
        return;
    }

    nav.innerHTML = AppState.folderPath.map((f, index) => {
        const isLast = index === AppState.folderPath.length - 1;
        return `
            <div class="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button onclick="window.navigateToFolder('${f.id}', ${index})" class="${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-brand-500'} transition-colors outline-none font-black">${f.name}</button>
                ${!isLast ? '<i data-lucide="chevron-right" class="w-3.5 h-3.5 text-slate-300 dark:text-slate-700"></i>' : ''}
            </div>
        `;
    }).join('');
    if (window.lucide) window.lucide.createIcons({root: nav});
}

function getThreeDotsBtn(id) {
    return `
    <button type="button" onclick="window.openDocMenu(event, '${id}')" class="absolute top-2 right-2 z-30 p-2 sm:p-1.5 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-[#FAFAFA]/90 dark:bg-slate-800/90 hover:bg-[#FAFAFA] dark:hover:bg-slate-700 backdrop-blur-sm rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-all outline-none cursor-pointer">
        <i data-lucide="more-vertical" class="w-5 h-5 sm:w-4 sm:h-4 pointer-events-none"></i>
    </button>`;
}

function generateFolderCard(folder) {
    const isSelected = AppState.selectedDocs.has(folder.id);
    const bgClass = isSelected ? 'bg-brand-50 dark:bg-brand-500/10 border-brand-300 dark:border-brand-500/50' : 'bg-[#FAFAFA] dark:bg-[#1e293b] border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50';
    
    return `
    <div class="doc-item flex items-center justify-between p-4 rounded border ${bgClass} transition-all cursor-pointer group select-none relative shadow-lg" 
         data-id="${folder.id}" data-type="folder" onclick="if(!event.target.closest('button') && !event.target.closest('input')) { window.openFolder('${folder.id}', '${folder.name}'); }">
        
        <div class="absolute top-1/2 -translate-y-1/2 left-3 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''} z-20">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="window.toggleSelection(event, '${folder.id}')" class="w-4 h-4 accent-brand-500 cursor-pointer bg-[#FAFAFA] rounded shadow-sm">
        </div>

        ${getThreeDotsBtn(folder.id)}
        
        <div class="flex items-center gap-3 min-w-0 flex-1 pl-1 group-hover:pl-7 transition-all duration-200 ${isSelected ? 'pl-7' : ''}">
            <div class="w-6 h-6 shrink-0 pointer-events-none text-slate-400 dark:text-slate-500">
                <i data-lucide="folder" class="w-full h-full fill-current"></i>
            </div>
            <div class="font-bold text-sm text-slate-800 dark:text-white truncate pointer-events-none group-hover:text-brand-500 transition-colors">${folder.name}</div>
        </div>
    </div>`;
}

function generateQuickAccessCard(file) {
    const isImage = file.type.includes('image');
    const isPDF = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    const isSelected = AppState.selectedDocs.has(file.id);
    const bgClass = isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50';
    
    let previewContent = '';
    if (isImage) {
        previewContent = `<img src="${file.url}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`;
    } else if (isPDF) {
        previewContent = `<iframe src="${file.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH" loading="lazy" class="w-full h-full pointer-events-none bg-[#FAFAFA]" style="transform: scale(1.1); transform-origin: top center;" tabindex="-1" scrolling="no"></iframe>`;
    } else {
        previewContent = `<div class="w-12 h-12">${getFileIcon(file.type, file.name)}</div>`;
    }

    return `
    <div class="doc-item w-48 sm:w-64 shrink-0 bg-[#FAFAFA] dark:bg-[#1e293b] border ${bgClass} rounded shadow-lg overflow-hidden cursor-pointer group transition-all relative snap-start" 
         data-id="${file.id}" data-type="file" onclick="if(!event.target.closest('button') && !event.target.closest('input')) { window.previewDoc('${file.url}', '${file.type}', '${file.name}', '${file.id}', ${!!file.pinned}); }">
        
        <div class="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="window.toggleSelection(event, '${file.id}')" class="w-4 h-4 accent-brand-500 bg-[#FAFAFA] rounded shadow-sm cursor-pointer">
        </div>

        ${getThreeDotsBtn(file.id)}

        <div class="h-32 sm:h-36 bg-slate-50 dark:bg-[#0f172a] relative overflow-hidden flex items-center justify-center pointer-events-none border-b border-slate-200 dark:border-slate-800/60">
            ${previewContent}
            ${isPDF ? `<div class="absolute inset-0 bg-transparent z-10"></div>` : ''} 
        </div>
        <div class="p-3 bg-transparent pointer-events-none flex items-center gap-3">
            <div class="w-5 h-5 shrink-0">${getFileIcon(file.type, file.name)}</div>
            <div class="flex-1 min-w-0">
                <div class="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate leading-tight group-hover:text-brand-500 transition-colors">${file.name}</div>
            </div>
        </div>
    </div>`;
}

function generateFileCard(d) {
    const isImage = d.type.includes('image');
    const isPDF = d.type.includes('pdf') || d.name.toLowerCase().endsWith('.pdf');
    const isSelected = AppState.selectedDocs.has(d.id);
    
    if (AppState.docViewMode === 'list') {
        const bgClass = isSelected ? 'bg-brand-50/50 dark:bg-brand-500/10 border-l-4 border-l-brand-500' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-[#1e293b]/80 border-l-4 border-l-transparent';
        return `
        <div class="doc-item flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-800/60 ${bgClass} transition-colors group select-none relative cursor-pointer" 
             data-id="${d.id}" data-type="file" onclick="if(!event.target.closest('button') && !event.target.closest('input')) { window.previewDoc('${d.url}', '${d.type}', '${d.name}', '${d.id}', ${!!d.pinned}); }">
            
            <div class="flex items-center gap-4 min-w-0 flex-1">
                <div class="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}">
                    <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="window.toggleSelection(event, '${d.id}')" class="w-4 h-4 accent-brand-500 rounded cursor-pointer shadow-sm">
                </div>
                <div class="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 pointer-events-none rounded bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 overflow-hidden">
                    ${isImage ? `<img src="${d.url}" class="w-full h-full object-cover">` : getFileIcon(d.type, d.name)}
                </div>
                <div class="min-w-0 flex-1 pointer-events-none flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-6 pr-10">
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        ${d.pinned ? '<i data-lucide="star" class="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0"></i>' : ''}
                        <span class="text-sm font-bold text-slate-800 dark:text-white truncate group-hover:text-brand-500 transition-colors">${d.name}</span>
                    </div>
                    <div class="text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">
                        ${new Date(d.createdAt).toLocaleDateString('sv-SE')} • ${formatBytes(d.size)}
                    </div>
                </div>
            </div>
            ${getThreeDotsBtn(d.id)}
        </div>`;
    } else {
        const bgClass = isSelected ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50 dark:hover:border-brand-500/50';
        
        let previewContent = '';
        if (isImage) {
            previewContent = `<img src="${d.url}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`;
        } else if (isPDF) {
            previewContent = `<iframe src="${d.url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH" loading="lazy" class="w-full h-full pointer-events-none bg-[#FAFAFA]" style="transform: scale(1.1); transform-origin: top center;" tabindex="-1" scrolling="no"></iframe>`;
        } else {
            previewContent = `<div class="w-14 h-14">${getFileIcon(d.type, d.name)}</div>`;
        }

        return `
        <div class="doc-item flex flex-col rounded border ${bgClass} bg-[#FAFAFA] dark:bg-[#1e293b] shadow-lg transition-all group select-none relative cursor-pointer" 
             data-id="${d.id}" data-type="file" onclick="if(!event.target.closest('button') && !event.target.closest('input')) { window.previewDoc('${d.url}', '${d.type}', '${d.name}', '${d.id}', ${!!d.pinned}); }">
            
            <div class="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="window.toggleSelection(event, '${d.id}')" class="w-4 h-4 accent-brand-500 bg-[#FAFAFA] rounded cursor-pointer shadow-sm">
            </div>

            ${getThreeDotsBtn(d.id)}

            <div class="h-32 sm:h-40 bg-slate-50 dark:bg-[#0f172a] flex items-center justify-center relative overflow-hidden pointer-events-none border-b border-slate-200 dark:border-slate-800/60 rounded-t">
                ${previewContent}
                ${isPDF ? `<div class="absolute inset-0 bg-transparent z-10"></div>` : ''}
            </div>
            
            <div class="p-3 flex items-center gap-3 bg-transparent rounded-b pointer-events-none">
                <div class="w-5 h-5 shrink-0">${getFileIcon(d.type, d.name)}</div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5">
                        ${d.pinned ? '<i data-lucide="star" class="w-3 h-3 text-amber-500 fill-amber-500 shrink-0"></i>' : ''}
                        <div class="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-brand-500 transition-colors">${d.name}</div>
                    </div>
                </div>
            </div>
        </div>`;
    }
}

window.toggleSelection = (e, id) => {
    e.stopPropagation();
    if (AppState.selectedDocs.has(id)) {
        AppState.selectedDocs.delete(id);
    } else {
        AppState.selectedDocs.add(id);
    }
    renderDrive();
};

window.clearDocSelection = () => {
    AppState.selectedDocs.clear();
    renderDrive();
};

function updateActionBar() {
    const bar = document.getElementById('docActionBar');
    const count = document.getElementById('docSelectionCount');
    const btnContainer = document.getElementById('docActionButtons');
    if(!bar || !count || !btnContainer) return;

    if (AppState.selectedDocs.size > 0) {
        count.innerText = `${AppState.selectedDocs.size} valda`;
        bar.classList.remove('-translate-y-full');
        
        if (AppState.docFilter === 'trash') {
            btnContainer.innerHTML = `
                <button onclick="window.restoreSelectedDocs()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0 shadow-sm"><i data-lucide="rotate-ccw" class="w-4 h-4"></i> <span class="hidden sm:inline">Återställ</span></button>
                <div class="w-px h-6 bg-[#FAFAFA]/30 mx-1 hidden sm:block"></div>
                <button onclick="window.deleteSelectedDocs()" class="px-4 py-2 bg-red-500/90 hover:bg-red-600 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0 shadow-sm"><i data-lucide="trash-2" class="w-4 h-4"></i> <span class="hidden sm:inline">Radera permanent</span></button>
            `;
        } else {
            btnContainer.innerHTML = `
                <button onclick="window.downloadSelectedDocs()" class="px-3 py-2 hover:bg-[#FAFAFA]/20 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0"><i data-lucide="download" class="w-4 h-4"></i> <span class="hidden sm:inline">Ladda ner</span></button>
                <button onclick="window.starSelectedDocs()" class="px-3 py-2 hover:bg-[#FAFAFA]/20 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0"><i data-lucide="star" class="w-4 h-4"></i> <span class="hidden sm:inline">Stjärnmarkera</span></button>
                <div class="w-px h-6 bg-[#FAFAFA]/30 mx-1 hidden sm:block"></div>
                <button onclick="window.openMoveModal()" class="px-3 py-2 hover:bg-[#FAFAFA]/20 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0"><i data-lucide="folder-input" class="w-4 h-4"></i> <span class="hidden sm:inline">Flytta</span></button>
                <button onclick="window.copySelectedDocLinks()" class="px-3 py-2 hover:bg-[#FAFAFA]/20 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0"><i data-lucide="link" class="w-4 h-4"></i> <span class="hidden sm:inline">Länkar</span></button>
                <button onclick="window.deleteSelectedDocs()" class="px-3 py-2 bg-red-500/80 hover:bg-red-600 rounded text-sm font-bold transition-colors flex items-center gap-2 outline-none shrink-0"><i data-lucide="trash-2" class="w-4 h-4"></i> <span class="hidden sm:inline">Papperskorg</span></button>
            `;
        }
        if (window.lucide) window.lucide.createIcons({root: btnContainer});
        
    } else {
        bar.classList.add('-translate-y-full');
    }
}

// FLYTTA-MODALEN OCH LOGIK MED KATEGORIER
window.openMoveModal = (singleDocId = null) => {
    if (singleDocId) {
        AppState.selectedDocs.clear();
        AppState.selectedDocs.add(singleDocId);
        updateActionBar();
    }
    if (AppState.selectedDocs.size === 0) return;

    const folders = allDocuments.filter(d => d.type === 'folder');
    
    // Bygg upp alternativen med Mappar & Kategorier
    let optionsHtml = `
        <optgroup label="Placering">
            <option value="root">📁 Min Drive (Huvudmapp)</option>
        </optgroup>
        <optgroup label="Flytta till Kategori">
            <option value="cat_all">📑 Alla Filer (Osorterat)</option>
            <option value="cat_avtal">✍️ Avtal & Kontrakt</option>
            <option value="cat_bilder">🖼️ Media & Bilder</option>
            <option value="cat_varudeklaration">🛡️ Varudeklarationer</option>
        </optgroup>
    `;
    
    if(folders.length > 0) {
        optionsHtml += `<optgroup label="Flytta till Mapp">`;
        folders.forEach(f => {
            if(!AppState.selectedDocs.has(f.id)) {
                optionsHtml += `<option value="${f.id}">📁 ${f.name}</option>`;
            }
        });
        optionsHtml += `</optgroup>`;
    }

    let modal = document.getElementById('bmgMoveModal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'bmgMoveModal';
        modal.className = 'fixed inset-0 z-[999999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 opacity-0 transition-opacity duration-300';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="bg-[#FAFAFA] dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden transform scale-95 transition-transform duration-300" id="bmgMoveModalInner">
            <div class="p-5 border-b border-slate-200 dark:border-slate-700">
                <h3 class="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2"><i data-lucide="folder-input" class="w-5 h-5 text-brand-500"></i> Flytta objekt</h3>
                <p class="text-xs text-slate-500 font-medium mt-1">Välj var du vill placera ${AppState.selectedDocs.size} markerade objekt.</p>
            </div>
            <div class="p-5 space-y-4">
                <select id="moveDestination" class="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-bold text-slate-800 dark:text-white outline-none focus:border-brand-500">
                    ${optionsHtml}
                </select>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                <button onclick="document.getElementById('bmgMoveModal').classList.replace('opacity-100', 'opacity-0'); setTimeout(()=>document.getElementById('bmgMoveModal').classList.add('hidden'), 300);" class="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors outline-none">Avbryt</button>
                <button onclick="window.confirmMove()" class="px-5 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-bold transition-colors shadow-md outline-none">Flytta hit</button>
            </div>
        </div>
    `;
    
    if (window.lucide) window.lucide.createIcons();
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.replace('opacity-0', 'opacity-100');
        document.getElementById('bmgMoveModalInner').classList.replace('scale-95', 'scale-100');
    }, 10);
};

window.confirmMove = async () => {
    const destId = document.getElementById('moveDestination').value;
    let moved = 0;
    
    for (let id of AppState.selectedDocs) {
        if (destId.startsWith('cat_')) {
            const newCategory = destId.replace('cat_', '');
            const safeCategory = newCategory === 'all' ? 'ovrigt' : newCategory;
            await updateDoc(doc(db, "documents", id), { 
                category: safeCategory,
                parentId: 'root' 
            });
        } else {
            await updateDoc(doc(db, "documents", id), { parentId: destId });
        }
        moved++;
    }
    
    showToast(`${moved} objekt flyttades!`, "success");
    window.clearDocSelection();
    const modal = document.getElementById('bmgMoveModal');
    modal.classList.replace('opacity-100', 'opacity-0');
    setTimeout(()=>modal.classList.add('hidden'), 300);
};

window.deleteSelectedDocs = async () => {
    const isTrash = AppState.docFilter === 'trash';
    
    if(!confirm(isTrash 
        ? `Är du säker på att du vill radera ${AppState.selectedDocs.size} objekt PERMANENT?\nDetta går inte att ångra!` 
        : `Vill du flytta ${AppState.selectedDocs.size} objekt till papperskorgen?`)) return;
    
    let handled = 0;
    for (let id of AppState.selectedDocs) {
        const docData = allDocuments.find(d => d.id === id);
        if(!docData) continue;
        
        if(docData.pinned && !isTrash) {
            showToast(`Kunde inte flytta ${docData.name} (Ta bort stjärnmarkering först)`, "error");
            continue;
        }

        if (isTrash) {
            // Radera permanent från Databas OCH Storage (Google Cloud)
            if(docData.type === 'folder') {
                await deleteDoc(doc(db, "documents", id));
            } else {
                try {
                    await deleteObject(ref(storage, docData.fullPath));
                } catch(e) { console.warn("Fil fanns ej i storage", e) }
                await deleteDoc(doc(db, "documents", id));
            }
        } else {
            // "Soft delete" - Flytta till papperskorgen
            await updateDoc(doc(db, "documents", id), { trashed: true, trashedAt: Date.now() });
        }
        handled++;
    }
    
    showToast(isTrash ? `${handled} objekt raderades permanent!` : `${handled} objekt flyttades till papperskorgen!`);
    window.clearDocSelection();
};

window.restoreSelectedDocs = async () => {
    let restored = 0;
    for (let id of AppState.selectedDocs) {
        await updateDoc(doc(db, "documents", id), { trashed: false, trashedAt: null });
        restored++;
    }
    showToast(`${restored} objekt har återställts!`, "success");
    window.clearDocSelection();
};

window.restoreSingleItem = async (id) => {
    AppState.selectedDocs.clear();
    AppState.selectedDocs.add(id);
    window.restoreSelectedDocs();
};

window.copySelectedDocLinks = () => {
    const links = Array.from(AppState.selectedDocs).map(id => {
        const docData = allDocuments.find(d => d.id === id);
        return docData && docData.type !== 'folder' ? docData.url : null;
    }).filter(url => url).join('\n');

    if(links) {
        navigator.clipboard.writeText(links).then(() => showToast(`${AppState.selectedDocs.size} länkar kopierade!`));
        window.clearDocSelection();
    } else {
        showToast("Inga filer att kopiera länkar från", "error");
    }
};

window.createNewFolder = async () => {
    const name = prompt("Namn på ny mapp:");
    if(!name) return;
    await addDoc(collection(db, "documents"), {
        name: name, type: 'folder', parentId: AppState.currentFolderId, createdAt: Date.now()
    });
    showToast("Mapp skapad!");
};

window.openFolder = (id, name) => {
    AppState.currentFolderId = id;
    AppState.folderPath.push({id, name});
    window.clearDocSelection();
};

window.navigateToFolder = (id, index) => {
    AppState.currentFolderId = id;
    AppState.folderPath = AppState.folderPath.slice(0, index + 1);
    window.clearDocSelection();
};

// ==========================================
// HÖGERKLICK OCH KEBAB-MENY LOGIK
// ==========================================
window.openDocMenu = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    showContextMenuForId(e.clientX, e.clientY, id);
};

function setupContextMenu() {
    let menu = document.getElementById('contextMenu');
    if (!menu || menu.parentNode !== document.body) {
        if(menu) menu.remove(); 
        menu = document.createElement('div');
        menu.id = 'contextMenu';
        menu.className = 'fixed z-[999999] bg-[#FAFAFA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-xl py-1.5 w-48 hidden flex-col transform scale-95 opacity-0 transition-all origin-top-left';
        document.body.appendChild(menu);
    }

    document.getElementById('dropZoneArea').addEventListener('contextmenu', e => {
        const card = e.target.closest('.doc-item');
        if(!card) return;
        e.preventDefault();
        showContextMenuForId(e.clientX, e.clientY, card.dataset.id);
    });

    document.addEventListener('click', () => {
        const menu = document.getElementById('contextMenu');
        if(menu && !menu.classList.contains('hidden')) {
            menu.classList.add('scale-95', 'opacity-0');
            setTimeout(() => menu.classList.add('hidden'), 200);
        }
    });
}

function showContextMenuForId(clientX, clientY, targetDocId) {
    const menu = document.getElementById('contextMenu');
    const docData = allDocuments.find(d => d.id === targetDocId);
    if(!docData) return;

    const isFolder = docData.type === 'folder';
    const isTrashed = !!docData.trashed;

    if (isTrashed) {
        menu.innerHTML = `
            <button onclick="window.restoreSingleItem('${docData.id}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="rotate-ccw" class="w-4 h-4 text-emerald-500"></i> Återställ</button>
            <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
            <button onclick="window.deleteSingleItem('${docData.id}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i> Radera permanent</button>
        `;
    } else {
        menu.innerHTML = `
            ${!isFolder ? `<button onclick="window.previewDoc('${docData.url}', '${docData.type}', '${docData.name}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="eye" class="w-4 h-4 text-slate-400"></i> Öppna</button>` : `<button onclick="window.openFolder('${docData.id}', '${docData.name}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="folder-open" class="w-4 h-4 text-slate-400"></i> Öppna Mapp</button>`}
            ${!isFolder ? `<button onclick="window.downloadFile('${docData.url}', '${docData.name}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="download" class="w-4 h-4 text-slate-400"></i> Ladda ner</button>` : ''}
            <button onclick="window.renameItem('${docData.id}', '${docData.name}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="pencil" class="w-4 h-4 text-slate-400"></i> Byt namn</button>
            <button onclick="window.openMoveModal('${docData.id}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="folder-input" class="w-4 h-4 text-slate-400"></i> Flytta till...</button>
            ${!isFolder ? `<button onclick="window.copyDocLink('${docData.url}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="link" class="w-4 h-4 text-slate-400"></i> Kopiera länk</button>` : ''}
            ${!isFolder ? `<button onclick="window.emailDocLink('${docData.url}', '${docData.name}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="mail" class="w-4 h-4 text-slate-400"></i> Dela via e-post</button>` : ''}
            <button onclick="window.togglePinDoc('${docData.id}', ${!!docData.pinned})" class="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="star" class="w-4 h-4"></i> ${docData.pinned ? 'Ta bort stjärna' : 'Stjärnmarkera'}</button>
            <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
            <button onclick="window.deleteSingleItem('${docData.id}')" class="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"><i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i> Flytta till Papperskorgen</button>
        `;
    }

    if (window.lucide) window.lucide.createIcons({root: menu});

    // ... resten av menyns logik
    menu.classList.remove('hidden');
    
    void menu.offsetWidth; 
    const menuWidth = menu.offsetWidth || 200;
    const menuHeight = menu.offsetHeight || 340;
    
    let x = clientX;
    let y = clientY;

    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;

    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    
    setTimeout(() => { menu.classList.remove('scale-95', 'opacity-0'); }, 10);
}

window.renameItem = async (id, currentName) => {
    const newName = prompt("Ange nytt namn (Glöm ej filändelse som .pdf/.jpg för filer):", currentName);
    if (!newName || newName === currentName) return;
    await updateDoc(doc(db, "documents", id), { name: newName });
    showToast("Namnet har uppdaterats!");
};

window.deleteSingleItem = async (id) => {
    AppState.selectedDocs.clear();
    AppState.selectedDocs.add(id);
    window.deleteSelectedDocs();
};

window.togglePinDoc = async (docId, currentStatus) => {
    await updateDoc(doc(db, "documents", docId), { pinned: !currentStatus });
    showToast(!currentStatus ? "Filen stjärnmarkerades!" : "Stjärnmarkering borttagen.");
};

window.copyDocLink = (url) => {
    navigator.clipboard.writeText(url).then(() => showToast("Länk kopierad till urklipp!"));
};

window.emailDocLink = (url, name) => {
    const subject = encodeURIComponent(`Dokument: ${name}`);
    const body = encodeURIComponent(`Här är en länk till dokumentet:\n${url}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

window.downloadFile = (url, name) => {
    fetch(url).then(r => r.blob()).then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl; a.download = name; a.click();
        window.URL.revokeObjectURL(blobUrl);
        showToast("Laddar ner...");
    }).catch(() => showToast("Kunde inte ladda ner", "error"));
};

async function handleFileUpload(files) {
    if (!files || !files.length) return;
    const filterValue = AppState.docFilter; 
    const activeCat = filterValue !== 'all' && filterValue !== 'starred' ? filterValue : 'ovrigt';

    for (let i = 0; i < files.length; i++) {
        let file = files[i];
        try {
            showToast(`Laddar upp ${file.name}...`);
            const fileRef = ref(storage, `documents/${Date.now()}_${file.name}`);
            await uploadBytesResumable(fileRef, file);
            const downloadURL = await getDownloadURL(fileRef);
            
            await addDoc(collection(db, "documents"), {
                name: file.name, url: downloadURL, fullPath: fileRef.fullPath,
                size: file.size, type: file.type, category: activeCat,
                parentId: AppState.currentFolderId, pinned: false, createdAt: Date.now()
            });
            showToast(`${file.name} har sparats!`);
        } catch(error) { showToast(`Fel vid uppladdning`, "error"); }
    }
}

function updateStorageMeter() {
    const MAX_STORAGE_BYTES = 5 * 1024 * 1024 * 1024;
    let totalBytes = 0;
    allDocuments.forEach(d => totalBytes += (d.size || 0));
    let percentage = (totalBytes / MAX_STORAGE_BYTES) * 100;
    
    const bar = document.getElementById('storageProgressBar');
    const text = document.getElementById('storageText');
    if (bar && text) {
        bar.style.width = (percentage < 1 && totalBytes > 0 ? 1 : percentage) + '%';
        if (percentage > 90) bar.classList.replace('bg-brand-500', 'bg-red-500');
        text.innerHTML = `Använt: <span class="text-slate-800 dark:text-white">${formatBytes(totalBytes)}</span> / 5 GB`;
    }
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

window.toggleDocView = () => {
    AppState.docViewMode = AppState.docViewMode === 'list' ? 'grid' : 'list';
    localStorage.setItem('bmg_drive_view', AppState.docViewMode);
    updateViewToggleUI();
    renderDrive();
};

function updateViewToggleUI() {
    const icon = document.getElementById('viewModeIcon');
    const text = document.getElementById('viewModeText');
    if (icon) icon.setAttribute('data-lucide', AppState.docViewMode === 'list' ? 'layout-grid' : 'list');
    if (text) text.innerText = AppState.docViewMode === 'list' ? 'Rutnät' : 'Lista';
    if (window.lucide) window.lucide.createIcons();
}

function updateFilterButtonsUI() {
    document.querySelectorAll('.doc-filter-btn').forEach(b => {
        const isActive = b.dataset.filter === AppState.docFilter;
        b.classList.remove(
            'bg-brand-50', 'dark:bg-brand-500/10', 'text-brand-600', 'dark:text-brand-400',
            'text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'
        );

        if (isActive) {
            b.classList.add('bg-brand-50', 'dark:bg-brand-500/10', 'text-brand-600', 'dark:text-brand-400');
        } else {
            b.classList.add('text-slate-600', 'dark:text-slate-400', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
        }
    });
}

function setupDocumentListeners() {
    document.querySelectorAll('.doc-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            AppState.docFilter = e.currentTarget.dataset.filter;
            window.clearDocSelection();
            updateFilterButtonsUI();
            renderDrive();
        });
    });

    document.getElementById('docSortSelect')?.addEventListener('change', (e) => {
        AppState.docSort = e.target.value;
        renderDrive();
    });

    document.getElementById('docSearchInput')?.addEventListener('input', (e) => {
        AppState.docSearchQuery = e.target.value;
        window.clearDocSelection();
        renderDrive();
    });

    const triggerBtn = document.getElementById('triggerUploadBtn');
    const fileInput = document.getElementById('docUploadInput');
    if (triggerBtn && fileInput) {
        triggerBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files);
            fileInput.value = ''; 
        });
    }
}

function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZoneArea');
    const overlay = document.getElementById('dragOverlay');
    if(!dropZone || !overlay) return;
    let dragCounter = 0;
    dropZone.addEventListener('dragenter', (e) => { e.preventDefault(); dragCounter++; overlay.classList.remove('hidden'); overlay.classList.add('flex'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dragCounter--; if(dragCounter === 0) { overlay.classList.add('hidden'); overlay.classList.remove('flex'); } });
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dragCounter = 0; overlay.classList.add('hidden'); overlay.classList.remove('flex');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileUpload(e.dataTransfer.files);
    });
}

window.closePreview = () => {
    const lb = document.getElementById('bmgLightbox');
    if(lb) {
        lb.classList.replace('opacity-100', 'opacity-0');
        setTimeout(() => lb.classList.add('hidden'), 300);
    }
};

window.previewDoc = (url, type, name, docId, isPinned) => {
    let lightbox = document.getElementById('bmgLightbox');
    if(!lightbox) {
        lightbox = document.createElement('div');
        lightbox.id = 'bmgLightbox';
        lightbox.className = 'fixed inset-0 z-[999999] bg-slate-900/95 backdrop-blur-md flex flex-col hidden opacity-0 transition-opacity duration-300';
        document.body.appendChild(lightbox);
    }
    
    let contentHtml = type.includes('image') 
        ? `<img src="${url}" class="max-w-full max-h-[85vh] object-contain drop-shadow-2xl rounded pointer-events-auto">` 
        : `<iframe src="${url}" class="w-full h-full max-w-6xl rounded border border-slate-700 bg-[#FAFAFA] shadow-2xl pointer-events-auto"></iframe>`;
    
    const isPDF = type.includes('pdf') || name.toLowerCase().endsWith('.pdf');

    lightbox.innerHTML = `
        <div class="h-16 sm:h-20 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 shrink-0 bg-slate-900 gap-2 overflow-x-auto no-scrollbar">
            <div class="text-white font-bold truncate pr-4 text-sm sm:text-base flex items-center gap-3 shrink-0">
                ${getFileIcon(type, name)} ${name}
            </div>
            
            <div class="flex items-center gap-2 shrink-0 pb-2 sm:pb-0">
                ${isPDF ? `<button onclick="window.signDoc()" class="text-sm font-bold bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded transition-colors flex items-center gap-2 outline-none shadow-lg mr-2"><i data-lucide="pen-tool" class="w-4 h-4"></i> E-signera</button>` : ''}
                
                <button onclick="window.togglePinDoc('${docId}', ${isPinned}); window.closePreview();" class="text-slate-300 hover:text-amber-500 bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Stjärnmarkera"><i data-lucide="star" class="w-4 h-4 ${isPinned ? 'fill-amber-500 text-amber-500' : ''}"></i></button>
                <button onclick="window.openMoveModal('${docId}'); window.closePreview();" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Flytta"><i data-lucide="folder-input" class="w-4 h-4"></i></button>
                <button onclick="window.renameItem('${docId}', '${name}'); window.closePreview();" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Byt namn"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                <button onclick="window.copyDocLink('${url}')" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Kopiera länk"><i data-lucide="link" class="w-4 h-4"></i></button>
                <button onclick="window.emailDocLink('${url}', '${name}')" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Dela via e-post"><i data-lucide="mail" class="w-4 h-4"></i></button>
                <div class="w-px h-6 bg-slate-700 mx-1"></div>
                <button onclick="window.downloadFile('${url}', '${name}')" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 p-2.5 rounded transition-colors outline-none" title="Ladda ner"><i data-lucide="download" class="w-4 h-4"></i></button>
                <button onclick="window.deleteSingleItem('${docId}'); window.closePreview();" class="text-slate-300 hover:text-white bg-slate-800 hover:bg-red-500 p-2.5 rounded transition-colors outline-none" title="Radera fil"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                <div class="w-px h-6 bg-slate-700 mx-1"></div>
                <button onclick="window.closePreview()" class="text-white bg-slate-700 hover:bg-slate-600 p-2.5 rounded transition-colors outline-none shadow-sm" title="Stäng"><i data-lucide="x" class="w-4 h-4"></i></button>
            </div>
        </div>
        <div class="flex-1 p-4 md:p-8 flex items-center justify-center min-h-0 overflow-hidden relative cursor-pointer" onclick="if(event.target === this) window.closePreview()">
            <div class="relative w-full h-full flex items-center justify-center pointer-events-none" onclick="if(event.target === this) window.closePreview()">
                ${contentHtml}
            </div>
        </div>`;
    
    if (window.lucide) window.lucide.createIcons();
    lightbox.classList.remove('hidden');
    setTimeout(() => lightbox.classList.replace('opacity-0', 'opacity-100'), 10);
};

window.downloadSelectedDocs = () => {
    let count = 0;
    for (let id of AppState.selectedDocs) {
        const docData = allDocuments.find(d => d.id === id);
        if (docData && docData.type !== 'folder') {
            window.downloadFile(docData.url, docData.name);
            count++;
        }
    }
    if (count > 0) {
        showToast(`${count} filer laddas ner!`);
        window.clearDocSelection();
    } else {
        showToast("Inga nedladdningsbara filer valda.", "error");
    }
};

window.starSelectedDocs = async () => {
    let count = 0;
    for (let id of AppState.selectedDocs) {
        const docData = allDocuments.find(d => d.id === id);
        if (docData) {
            await updateDoc(doc(db, "documents", id), { pinned: true });
            count++;
        }
    }
    showToast(`${count} filer stjärnmarkerades!`, "success");
    window.clearDocSelection();
};

window.signDoc = () => {
    showToast("Funktionen kräver aktiv integration med Scrive / Penneo.", "warning");
};