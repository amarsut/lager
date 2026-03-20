import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, AppState, showToast } from "./core.js";

export function initCMS() {
    loadSettings();
    setupCMSListeners();
}

async function loadSettings() {
    try {
        const snap = await getDoc(doc(db, "site_settings", "main"));
        if (!snap.exists()) return;
        const d = snap.data();
        
        const fields = ['heroBg', 'heroBadge', 'heroTitle1', 'heroTitle2', 'heroSubtitle', 'aboutText', 'metaTitle', 'metaDesc', 'phone', 'email', 'address', 'hoursWeek', 'hoursWeekend', 'instagram', 'facebook', 'bannerText', 'gaId', 'pixelId', 'reviewEmbedCode', 'specialHours'];
        fields.forEach(id => { 
            if(document.getElementById(`cms_${id}`)) document.getElementById(`cms_${id}`).value = d[id] || ''; 
        });
        
        if (d.heroBg) document.getElementById('heroPreviewBox').style.backgroundImage = `url('${d.heroBg}')`;
        if (d.heroBgHistory) AppState.settings.heroBgHistory = d.heroBgHistory;
        if (d.faqs) AppState.settings.faqs = d.faqs;
        if (d.reviews) AppState.settings.reviews = d.reviews;
        
        // Kryssrutor och specialfält
        if(document.getElementById('cms_sendLeadEmails')) document.getElementById('cms_sendLeadEmails').checked = d.sendLeadEmails !== false; 
        if(document.getElementById('cms_showFinance')) document.getElementById('cms_showFinance').checked = d.showFinance !== false; 
        if(document.getElementById('cms_showBanner')) document.getElementById('cms_showBanner').checked = d.showBanner === true;
        if(document.getElementById('cms_financeInterest')) document.getElementById('cms_financeInterest').value = d.financeInterest || 7.95;
        if(document.getElementById('cms_financeDownpay')) document.getElementById('cms_financeDownpay').value = d.financeDownpay || 20;
        if(document.getElementById('cms_useGoogleEmbed')) document.getElementById('cms_useGoogleEmbed').checked = d.useGoogleEmbed === true; 
        
        renderHistoryThumbs(); 
        renderFaqs(); 
        renderReviews();
    } catch (err) {
        console.error("Fel vid laddning av CMS:", err);
    }
}

window.saveSettings = async function() {
    try {
        const newBg = document.getElementById('cms_heroBg').value;
        if (newBg && !AppState.settings.heroBgHistory.includes(newBg)) {
            AppState.settings.heroBgHistory.unshift(newBg);
            if (AppState.settings.heroBgHistory.length > 5) AppState.settings.heroBgHistory.pop();
            renderHistoryThumbs();
        }
        
        const data = { 
            heroBgHistory: AppState.settings.heroBgHistory, 
            faqs: AppState.settings.faqs, 
            reviews: AppState.settings.reviews 
        };
        
        if(document.getElementById('cms_useGoogleEmbed')) data.useGoogleEmbed = document.getElementById('cms_useGoogleEmbed').checked;
        
        const fields = ['heroBg', 'heroBadge', 'heroTitle1', 'heroTitle2', 'heroSubtitle', 'aboutText', 'metaTitle', 'metaDesc', 'phone', 'email', 'address', 'hoursWeek', 'hoursWeekend', 'instagram', 'facebook', 'bannerText', 'gaId', 'pixelId', 'reviewEmbedCode', 'specialHours'];
        fields.forEach(id => { 
            if(document.getElementById(`cms_${id}`)) data[id] = document.getElementById(`cms_${id}`).value; 
        });
        
        if(document.getElementById('cms_sendLeadEmails')) data.sendLeadEmails = document.getElementById('cms_sendLeadEmails').checked;
        if(document.getElementById('cms_showFinance')) data.showFinance = document.getElementById('cms_showFinance').checked;
        if(document.getElementById('cms_showBanner')) data.showBanner = document.getElementById('cms_showBanner').checked;
        if(document.getElementById('cms_financeInterest')) data.financeInterest = parseFloat(document.getElementById('cms_financeInterest').value) || 7.95;
        if(document.getElementById('cms_financeDownpay')) data.financeDownpay = parseFloat(document.getElementById('cms_financeDownpay').value) || 20;
        
        await setDoc(doc(db, "site_settings", "main"), data, { merge: true });
        showToast("Hemsidan uppdaterad!");
    } catch(err) { 
        showToast("Kunde inte spara", "error"); 
    }
}

