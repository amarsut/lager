// --- admin-js/Inbox.js ---

import { db } from './core.js';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

window.initInbox = initInbox;

let currentFolder = 'inbox';
let selectedEmails = new Set();
let currentEmailList = [];
let currentlyOpenEmailId = null;
let listDensity = 'py-2';

// System Mappar och Egna Mappar
window.customFolders = [{ id: 'faktura', name: 'Fakturor', icon: 'file-text' }];
window.customTags = [{ id: 'viktigt', name: 'Viktigt', color: 'bg-red-500' }, { id: 'lead', name: 'Nytt Lead', color: 'bg-emerald-500' }];

function formatMailDate(dateObj) {
    if (!dateObj) return 'Nyss';
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (isToday) return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
    if (now.getFullYear() === date.getFullYear()) return date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'numeric', day: 'numeric' });
}

function getAvatarInfo(nameStr) {
    if (!nameStr) return { init: '?', color: 'bg-slate-500' };
    const clean = nameStr.replace(/["']/g, '').split('@')[0].trim();
    let init = clean.substring(0, 2).toUpperCase();
    if (clean.includes(' ')) {
        const parts = clean.split(' ');
        init = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }
    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500', 'bg-rose-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-teal-500'];
    let hash = 0;
    for (let i = 0; i < clean.length; i++) hash = clean.charCodeAt(i) + ((hash << 5) - hash);
    return { init: init, color: colors[Math.abs(hash) % colors.length] };
}

function linkifyText(text) {
    if (!text) return '';
    let safe = text.replace(/^[ \t]+/gm, '');
    
    // 1. Brutal tvätt av Make.coms fula format
    safe = safe.replace(/[^\s]+<(https?:\/\/[^>]+)>/g, '$1'); 
    safe = safe.replace(/[<>]/g, ' '); // Slaktar alla lösa < och > i texten
    
    const placeholders = [];
    
    // 2. Leta länkar
    safe = safe.replace(/(https?:\/\/[^\s"']+)/g, (match) => {
        placeholders.push(`<a href="${match}" target="_blank" class="text-brand-500 font-bold hover:underline">${match}</a>`);
        return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });
    
    safe = safe.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, (match) => {
        placeholders.push(`<a href="mailto:${match}" class="text-blue-500 font-bold hover:underline">${match}</a>`);
        return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });
    
    safe = safe.replace(/\b(0[1-9]\d{1,2}[\s\-]?\d{2,3}[\s\-]?\d{2,3})\b/g, (match) => {
        placeholders.push(`<a href="tel:${match.replace(/\s|-/g, '')}" class="text-emerald-500 font-bold hover:underline"><i data-lucide="phone" class="w-3 h-3 inline"></i> ${match}</a>`);
        return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });
    
    safe = safe.replace(/\b(?!(?:MIG|DIG|SIG|OCH|ATT|SOM|DET|HAR|KAN|TILL|FÖR|MED|DEN|HEJ)\b)([A-HJ-PR-UW-Z]{3}[\s\-]?\d{2}[A-HJ-PR-UW-Z0-9])\b/gi, (match) => {
        placeholders.push(`<a href="https://www.car.info/sv-se/license-plate/S/${match.replace(/\s/g, '')}" target="_blank" class="text-orange-500 font-bold hover:underline" title="Slå upp på Car.info">${match}</a>`);
        return `__PLACEHOLDER_${placeholders.length - 1}__`;
    });
    
    placeholders.forEach((html, i) => {
        safe = safe.replace(`__PLACEHOLDER_${i}__`, html);
    });
    
    return safe;
}

function extractEntities(text) {
    const e = { regnr: [], phone: [], pnr: [], email: [], links: [] };
    if (!text) return e;

    let cleanText = text.replace(/[^\s]+<(https?:\/\/[^>]+)>/g, '$1');
    cleanText = cleanText.replace(/[<>]/g, ' '); // Städar även för sidopanelen

    const rMatch = cleanText.match(/\b(?!(?:MIG|DIG|SIG|OCH|ATT|SOM|DET|HAR|KAN|TILL|FÖR|MED|DEN|HEJ)\b)([A-HJ-PR-UW-Z]{3}[\s\-]?\d{2}[A-HJ-PR-UW-Z0-9])\b/gi);
    if (rMatch) e.regnr = [...new Set(rMatch)];

    const phMatch = cleanText.match(/\b(0[1-9]\d{1,2}[\s\-]?\d{2,3}[\s\-]?\d{2,3})\b/g);
    if (phMatch) e.phone = [...new Set(phMatch)];

    const pnrMatch = cleanText.match(/\b((?:19|20)?\d{6}[-\s]?\d{4})\b/g);
    if (pnrMatch) e.pnr = [...new Set(pnrMatch)];

    const mailMatch = cleanText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    if (mailMatch) e.email = [...new Set(mailMatch)];

    const linkMatch = cleanText.match(/(https?:\/\/[^\s]+)/g);
    if (linkMatch) e.links = [...new Set(linkMatch)];

    return e;
}

export function initInbox() {
    const q = query(collection(db, "inbox"), orderBy("date", "desc"));

    onSnapshot(q, (snapshot) => {
        const emailList = document.getElementById('emailList');
        const mainBadge = document.getElementById('inboxBadge');
        const folderBadge = document.getElementById('folderUnreadCount');
        const dashInboxList = document.getElementById('dashInboxList');

        let html = '';
        const emailData = [];
        let globalInboxUnreadCount = 0;
        let monthCredits = 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const AUTO_DELETE_MS = 14 * 24 * 60 * 60 * 1000;

        snapshot.forEach((docSnapshot) => {
            const mail = docSnapshot.data();
            const id = docSnapshot.id;

            if (mail.date && mail.date.toDate) {
                const mailDate = mail.date.toDate();
                if (new Date() - mailDate > AUTO_DELETE_MS && !mail.pinned) {
                    deleteDoc(doc(db, "inbox", id)).catch(e => { });
                    return;
                }
                if (mailDate.getMonth() === currentMonth && mailDate.getFullYear() === currentYear) monthCredits += 2;
            }

            const mailFolder = mail.folder || 'inbox';
            if (mailFolder === 'inbox' && !mail.read) globalInboxUnreadCount++;
            emailData.push({ id, folder: mailFolder, tags: mail.tags || [], ...mail });
        });

        // --- DASHBOARD WIDGET ---
        if (dashInboxList) {
            const dashMails = emailData.filter(m => m.folder === 'inbox').slice(0, 5);
            let dashHtml = '';
            dashMails.forEach(mail => {
                const isUnread = !mail.read;
                const safeText = mail.text ? mail.text.replace(/^[ \t]+/gm, '').replace(/\n/g, ' ').substring(0, 60) : 'Tomt meddelande...';
                const av = getAvatarInfo(mail.sender);
                dashHtml += `
                <div onclick="window.goToTab('inbox'); setTimeout(()=>window.openEmail('${mail.id}'),100)" class="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800/50 last:border-0 flex gap-3 group relative">
                    <div class="relative shrink-0 mt-0.5 ${isUnread ? 'ml-2' : ''}">
                        ${isUnread ? '<div class="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-[#0f172a] z-10"></div>' : ''}
                        <div class="w-8 h-8 rounded ${av.color} text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">${av.init}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline mb-0.5">
                            <span class="text-[13px] ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'} truncate">${mail.sender.split('@')[0]}</span>
                            <span class="text-[10px] ${isUnread ? 'text-brand-500 font-bold' : 'text-slate-400 font-medium'} shrink-0">${formatMailDate(mail.date)}</span>
                        </div>
                        <div class="text-xs ${isUnread ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'} truncate">${mail.subject || '(Inget ämne)'}</div>
                        <div class="text-[11px] text-slate-500 truncate mt-0.5">${safeText}</div>
                    </div>
                </div>`;
            });
            dashInboxList.innerHTML = dashHtml || '<div class="p-6 text-center text-slate-400 text-[10px] font-bold uppercase">Inga nya mejl</div>';
        }

        // --- HUVUDLISTAN FÖR INKORGEN ---
        currentEmailList = currentFolder === 'starred'
            ? emailData.filter(m => m.pinned)
            : emailData.filter(m => m.folder === currentFolder);

        currentEmailList.forEach(mail => {
            const isUnread = !mail.read;
            const isSelected = selectedEmails.has(mail.id);
            const dateDisplay = formatMailDate(mail.date);
            const safeText = mail.text ? mail.text.replace(/^[ \t]+/gm, '').replace(/\n/g, ' ').substring(0, 100) : '';
            const av = getAvatarInfo(mail.sender);

            let tagsHtml = '';
            if (mail.tags && mail.tags.length > 0) {
                mail.tags.forEach(tId => {
                    const tag = window.customTags.find(t => t.id === tId);
                    if (tag) tagsHtml += `<span class="w-2 h-2 rounded-full ${tag.color} shrink-0" title="${tag.name}"></span>`;
                });
            }

            let hasAttachments = false;
            const rawAttachments = mail.attachments || mail.Attachments || mail.attachment || mail.files || mail.fileNames;
            if (rawAttachments) {
                if (typeof rawAttachments === 'string' && rawAttachments.trim() !== '') hasAttachments = true;
                else if (Array.isArray(rawAttachments) && rawAttachments.length > 0) hasAttachments = true;
            }

            html += `
                <div id="mail-item-${mail.id}" class="mail-list-item flex items-start sm:items-center w-full p-3 sm:px-4 ${listDensity} cursor-pointer transition-colors duration-200 border-b border-slate-100 dark:border-slate-800/50 ${isSelected ? '!bg-brand-50 dark:!bg-brand-500/10 border-brand-200 dark:border-brand-500/30' : (isUnread ? 'bg-white dark:bg-[#0f172a] shadow-sm' : 'bg-[#FAFAFA]/50 dark:bg-[#020617] hover:bg-slate-50 dark:hover:bg-[#0a0f1c]')} group relative" onclick="window.openEmail('${mail.id}')">
                    
                    <div class="relative shrink-0 mr-3 sm:mr-4 flex flex-col items-center mt-0.5 sm:mt-0" onclick="event.stopPropagation()">
                        ${isUnread ? '<div class="absolute -top-0.5 -left-0.5 w-3 h-3 sm:w-2.5 sm:h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-[#0f172a] z-10 hidden sm:block"></div>' : ''}
                        
                        <div class="w-10 h-10 sm:w-8 sm:h-8 rounded-full sm:rounded-lg ${av.color} text-white flex items-center justify-center text-sm sm:text-[10px] font-bold shadow-sm ${isSelected ? 'hidden' : 'flex'} group-hover:hidden transition-all">${av.init}</div>
                        
                        <label class="w-10 h-10 sm:w-8 sm:h-8 items-center justify-center ${isSelected ? 'flex' : 'hidden'} group-hover:flex transition-all cursor-pointer m-0">
                            <input type="checkbox" value="${mail.id}" ${isSelected ? 'checked' : ''} onchange="window.toggleEmailSelection(this, '${mail.id}')" class="w-5 h-5 sm:w-4 sm:h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer">
                        </label>
                    </div>
                    
                    <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center">
                        <div class="flex justify-between items-baseline w-full sm:w-48 shrink-0 pr-0 sm:pr-4 mb-1 sm:mb-0">
                            <span class="text-[15px] sm:text-[13px] truncate ${isUnread ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}">
                                ${isUnread ? '<span class="inline-block w-2 h-2 bg-brand-500 rounded-full mr-1.5 sm:hidden"></span>' : ''}
                                ${mail.sender ? mail.sender.split('@')[0] : 'Okänd'}
                            </span>
                        </div>
                        
                        <div class="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center pr-2 sm:pr-4">
                            <span class="text-[14px] sm:text-[13px] truncate ${isUnread ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}">${mail.subject || '(Inget ämne)'}</span>
                            <span class="text-[13px] sm:text-xs text-slate-500 dark:text-slate-500 truncate sm:ml-2 line-clamp-1 sm:line-clamp-none whitespace-normal sm:whitespace-nowrap mt-0.5 sm:mt-0">${safeText}</span>
                            ${tagsHtml ? `<div class="hidden sm:flex gap-1 ml-2">${tagsHtml}</div>` : ''}
                        </div>
                    </div>

                    <div class="relative flex items-center justify-end w-16 sm:w-36 h-8 shrink-0 ml-2 sm:ml-0" onclick="event.stopPropagation()">
                        <div class="absolute right-0 flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1 sm:gap-2 transition-opacity duration-200 group-hover:sm:opacity-0 h-full sm:h-auto">
                            <div class="flex items-center gap-1.5">
                                ${hasAttachments ? '<i data-lucide="paperclip" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400"></i>' : ''}
                                ${mail.pinned ? '<i data-lucide="star" class="w-4 h-4 sm:w-4 sm:h-4 fill-amber-400 text-amber-400"></i>' : ''}
                            </div>
                            <span class="text-[10px] sm:text-xs ${isUnread ? 'font-bold text-brand-500' : 'font-medium text-slate-500'}">${dateDisplay}</span>
                        </div>

                        <div class="absolute right-0 hidden sm:flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onclick="window.toggleRead('${mail.id}', ${mail.read})" class="p-1.5 text-slate-400 hover:text-brand-500 transition-colors tooltip outline-none" title="${isUnread ? 'Markera läst' : 'Markera oläst'}"><i data-lucide="${isUnread ? 'mail-open' : 'mail'}" class="w-4 h-4"></i></button>
                            ${currentFolder !== 'archive' ? `<button onclick="window.moveEmail('${mail.id}', 'archive')" class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors tooltip outline-none" title="Arkivera"><i data-lucide="archive" class="w-4 h-4"></i></button>` : ''}
                            ${currentFolder !== 'trash' ? `<button onclick="window.moveEmail('${mail.id}', 'trash')" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors tooltip outline-none" title="Papperskorg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>` : ''}
                            <button onclick="window.togglePin('${mail.id}', ${!!mail.pinned})" class="p-1.5 outline-none hover:scale-110 transition-transform tooltip" title="${mail.pinned ? 'Ta bort stjärna' : 'Stjärnmarkera'}">
                                <i data-lucide="star" class="w-4 h-4 ${mail.pinned ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-500'} transition-colors"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (emailList) {
            emailList.innerHTML = html || `
                <div class="h-full flex flex-col items-center justify-center text-slate-400">
                    <i data-lucide="${currentFolder === 'trash' ? 'trash-2' : (currentFolder === 'starred' ? 'star' : 'inbox')}" class="w-12 h-12 mb-4 opacity-20"></i>
                    <p class="font-bold uppercase tracking-widest text-[10px]">Inga mejl här</p>
                </div>`;
        }

        if (folderBadge) {
            if (globalInboxUnreadCount > 0) { folderBadge.classList.remove('hidden'); folderBadge.innerText = globalInboxUnreadCount; }
            else { folderBadge.classList.add('hidden'); }
        }
        if (mainBadge) {
            if (globalInboxUnreadCount > 0) { mainBadge.classList.remove('hidden'); }
            else { mainBadge.classList.add('hidden'); }
        }

        updateCreditBar(monthCredits);
        updateGlobalNotifications(emailData.filter(m => !m.read && (m.folder || 'inbox') === 'inbox')); // LÄGG TILL DENNA!
        renderCustomNav();
        if (!window.AppState) window.AppState = {};
        window.AppState.emails = emailData;
        if (window.lucide) window.lucide.createIcons();
        updateBulkBar();
    });
}

function renderCustomNav() {
    const foldersList = document.getElementById('customFoldersList');
    if (foldersList) {
        foldersList.innerHTML = window.customFolders.map(f => `
            <button onclick="window.switchFolder('${f.id}')" id="folder-${f.id}" class="folder-btn w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none">
                <i data-lucide="${f.icon}" class="w-4 h-4"></i> ${f.name}
            </button>
        `).join('');
    }
    const tagsList = document.getElementById('customTagsList');
    if (tagsList) {
        tagsList.innerHTML = window.customTags.map(t => `
            <button onclick="window.toggleTagOnOpenEmail('${t.id}')" class="w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors outline-none tooltip" title="Klicka för att sätta tagg på öppet mejl">
                <span class="w-2.5 h-2.5 rounded-full ${t.color}"></span> ${t.name}
            </button>
        `).join('');
    }
    if (window.lucide) window.lucide.createIcons();
}

window.toggleListDensity = () => {
    listDensity = listDensity === 'py-1.5 sm:py-2' ? 'py-3 sm:py-4' : 'py-1.5 sm:py-2';
    initInbox();
};

function updateCreditBar(used) {
    const max = 1000;
    const percentage = Math.min((used / max) * 100, 100);
    const bar = document.getElementById('creditBar');
    const text = document.getElementById('creditCounter');
    if (text) text.innerText = `${used} / ${max}`;
    if (bar) {
        bar.style.width = `${percentage}%`;
        if (percentage > 85) bar.className = 'h-full bg-red-500 transition-all duration-1000';
        else if (percentage > 60) bar.className = 'h-full bg-amber-500 transition-all duration-1000';
        else bar.className = 'h-full bg-emerald-500 transition-all duration-1000';
    }
}

window.switchFolder = (folderName) => {
    currentFolder = folderName;
    selectedEmails.clear();
    document.querySelectorAll('.folder-btn').forEach(btn => {
        btn.classList.remove('bg-brand-50', 'dark:bg-brand-500/10', 'text-brand-600', 'dark:text-brand-400');
        btn.classList.add('text-slate-600', 'dark:text-slate-400');
    });
    const activeBtn = document.getElementById(`folder-${folderName}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-slate-600', 'dark:text-slate-400');
        activeBtn.classList.add('bg-brand-50', 'dark:bg-brand-500/10', 'text-brand-600', 'dark:text-brand-400');
    }
    const titleEl = document.getElementById('currentFolderTitle');
    if (titleEl) {
        const titles = { 'inbox': 'Inkorg', 'starred': 'Stjärnmarkerat', 'archive': 'Arkiverat', 'trash': 'Papperskorg' };
        titleEl.innerText = titles[folderName] || folderName.toUpperCase();
    }
    const selectAllEl = document.getElementById('selectAllMails');
    if (selectAllEl) selectAllEl.checked = false;

    window.closeEmail();
    initInbox();
};

// --- DEN VÄNSTERSTÄLLDA LÄSVYN MED SVARA I BOTTEN OCH DATA TILL HÖGER ---
window.openEmail = async (id) => {
    currentlyOpenEmailId = id;
    const mail = currentEmailList.find(m => m.id === id);
    if (!mail) return;

    document.querySelectorAll('.mail-list-item').forEach(el => el.classList.remove('bg-slate-100', 'dark:bg-[#1e293b]'));
    const activeItem = document.getElementById(`mail-item-${id}`);
    if (activeItem) {
        activeItem.classList.remove('bg-white', 'dark:bg-[#0f172a]', 'shadow-sm');
        activeItem.classList.add('bg-slate-100', 'dark:bg-[#1e293b]', 'opacity-80');
    }

    if (!mail.read) { updateDoc(doc(db, "inbox", id), { read: true }).catch(e => console.error(e)); }

    const fullDate = mail.date?.toDate ? mail.date.toDate().toLocaleString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
    const av = getAvatarInfo(mail.sender);

    // Smarta upptäckter!
    const entities = extractEntities(mail.text);
    const cleanBody = linkifyText(mail.text);

    let displayContent = `<div class="text-slate-800 dark:text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap font-sans">${cleanBody || '<span class="opacity-50 italic">Tomt...</span>'}</div>`;
    if (!mail.text && mail.html) {
        displayContent = `<iframe srcdoc="<style>body{color-scheme: dark light; color: #334155; font-family: sans-serif; word-break: break-word;} @media (prefers-color-scheme: dark){body{color: #cbd5e1;}}</style>${mail.html.replace(/"/g, '&quot;')}" style="width:100%; min-height: 60vh; border:none; background:transparent;" sandbox="allow-same-origin"></iframe>`;
    }

    // --- BILAGE-GALLERIET (Skottsäker version) ---
    let attachmentsHtml = '';
    let attArray = [];
    
    // Fångar upp alla möjliga namn som Make.com kan ha sparat fältet som i databasen
    const rawAttachments = mail.attachments || mail.Attachments || mail.attachment || mail.files || mail.fileNames;

    if (rawAttachments) {
        if (typeof rawAttachments === 'string') {
            attArray = rawAttachments.split(',').map(s => s.trim()).filter(s => s !== '');
        } else if (Array.isArray(rawAttachments)) {
            attArray = rawAttachments.map(att => typeof att === 'string' ? att : (att.name || att.fileName || att.file_name || '')).filter(s => s !== '');
        }
    }

    if (attArray.length > 0) {
        attachmentsHtml = `<div class="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/60 w-full">
            <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-1.5"><i data-lucide="paperclip" class="w-3.5 h-3.5"></i> Bilagor (${attArray.length})</h4>
            <div class="flex flex-wrap gap-3">`;

        attArray.forEach(fileName => {
            let fileExt = fileName.split('.').pop().toLowerCase();
            
            let icon = 'file'; let color = 'text-slate-500'; let bgColor = 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
            if (['pdf'].includes(fileExt)) { icon = 'file-text'; color = 'text-red-500'; bgColor = 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'; }
            else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) { icon = 'image'; color = 'text-brand-500'; bgColor = 'bg-brand-50 dark:bg-brand-500/10 border-brand-200 dark:border-brand-500/20'; }
            else if (['doc', 'docx'].includes(fileExt)) { icon = 'file-text'; color = 'text-blue-500'; bgColor = 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20'; }
            else if (['xls', 'xlsx', 'csv'].includes(fileExt)) { icon = 'table'; color = 'text-emerald-500'; bgColor = 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'; }

            attachmentsHtml += `
                <div onclick="alert('Av kostnads- och prestandaskäl sparas inte tunga bilagor i databasen.\\n\\nÖppna din vanliga e-postapp (t.ex. Outlook eller Gmail) för att ladda ner och läsa filen.')" class="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700/80 rounded cursor-pointer hover:border-brand-500 transition-colors bg-white dark:bg-[#1e293b] shadow-sm w-full sm:w-auto sm:min-w-[220px] max-w-xs group">
                    <div class="w-10 h-10 rounded ${bgColor} flex items-center justify-center shrink-0 border"><i data-lucide="${icon}" class="w-5 h-5 ${color}"></i></div>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-slate-800 dark:text-white truncate group-hover:text-brand-500 transition-colors">${fileName}</div>
                        <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Klicka för info</div>
                    </div>
                </div>`;
        });
        attachmentsHtml += `</div></div>`;
    }

    // 1. Bygg Topplisten
    const readViewToolbarContainer = document.querySelector('#emailReadView > div.h-14');
    if (readViewToolbarContainer) readViewToolbarContainer.classList.add('hidden');

    let toolbarHtml = `
        <div class="flex items-center gap-1">
            <button onclick="window.togglePin('${id}', ${!!mail.pinned})" class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 outline-none tooltip" title="${mail.pinned ? 'Ta bort stjärna' : 'Stjärnmarkera'}"><i data-lucide="star" class="w-4 h-4 ${mail.pinned ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-500'} transition-colors"></i></button>
            <button onclick="window.printEmail()" class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors outline-none tooltip" title="Skriv ut"><i data-lucide="printer" class="w-4 h-4"></i></button>
            <button onclick="window.toggleRead('${id}', true)" class="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 hover:text-brand-500 transition-colors outline-none tooltip" title="Markera som oläst"><i data-lucide="mail" class="w-4 h-4"></i></button>
            <button onclick="window.deleteEmailPermanently('${id}')" class="w-8 h-8 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-500 transition-colors outline-none tooltip" title="Radera"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
        </div>
    `;

    // 2. Bygg Extraderad Data för Högerkolumn
    let extractedHtml = '';
    if (entities.regnr.length > 0 || entities.phone.length > 0 || entities.pnr.length > 0 || entities.email.length > 0 || entities.links.length > 0) {
        extractedHtml = `<div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/50 space-y-2">
            <span class="block text-[10px] font-black uppercase tracking-widest text-brand-500 mb-3 flex items-center gap-1.5"><i data-lucide="zap" class="w-3 h-3"></i> Identifierad Data</span>
            <div class="flex flex-col gap-2">`;

        entities.regnr.forEach(r => extractedHtml += `<a href="https://www.car.info/sv-se/license-plate/S/${r.replace(/\s/g, '')}" target="_blank" class="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm hover:border-brand-500 transition-colors"><i data-lucide="car" class="w-4 h-4 text-orange-500 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">${r}</div><div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Slå upp fordon</div></div></a>`);
        entities.phone.forEach(p => extractedHtml += `<a href="tel:${p.replace(/\s/g, '')}" class="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm hover:border-brand-500 transition-colors"><i data-lucide="phone" class="w-4 h-4 text-emerald-500 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">${p}</div><div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ring kund</div></div></a>`);
        entities.pnr.forEach(p => extractedHtml += `<a href="https://www.ratsit.se/sok/avancerat/person?pnr=${p.replace(/\D/g, '')}" target="_blank" class="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm hover:border-brand-500 transition-colors"><i data-lucide="user-search" class="w-4 h-4 text-blue-500 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">${p}</div><div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sök person</div></div></a>`);
        entities.email.forEach(e => extractedHtml += `<a href="mailto:${e}" class="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm hover:border-brand-500 transition-colors"><i data-lucide="mail" class="w-4 h-4 text-indigo-500 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">${e}</div><div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Skicka mejl</div></div></a>`);
        entities.links.forEach(l => {
            const shortLink = l.length > 25 ? l.substring(0, 25) + '...' : l;
            extractedHtml += `<a href="${l}" target="_blank" class="flex items-center gap-3 p-2.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm hover:border-brand-500 transition-colors" title="${l}"><i data-lucide="link" class="w-4 h-4 text-slate-400 shrink-0"></i><div class="flex-1 min-w-0"><div class="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">${shortLink}</div><div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Öppna länk</div></div></a>`;
        });
        extractedHtml += `</div></div>`;
    }

    let rightColHtml = `
        <div class="p-6 flex flex-col items-center text-center border-b border-slate-200 dark:border-slate-800/50">
            <div class="w-20 h-20 rounded-xl ${av.color} text-white flex items-center justify-center font-black text-3xl uppercase shadow-md mb-4">${av.init}</div>
            <h3 class="font-black text-lg text-slate-800 dark:text-white tracking-tight">${mail.sender.split('@')[0]}</h3>
            <p class="text-[11px] font-medium text-slate-500 mt-1 mb-5 truncate w-full" title="${mail.sender}">${mail.sender}</p>
            
            <div class="flex gap-2 w-full">
                <button onclick="window.copyToClipboard('${mail.sender}')" class="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 hover:border-brand-500 text-slate-600 dark:text-slate-300 text-xs font-bold py-2.5 rounded shadow-sm transition-colors outline-none flex items-center justify-center gap-2">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i> Kopiera
                </button>
                <button class="flex-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-500/30 hover:bg-brand-500 hover:text-white text-xs font-bold py-2.5 rounded shadow-sm transition-colors outline-none flex items-center justify-center gap-2">
                    Sök CRM
                </button>
            </div>
        </div>
        
        <div class="p-6 space-y-5">
            <div>
                <span class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Mottaget</span>
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${fullDate}</span>
            </div>
            <div>
                <span class="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Placering</span>
                <div class="flex items-center justify-between">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700/50 rounded shadow-sm text-xs font-bold text-slate-600 dark:text-slate-300 capitalize"><i data-lucide="folder" class="w-3.5 h-3.5 text-slate-400"></i> ${mail.folder || 'Inkorg'}</span>
                    
                    <div class="relative group">
                        <select onchange="window.moveEmail('${id}', this.value)" class="absolute inset-0 opacity-0 cursor-pointer">
                            <option value="">Flytta till...</option>
                            <option value="inbox">Inkorg</option>
                            ${window.customFolders.map(f => `<option value="${f.id}">${f.name}</option>`).join('')}
                            <option value="archive">Arkivet</option>
                        </select>
                        <button class="text-[10px] font-bold uppercase tracking-widest text-brand-500 hover:text-brand-600 outline-none">Flytta</button>
                    </div>
                </div>
            </div>
            ${extractedHtml}
        </div>
    `;

    const contentArea = document.getElementById('emailContentArea');
    if (contentArea) {
        contentArea.innerHTML = `
            <div class="flex flex-col lg:flex-row h-full w-full relative overflow-y-auto lg:overflow-hidden no-scrollbar">
                
                <div id="printableEmail" class="flex-1 lg:overflow-y-auto no-scrollbar p-4 sm:p-10 w-full min-w-0 relative shrink-0">
                    
                    <div class="flex items-center justify-between mb-8">
                        <button onclick="window.closeEmail()" class="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-brand-500 transition-colors outline-none"><i data-lucide="arrow-left" class="w-4 h-4"></i> Tillbaka</button>
                        ${toolbarHtml}
                    </div>

                    <div class="max-w-3xl ml-0 w-full pb-20">
                        <h1 class="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-8 leading-snug break-words">${mail.subject || '(Inget ämne)'}</h1>
                        
                        <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-8 pb-6 border-b border-slate-100 dark:border-slate-800/60 gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-11 h-11 rounded-full ${av.color} text-white flex items-center justify-center font-black text-lg uppercase shrink-0 shadow-sm">
                                ${av.init}
                            </div>
                            <div class="flex flex-col min-w-0">
                                <span class="font-bold text-slate-900 dark:text-white text-[15px] truncate">
                                    ${mail.sender.split('@')[0]}
                                </span>
                                <span class="text-xs text-slate-500 mt-0.5 truncate">Till: <span class="text-slate-700 dark:text-slate-300 font-medium">mig</span> • ${mail.sender}</span>
                            </div>
                        </div>
                        
                        <div class="flex flex-col sm:items-end gap-2 shrink-0">
                            <span class="text-[11px] font-medium text-slate-400 capitalize">${fullDate}</span>
                        </div>
                    </div>

                        <div class="email-body-content w-full">${displayContent}</div>
                        
                        ${attachmentsHtml}
                        
                        <div class="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
                            <div id="replyBoxCollapsed" class="flex items-center gap-4 bg-slate-50 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-slate-700 rounded px-5 py-4 cursor-pointer hover:border-brand-500 transition-all shadow-sm" onclick="window.expandReplyBox()">
                                <div class="w-8 h-8 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xs font-bold"><i data-lucide="reply" class="w-4 h-4"></i></div>
                                <span class="text-slate-500 dark:text-slate-400 font-medium text-sm">Svara ${mail.sender.split('@')[0]}...</span>
                            </div>

                            <div id="replyBoxExpanded" class="hidden flex flex-col gap-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded p-5 shadow-lg animate-fade-in relative">
                                <button onclick="window.collapseReplyBox()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 outline-none transition-colors"><i data-lucide="x" class="w-4 h-4"></i></button>
                                
                                <div class="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/60 pb-4">
                                    <div class="w-8 h-8 rounded bg-brand-500 text-white flex items-center justify-center text-xs font-bold"><i data-lucide="reply" class="w-4 h-4"></i></div>
                                    <span class="text-xs font-bold uppercase tracking-widest text-slate-500">Svara: ${mail.sender}</span>
                                </div>

                                <div class="flex gap-2">
                                    <button onclick="document.getElementById('quickReplyBody').value='Tack, jag kikar på detta!'" class="bg-slate-50 dark:bg-[#1e293b] hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-4 py-2 rounded transition-colors border border-slate-200 dark:border-slate-700 shadow-sm outline-none">👍 Tack</button>
                                    <button onclick="document.getElementById('quickReplyBody').value='Jag ringer dig strax!'" class="bg-slate-50 dark:bg-[#1e293b] hover:bg-brand-50 dark:hover:bg-brand-500/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 px-4 py-2 rounded transition-colors border border-slate-200 dark:border-slate-700 shadow-sm outline-none">📞 Ring mig</button>
                                </div>
                                
                                <textarea id="quickReplyBody" class="w-full min-h-[150px] bg-slate-50 dark:bg-[#0f172a] text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 rounded p-4 resize-none placeholder:text-slate-400 border border-slate-200 dark:border-slate-700" placeholder="Skriv ditt svar här..."></textarea>
                                
                                <div class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/60 mt-2">
                                    <label class="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                                        <input type="checkbox" id="quickReplyReceipt" class="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"> Be om läskvitto
                                    </label>

                                    <button onclick="window.sendQuickReply()" class="bg-brand-500 hover:bg-brand-600 text-white font-bold px-6 py-3 rounded shadow-md shadow-brand-500/20 transition-transform active:scale-95 flex items-center gap-2 outline-none text-sm">
                                        <span>Öppna i E-post</span> <i data-lucide="external-link" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                
                <div class="w-full lg:w-72 xl:w-80 max-w-full lg:max-w-[288px] xl:max-w-[320px] overflow-hidden bg-[#FAFAFA] dark:bg-[#0a0f1c]/50 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 overflow-y-auto no-scrollbar">
                    ${rightColHtml}
                </div>

            </div>
        `;
    }

    if (window.lucide) window.lucide.createIcons();
    const readView = document.getElementById('emailReadView');
    if (readView) readView.classList.remove('translate-x-full');
};

window.expandReplyBox = () => {
    document.getElementById('replyBoxCollapsed').classList.add('hidden');
    document.getElementById('replyBoxExpanded').classList.remove('hidden');
    document.getElementById('quickReplyBody').focus();
};
window.collapseReplyBox = () => {
    document.getElementById('replyBoxExpanded').classList.add('hidden');
    document.getElementById('replyBoxCollapsed').classList.remove('hidden');
};

window.sendQuickReply = () => {
    const mail = currentEmailList.find(m => m.id === currentlyOpenEmailId);
    if(!mail) return;
    
    const bodyText = document.getElementById('quickReplyBody') ? document.getElementById('quickReplyBody').value : '';
    const wantsReceipt = document.getElementById('quickReplyReceipt') ? document.getElementById('quickReplyReceipt').checked : false;
    
    // Lägg till Re: om det saknas
    let subject = mail.subject || 'Inget ämne';
    if (!subject.toLowerCase().startsWith('re:')) subject = `Re: ${subject}`;
    
    // Bygg tidigare historik snyggt i botten av mejlet
    const mailDate = mail.date?.toDate ? mail.date.toDate().toLocaleString('sv-SE') : '';
    const historyText = `\n\n\n--- Ursprungligt meddelande ---\nFrån: ${mail.sender}\nDatum: ${mailDate}\nÄmne: ${mail.subject || ''}\n\n${mail.text || ''}`;
    
    const finalBody = bodyText + historyText;

    let mailtoLink = `mailto:${encodeURIComponent(mail.sender)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(finalBody)}`;
    if (wantsReceipt) mailtoLink += `&Disposition-Notification-To=${encodeURIComponent('mig@bmgmotorgrupp.se')}`;
    
    window.location.href = mailtoLink;
};

window.copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        if (window.showToast) window.showToast("Kopierad till urklipp!", "success");
    });
};

window.printEmail = () => {
    const printContent = document.getElementById('printableEmail').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = `<div style="max-width:800px; margin:0 auto; padding:40px; font-family:sans-serif; color:black !important; background:white !important;">${printContent}</div>`;
    window.print();
    document.body.innerHTML = originalContent;
    location.reload();
};

window.closeEmail = () => {
    const readView = document.getElementById('emailReadView');
    if (readView) readView.classList.add('translate-x-full');

    // Gömmer topplisten igen när vi stänger!
    const topBar = document.querySelector('#emailReadView > div.h-14');
    if (topBar) topBar.classList.remove('hidden');

    currentlyOpenEmailId = null;
    document.querySelectorAll('.mail-list-item').forEach(el => el.classList.remove('bg-slate-100', 'dark:bg-[#1e293b]'));
};

window.toggleTagOnOpenEmail = async (tagId) => {
    if (!currentlyOpenEmailId) return;
    const mail = currentEmailList.find(m => m.id === currentlyOpenEmailId);
    if (!mail) return;
    let currentTags = mail.tags || [];
    if (currentTags.includes(tagId)) currentTags = currentTags.filter(t => t !== tagId);
    else currentTags.push(tagId);
    await updateDoc(doc(db, "inbox", currentlyOpenEmailId), { tags: currentTags });
    if (window.showToast) window.showToast("Tagg uppdaterad", "success");
};

window.addCustomFolder = () => { alert("Skapa ny mapp - kopplas till Firebase här"); };
window.addCustomTag = () => { alert("Skapa ny tagg - kopplas till Firebase här"); };

window.togglePin = async (id, isPinned) => { try { await updateDoc(doc(db, "inbox", id), { pinned: !isPinned }); } catch (e) { } };
window.toggleRead = async (id, isRead) => { try { await updateDoc(doc(db, "inbox", id), { read: !isRead }); window.closeEmail(); } catch (e) { } };
window.moveEmail = async (id, folderName) => { try { await updateDoc(doc(db, "inbox", id), { folder: folderName }); window.closeEmail(); } catch (e) { } };
window.deleteEmailPermanently = async (id) => { if (confirm("Radera permanent?")) { try { await deleteDoc(doc(db, "inbox", id)); window.closeEmail(); } catch (e) { } } };
window.toggleEmailPause = async (checkbox) => { try { await setDoc(doc(db, "system", "settings"), { pauseEmails: checkbox.checked }, { merge: true }); } catch (e) { checkbox.checked = !checkbox.checked; } };

window.toggleEmailSelection = (checkbox, id) => {
    if (checkbox.checked) selectedEmails.add(id); else selectedEmails.delete(id);
    
    // Visuell uppdatering direkt!
    const row = document.getElementById(`mail-item-${id}`);
    if (row) {
        const avatar = row.querySelector('.rounded-full.text-white'); // Profilbilden
        const label = row.querySelector('label'); // Runt checkboxen
        
        if (checkbox.checked) {
            row.classList.add('!bg-brand-50', 'dark:!bg-brand-500/10', 'border-brand-200', 'dark:border-brand-500/30');
            if (avatar) avatar.classList.replace('flex', 'hidden');
            if (label) label.classList.replace('hidden', 'flex');
        } else {
            row.classList.remove('!bg-brand-50', 'dark:!bg-brand-500/10', 'border-brand-200', 'dark:border-brand-500/30');
            if (avatar) avatar.classList.replace('hidden', 'flex');
            if (label) label.classList.replace('flex', 'hidden');
        }
    }
    updateBulkBar();
};

window.toggleAllMails = (checkbox) => {
    const boxes = document.querySelectorAll('.mail-list-item input[type="checkbox"]');
    boxes.forEach(b => { 
        // Om boxen inte redan är som vi vill ha den, ändra den och trigga den visuella uppdateringen
        if (b.checked !== checkbox.checked) {
            b.checked = checkbox.checked; 
            window.toggleEmailSelection(b, b.value); 
        }
    });
    updateBulkBar();
};
window.clearEmailSelection = () => {
    selectedEmails.clear();
    const selAll = document.getElementById('selectAllMails');
    if (selAll) selAll.checked = false;
    document.querySelectorAll('.mail-list-item input[type="checkbox"]').forEach(b => b.checked = false);
    updateBulkBar();
};
function updateBulkBar() {
    const bar = document.getElementById('emailBulkActionBar');
    const count = document.getElementById('emailSelectedCount');
    if (!bar || !count) return;
    if (selectedEmails.size > 0) { 
        count.innerText = `${selectedEmails.size} markerade`; 
        bar.classList.remove('-translate-y-32'); 
        bar.classList.add('translate-y-0');
    } else { 
        bar.classList.remove('translate-y-0');
        bar.classList.add('-translate-y-32'); 
    }
}
window.bulkAction = (action) => {
    if (selectedEmails.size === 0) return;
    selectedEmails.forEach(id => {
        const ref = doc(db, "inbox", id);
        if (action === 'read') updateDoc(ref, { read: true });
        if (action === 'archive') updateDoc(ref, { folder: 'archive', pinned: false });
        if (action === 'trash') updateDoc(ref, { folder: 'trash', pinned: false });
    });
    window.clearEmailSelection();
};

function updateGlobalNotifications(unreadMails) {
    const badge = document.getElementById('globalNotifBadge');
    const list = document.getElementById('notifList');
    if (!badge || !list) return;

    if (unreadMails.length > 0) {
        badge.classList.remove('hidden');
        let notifHtml = '';
        unreadMails.slice(0, 6).forEach(m => {
            const av = getAvatarInfo(m.sender);
            notifHtml += `
                <div onclick="window.goToTab('inbox'); setTimeout(()=>window.openEmail('${m.id}'),200); document.getElementById('notifDropdown').classList.add('hidden')" class="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-800 group">
                    <div class="w-8 h-8 rounded ${av.color} text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">${av.init}</div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-baseline mb-0.5">
                            <span class="text-xs font-bold text-slate-900 dark:text-white truncate pr-2">${m.sender.split('@')[0]}</span>
                            <span class="text-[9px] font-bold text-brand-500 shrink-0">${formatMailDate(m.date)}</span>
                        </div>
                        <div class="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">${m.subject || 'Nytt mejl'}</div>
                    </div>
                </div>
            `;
        });
        list.innerHTML = notifHtml;
    } else {
        badge.classList.add('hidden');
        list.innerHTML = '<div class="p-8 flex flex-col items-center text-slate-400"><i data-lucide="check-circle" class="w-8 h-8 mb-3 opacity-20 text-emerald-500"></i><span class="text-[10px] uppercase tracking-widest font-bold">Allt är läst</span></div>';
    }
    if (window.lucide) window.lucide.createIcons();
}