function renderHistoryThumbs() {
    const container = document.getElementById('heroHistoryContainer'); 
    if(!container) return;
    container.innerHTML = '';
    AppState.settings.heroBgHistory.forEach(url => {
        const t = document.createElement('div');
        t.className = "w-16 h-12 bg-cover bg-center rounded border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-500 shrink-0 shadow-sm";
        t.style.backgroundImage = `url('${url}')`;
        t.onclick = () => { 
            document.getElementById('cms_heroBg').value = url; 
            document.getElementById('heroPreviewBox').style.backgroundImage = `url('${url}')`; 
        };
        container.appendChild(t);
    });
}

function renderFaqs() {
    const container = document.getElementById('faqListContainer'); 
    if(!container) return;
    container.innerHTML = '';
    AppState.settings.faqs.forEach((faq, i) => {
        container.innerHTML += `<div class="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex justify-between gap-4 group transition-colors shadow-sm"><div><div class="font-extrabold text-slate-900 dark:text-white text-sm mb-1">Q: ${faq.q}</div><div class="text-xs text-slate-500 dark:text-slate-400 font-medium">A: ${faq.a}</div></div><button onclick="window.removeFaq(${i})" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`;
    });
    if(window.lucide) window.lucide.createIcons();
}

function renderReviews() {
    const container = document.getElementById('reviewListContainer'); 
    if(!container) return;
    container.innerHTML = '';
    AppState.settings.reviews.forEach((rev, i) => {
        container.innerHTML += `<div class="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex justify-between gap-4 group transition-colors shadow-sm"><div><div class="flex text-brand-500 mb-1">★★★★★</div><div class="font-extrabold text-slate-900 dark:text-white text-sm mb-1">${rev.name}</div><div class="text-xs text-slate-500 dark:text-slate-400 font-medium italic">"${rev.text}"</div></div><button onclick="window.removeReview(${i})" class="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>`;
    });
    if(window.lucide) window.lucide.createIcons();
}

function setupCMSListeners() {
    window.removeReview = (i) => { AppState.settings.reviews.splice(i, 1); renderReviews(); };
    window.removeFaq = (i) => { AppState.settings.faqs.splice(i, 1); renderFaqs(); };

    document.getElementById('addReviewBtn')?.addEventListener('click', () => {
        const name = document.getElementById('newReviewName').value; 
        const text = document.getElementById('newReviewText').value;
        if (name && text) { 
            AppState.settings.reviews.push({ name, text }); 
            renderReviews(); 
            document.getElementById('newReviewName').value = ''; 
            document.getElementById('newReviewText').value = ''; 
        }
    });

    document.getElementById('addFaqBtn')?.addEventListener('click', () => {
        const q = document.getElementById('newFaqQ').value; 
        const a = document.getElementById('newFaqA').value;
        if (q && a) { 
            AppState.settings.faqs.push({ q, a }); 
            renderFaqs(); 
            document.getElementById('newFaqQ').value = ''; 
            document.getElementById('newFaqA').value = ''; 
        }
    });

    // Live preview lyssnare
    document.getElementById('cms_heroBg')?.addEventListener('input', e => document.getElementById('heroPreviewBox').style.backgroundImage = `url('${e.target.value}')`);
    document.getElementById('cms_metaTitle')?.addEventListener('input', e => document.getElementById('seoPreviewTitle').innerText = e.target.value || 'BMG Motorgrupp');
    document.getElementById('cms_metaDesc')?.addEventListener('input', e => document.getElementById('seoPreviewDesc').innerText = e.target.value || 'Beskrivning saknas...');
}