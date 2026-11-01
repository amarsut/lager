document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. INITIALISERING & GLOBALA VARIABLER
    // ==========================================
    if (window.innerWidth > 800) {
        document.body.classList.add('dashboard-mode');
    } else if (/Android|Mobile|Lemur|Kiwi/i.test(navigator.userAgent) || window.innerWidth > 450) {
        document.body.classList.add('mobile-mode');
    }

    const UI = {
        regInput: document.getElementById('reg-input'),
        resultContainer: document.getElementById('result-container'),
        historySection: document.getElementById('history-section'),
        extendedData: document.getElementById('extended-data'),
        toggleBtn: document.getElementById('toggle-data-btn'),
        closeBtn: document.getElementById('close-result-btn'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        historyFilterInput: document.getElementById('history-filter-input'),
        livePulse: document.getElementById('live-pulse'),
        copyAllBtn: document.getElementById('copy-all-btn'),
        smartPasteBtn: document.getElementById('smart-paste-btn'),
        emptyState: document.getElementById('empty-history-state'),
        toast: document.getElementById('toast-container'),
        avatar: document.getElementById('brand-avatar'),
        ocrBtnContainer: document.querySelector('.ocr-btn-container'),
        ocrInput: document.getElementById('ocr-input')
    };

    let STATE = {
        autoSearch: true,
        sound: true,
        cloudSync: true, // NY: Håller koll på om vi ska synka eller inte
        historyLimit: 10,
        defaultEngine: 'combo-ci-om',
        fullHistoryCache: [],
        lastSearchedReg: ''
    };

    // ==========================================
    // 2. HJÄLPFUNKTIONER (Verktyg)
    // ==========================================
    const showToast = (message, type = 'success') => {
        if (!UI.toast) return;
        UI.toast.innerText = message;
        UI.toast.className = `toast show ${type}`;
        setTimeout(() => UI.toast.classList.remove('show'), 2500);
    };

    const playSuccessSound = () => {
        if (!STATE.sound) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } catch (e) { console.log(e); }
    };

    const isValidRenderVal = (val) => val && val !== "SAKNAS" && val !== "-" && String(val).trim() !== "" && val !== "null" && val !== "Okänd modell";
    
    const formatSnyggt = (str) => {
        if (!isValidRenderVal(str)) return str;
        let text = String(str).replace(/(\d),(\d{3})/g, '$1$2').replace(/\bSEK\b/gi, 'kr'); 
        return text.replace(/\b\d{4,}\b/g, (match) => Number(match).toLocaleString('sv-SE'));
    };

    const checkBesiktningStatus = (datumStr) => {
        if (!datumStr || datumStr === '-' || datumStr === 'SAKNAS') return null;
        const dateMatch = String(datumStr).match(/\d{4}-\d{2}-\d{2}/);
        if (!dateMatch) return null;
        
        const targetDate = dateMatch[0];
        const today = new Date().toISOString().split('T')[0];
        const future = new Date();
        future.setMonth(future.getMonth() + 2);
        const twoMonthsStr = future.toISOString().split('T')[0];

        if (targetDate < today) return 'utgangen';
        if (targetDate <= twoMonthsStr) return 'varning';
        return 'giltig';
    };

    // --- Snyggt samlad lista för bilmärken ---
    const getBrandInfo = (modelString) => {
        const str = (modelString || '').toUpperCase();
        const fallback = str.charAt(0) || '?';
        const brands = {
            'AUDI': {id: 'audi', c: '#cc0000'}, 'VOLVO': {id: 'volvo', c: '#003057'}, 'BMW': {id: 'bmw', c: '#0066b1'},
            'VOLKSWAGEN': {id: 'volkswagen', c: '#0055a4'}, 'VW': {id: 'volkswagen', c: '#0055a4'}, 'SKODA': {id: 'skoda', c: '#4da138'},
            'ŠKODA': {id: 'skoda', c: '#4da138'}, 'SEAT': {id: 'seat', c: '#ea002b'}, 'CUPRA': {id: 'cupra', c: '#000000'},
            'PORSCHE': {id: 'porsche', c: '#D32B2B'}, 'OPEL': {id: 'opel', c: '#f68b1e'}, 
            'MERCEDES': {id: null, c: '#333333'}, 'MB': {id: null, c: '#333333'}, /* ID null stoppar 404-felet */
            'FORD': {id: 'ford', c: '#003478'}, 'TOYOTA': {id: 'toyota', c: '#eb0a1e'},
            'RENAULT': {id: 'renault', c: '#DFB100'}, 'PEUGEOT': {id: 'peugeot', c: '#102B4E'}, 'CITROEN': {id: 'citroen', c: '#6E6E6E'},
            'CITROËN': {id: 'citroen', c: '#6E6E6E'}, 'FIAT': {id: 'fiat', c: '#EC1C24'}, 'KIA': {id: 'kia', c: '#05141F'},
            'HYUNDAI': {id: 'hyundai', c: '#002C5F'}, 'NISSAN': {id: 'nissan', c: '#C3002F'}, 'HONDA': {id: 'honda', c: '#EB2226'},
            'MAZDA': {id: 'mazda', c: '#101010'}, 'JEEP': {id: 'jeep', c: '#00824D'}, 'MITSUBISHI': {id: 'mitsubishi', c: '#ED1A3B'},
            'SUZUKI': {id: 'suzuki', c: '#E22718'}, 'SUBARU': {id: 'subaru', c: '#0053A0'}, 'LEXUS': {id: 'lexus', c: '#000000'},
            'CHEVROLET': {id: 'chevrolet', c: '#D3A431'}, 'TESLA': {id: 'tesla', c: '#CC0000'}, 'POLESTAR': {id: 'polestar', c: '#000000'},
            'MINI': {id: 'mini', c: '#000000'}, 'SMART': {id: 'smart', c: '#F3B000'}, 'DACIA': {id: 'dacia', c: '#000000'},
            'ALFA ROMEO': {id: 'alfaromeo', c: '#CC0000'}, 'LAND ROVER': {id: 'landrover', c: '#005A2B'}, 
            'RANGE ROVER': {id: 'landrover', c: '#005A2B'}, 'SAAB': {id: 'saab', c: '#002F6C'}
        };
        for (const key in brands) if (str.includes(key)) return { id: brands[key].id, color: brands[key].c, letter: fallback };
        return { id: null, color: '#0f172a', letter: fallback };
    };

    // ==========================================
    // 3. INSTÄLLNINGAR & LAGRING
    // ==========================================
    const setupToggle = (elId, storageKey, stateKey, toastMsg) => {
        const el = document.getElementById(elId);
        if (!el) return;
        chrome.storage.local.get([storageKey], (res) => {
            STATE[stateKey] = res[storageKey] !== false;
            el.checked = STATE[stateKey];
        });
        el.addEventListener('change', (e) => {
            STATE[stateKey] = e.target.checked;
            chrome.storage.local.set({ [storageKey]: e.target.checked });
            if(toastMsg) showToast(e.target.checked ? `${toastMsg} PÅ` : `${toastMsg} AV`);
        });
    };

    setupToggle('toggle-highlight', 'os_highlight_enabled', 'highlight', 'Autoskanning');
    setupToggle('toggle-autosearch', 'os_autosearch_enabled', 'autoSearch', 'Autosök');
    setupToggle('toggle-sound', 'os_sound_enabled', 'sound', null);
    setupToggle('toggle-cloud-sync', 'os_cloud_sync_enabled', 'cloudSync', 'Molnsynk'); // NY

    const uiScaleSelect = document.getElementById('ui-scale-select');
    if (uiScaleSelect) {
        const defaultScale = document.body.classList.contains('mobile-mode') ? "1" : "1.15"; 
        chrome.storage.local.get(['os_ui_scale'], (res) => {
            uiScaleSelect.value = res.os_ui_scale || defaultScale;
            document.body.style.zoom = uiScaleSelect.value; 
        });
        uiScaleSelect.addEventListener('change', (e) => {
            document.body.style.zoom = e.target.value;
            chrome.storage.local.set({ 'os_ui_scale': e.target.value }); 
            showToast(`Storlek ändrad!`, 'success');
        });
    }

    const historyLimitSelect = document.getElementById('history-limit-select');
    if (historyLimitSelect) {
        chrome.storage.local.get(['os_history_limit'], (res) => {
            if (res.os_history_limit !== undefined) {
                STATE.historyLimit = res.os_history_limit;
                historyLimitSelect.value = STATE.historyLimit;
            }
        });
        historyLimitSelect.addEventListener('change', (e) => {
            STATE.historyLimit = parseInt(e.target.value);
            chrome.storage.local.set({ 'os_history_limit': STATE.historyLimit });
            chrome.storage.local.get(['os_search_history'], (res) => {
                let history = res.os_search_history || [];
                if (STATE.historyLimit === 0) history = [];
                else if (history.length > STATE.historyLimit) history = history.slice(0, STATE.historyLimit);
                chrome.storage.local.set({ 'os_search_history': history }, () => loadHistory());
            });
        });
    }

    const updateEngineUI = (val) => {
        const display = document.getElementById('active-engine-display');
        if (!display) return;
        
        const getIcon = (domain) => `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32">`;
        const iOM = getIcon('oljemagasinet.se');
        const iTS = getIcon('transportstyrelsen.se');
        const iCI = getIcon('car.info');
        const iBU = getIcon('biluppgifter.se');
        const iPlus = `<span style="font-size:10px; font-weight:900; margin:0 3px; color:#94a3b8;">+</span>`;

        const maps = {
            'om': iOM,
            'ts': iTS,
            'ci': iCI,
            'bu': iBU,
            'combo': `<div style="display:flex;align-items:center;">${iBU}${iPlus}${iOM}</div>`,
            'combo-ci-om': `<div style="display:flex;align-items:center;">${iCI}${iPlus}${iOM}</div>`
        };
        
        display.innerHTML = maps[val] || maps['combo-ci-om'];
    };

    const defaultSearchSelect = document.getElementById('default-search-select');
    if (defaultSearchSelect) {
        chrome.storage.local.get(['os_default_search'], (res) => {
            STATE.defaultEngine = res.os_default_search || 'combo-ci-om';
            defaultSearchSelect.value = STATE.defaultEngine;
            updateEngineUI(STATE.defaultEngine);
        });
        defaultSearchSelect.addEventListener('change', (e) => {
            STATE.defaultEngine = e.target.value;
            chrome.storage.local.set({ 'os_default_search': STATE.defaultEngine });
            updateEngineUI(STATE.defaultEngine);
            showToast('Standardsökning uppdaterad');
        });
    }

    const styleBtns = document.querySelectorAll('.style-list-item');
    if (styleBtns.length > 0) {
        // Läs in sparad stil från molnet/localstorage
        chrome.storage.local.get(['os_highlight_style'], (res) => {
            const activeStyle = res.os_highlight_style || 'saas';
            styleBtns.forEach(btn => {
                if (btn.dataset.style === activeStyle) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        });

        // När du klickar på en ny stil i menyn
        styleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stäng inte inställningsmenyn
                styleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const selectedStyle = btn.dataset.style;
                chrome.storage.local.set({ 'os_highlight_style': selectedStyle });
                showToast(`Stil sparad. Ladda om fliken för att se ändringen.`, 'success');
            });
        });
    }

    // ==========================================
    // 4. HISTORIK-HANTERING
    // ==========================================
    const loadHistory = (filterQuery = UI.historyFilterInput ? UI.historyFilterInput.value : '') => {
        chrome.storage.local.get(['os_search_history'], (res) => {
            STATE.fullHistoryCache = res.os_search_history || [];
            renderHistoryList(STATE.fullHistoryCache, filterQuery);
        });
    };

    const saveToHistory = (data) => {
        if (!data.regnr || STATE.historyLimit === 0) return; 
        STATE.lastSearchedReg = data.regnr;
        chrome.storage.local.get(['os_search_history'], (res) => {
            let history = res.os_search_history || [];
            history = history.filter(h => h.regnr !== data.regnr);
            history.unshift(data);
            if (history.length > STATE.historyLimit) history = history.slice(0, STATE.historyLimit);
            chrome.storage.local.set({ 'os_search_history': history }, () => {
                loadHistory();
                // Pushar till molnet BARA om synken är påslagen!
                if (STATE.cloudSync) {
                    saveHistoryToCloud(history).catch(() => console.log("Kunde inte nå molnet, sparar bara lokalt."));
                }
            });
        });
    };

    const deleteHistoryItem = (regnr) => {
        chrome.storage.local.get(['os_search_history'], (res) => {
            let history = (res.os_search_history || []).filter(h => h.regnr !== regnr);
            chrome.storage.local.set({ 'os_search_history': history }, () => {
                loadHistory();
                saveHistoryToCloud(history); // Pushar till molnet
                showToast('Raderad från historik');
            });
        });
    };

    const togglePinStatus = (regnr) => {
        chrome.storage.local.get(['os_search_history'], (res) => {
            let history = res.os_search_history || [];
            let item = history.find(h => h.regnr === regnr);
            if (item) {
                item.isPinned = !item.isPinned;
                chrome.storage.local.set({ 'os_search_history': history }, () => {
                    loadHistory();
                    saveHistoryToCloud(history); // Pushar till molnet
                    if (item.isPinned) showToast('Fordon fastnålat i toppen!', 'success');
                });
            }
        });
    };

    const renderHistoryList = (history, query = '') => {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        historyList.innerHTML = '';
        const isResultOpen = !UI.resultContainer.classList.contains('hidden');

        if (history.length === 0) {
            UI.historySection.classList.toggle('hidden', isResultOpen);
            if (UI.emptyState) UI.emptyState.classList.remove('hidden');
            return;
        }
        
        if (UI.emptyState) UI.emptyState.classList.add('hidden');
        isResultOpen ? UI.historySection.classList.add('hidden') : UI.historySection.classList.remove('hidden');

        const filtered = history.filter(data => {
            const q = query.toLowerCase();
            return (data.regnr && data.regnr.toLowerCase().includes(q)) || 
                   (data.bilmodell && data.bilmodell.toLowerCase().includes(q)) ||
                   (data.motorkod && data.motorkod.toLowerCase().includes(q));
        }).sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));

        if (filtered.length === 0) {
            historyList.innerHTML = '<div style="font-size:10px; color:#94a3b8; text-align:center; padding:16px;">Inga matchande sökningar hittades.</div>';
            return;
        }
        
        filtered.forEach(data => {
            const div = document.createElement('div');
            div.className = `history-item ${data.isPinned ? 'is-pinned' : ''} ${data.regnr === STATE.lastSearchedReg ? 'new-item' : ''}`;
            
            let metaParts = [];
            if (isValidRenderVal(data.motorkod)) metaParts.push(`<span class="meta-main">${data.motorkod}</span>`);
            if (isValidRenderVal(data.oljevolym)) metaParts.push(`<span class="meta-main">${data.oljevolym.replace(/[^0-9.,]/g, '')} L</span>`);
            if (isValidRenderVal(data.arsmodell)) metaParts.push(`<span class="meta-main">${data.arsmodell}</span>`);

            const brand = getBrandInfo(data.bilmodell);
            let avatarHtml = brand.id 
                ? `<div class="history-avatar"><img src="https://cdn.simpleicons.org/${brand.id}" alt="${brand.id}" class="hist-img" data-letter="${brand.letter}" data-color="${brand.color}"></div>`
                : `<div class="history-avatar"><span class="fallback-icon" style="background: ${brand.color};">${brand.letter}</span></div>`;

            // NYTT: Logik för att upptäcka varningar (Avställd eller Obesiktigad)
            const besiktningState = checkBesiktningStatus(data.besiktning);
            const isAvstalld = data.status && (data.status.toLowerCase().includes('avställd') || data.status.toLowerCase().includes('avregistrerad'));
            const isObesi = besiktningState === 'utgangen';
            
            let warningTitle = [];
            if (isAvstalld) warningTitle.push("Avställd");
            if (isObesi) warningTitle.push("Körförbud / Obesiktigad");
            
            let warningHtml = (isAvstalld || isObesi) ? `
                <div class="history-warning-icon" title="${warningTitle.join(' & ')}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fee2e2" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
            ` : '';

            // Hela HTML-konstruktionen inkl. warningHtml
            div.innerHTML = `
                <div class="history-info">
                    ${avatarHtml}
                    <div class="history-left">
                        <span class="history-reg">${data.regnr}</span>
                        <span class="history-model">${data.bilmodell ? data.bilmodell : 'Sparad data'}</span>
                        ${metaParts.length ? `<div class="history-meta-row">${metaParts.join('<span class="meta-divider">•</span>')}</div>` : ''}
                    </div>
                </div>
                <div class="history-actions">
                    ${warningHtml}
                    <button class="pin-btn ${data.isPinned ? 'pinned' : ''}" title="Fäst">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="${data.isPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button class="delete-history-item" title="Ta bort">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>`;

            div.querySelector('.history-info').addEventListener('click', () => {
                renderDataToDOM(data);
                UI.regInput.value = data.regnr;
            });
            div.querySelector('.delete-history-item').addEventListener('click', (e) => { e.stopPropagation(); deleteHistoryItem(data.regnr); });
            div.querySelector('.pin-btn').addEventListener('click', (e) => { e.stopPropagation(); togglePinStatus(data.regnr); });
            
            const histImg = div.querySelector('.hist-img');
            if (histImg) histImg.addEventListener('error', (e) => {
                const p = e.target.parentNode;
                p.innerHTML = `<b>${e.target.dataset.letter}</b>`;
                p.style.background = '#ffffff'; p.style.color = e.target.dataset.color;
            });
            historyList.appendChild(div);
        });
    };

    // ==========================================
    // 5. DATABEHANDLING OCH RENDERING (UI)
    // ==========================================
    const setSkeletonState = () => {
            ['motor-display', 'oil-display', 'year-display', 'first-reg-display', 'milage-display', 'status-display', 'inspection-display', 'gearbox-display', 'fuel-display', 'vin-display', 'valuation-display', 'power-display', 'tax-display', 'consumption-display', 'users-display', 'swedish-display', 'drivetrain-display', 'history-display', 'meter-display', 'owner-history-display'].forEach(id => {
                const el = document.getElementById(id);
            if (el) { el.innerText = ''; el.classList.add('skeleton'); }
        });
        document.getElementById('owner-display-top')?.classList.add('hidden');
        document.getElementById('vin-badge')?.classList.add('hidden');
        updateBrandAvatar('');
    };

    const updateBrandAvatar = (modelString) => {
        if (!UI.avatar) return;
        if (!isValidRenderVal(modelString) || modelString.includes('Hämtar')) {
            UI.avatar.style.cssText = 'width: 48px; height: 48px; font-size: 20px; background: #0f172a; color: #ffffff;';
            UI.avatar.innerHTML = '?';
            return;
        }

        const brand = getBrandInfo(modelString);
        if (brand.id) {
            UI.avatar.style.cssText = 'width: 56px; height: 56px; background: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08);';
            UI.avatar.innerHTML = `<img src="https://cdn.simpleicons.org/${brand.id}" alt="${brand.id}" style="width: 65%; height: 65%; object-fit: contain; display: block; margin: auto;">`;
            UI.avatar.querySelector('img').addEventListener('error', () => {
                UI.avatar.innerHTML = `<b>${brand.letter}</b>`;
                UI.avatar.style.background = brand.color;
                UI.avatar.style.color = '#ffffff';
            });
        } else {
            UI.avatar.style.cssText = `width: 48px; height: 48px; font-size: 20px; background: ${brand.color}; color: #ffffff;`;
            UI.avatar.innerHTML = brand.letter;
        }
    };

    function processIncomingData(newData) {
        if (!newData) return;
        chrome.storage.local.get(['os_search_history', 'os_combo_queue'], (res) => {
            let existingData = (res.os_search_history || []).find(h => h.regnr === newData.regnr) || {};
            let isComboActive = res.os_combo_queue && res.os_combo_queue.length > 0;
            if (!existingData.fieldPriorities) existingData.fieldPriorities = {};

            // ---------------------------------------------------------
            // THE MASTER LOGIC: Vilken sajt har bäst data för vilket fält?
            // 100 = Bäst, 0 = Sämst
            // ---------------------------------------------------------
            const FIELD_WEIGHTS = {
                'motorkod':  { 'AutoSearch_Extension': 100, 'Oljemagasinet_Extension': 90, 'Transportstyrelsen_Extension': 80, 'Car.info_Extension': 60, 'Biluppgifter.se': 50 },
                'oljevolym': { 'AutoSearch_Extension': 100, 'Oljemagasinet_Extension': 90, 'Car.info_Extension': 60, 'Biluppgifter.se': 50 },
                'arsskatt':   { 'AutoSearch_Extension': 100, 'Transportstyrelsen_Extension': 90, 'Biluppgifter.se': 80, 'Car.info_Extension': 70 },
                'besiktning': { 'AutoSearch_Extension': 100, 'Transportstyrelsen_Extension': 90, 'Biluppgifter.se': 80, 'Car.info_Extension': 70 },
                'status':     { 'AutoSearch_Extension': 100, 'Transportstyrelsen_Extension': 90, 'Biluppgifter.se': 80, 'Car.info_Extension': 70 },
                'historik':      { 'AutoSearch_Extension': 100, 'Biluppgifter.se': 90, 'Car.info_Extension': 80, 'Transportstyrelsen_Extension': 30 },
                'matarhistorik': { 'AutoSearch_Extension': 100, 'Biluppgifter.se': 90, 'Car.info_Extension': 80, 'Transportstyrelsen_Extension': 30 },
                'agarhistorik':  { 'AutoSearch_Extension': 100, 'Biluppgifter.se': 90, 'Car.info_Extension': 80, 'Transportstyrelsen_Extension': 50 },
                'bilmodell': { 'AutoSearch_Extension': 100, 'Oljemagasinet_Extension': 90, 'Biluppgifter.se': 80, 'Car.info_Extension': 70, 'Transportstyrelsen_Extension': 60 },
                'default': { 'AutoSearch_Extension': 100, 'Car.info_Extension': 80, 'Biluppgifter.se': 80, 'Transportstyrelsen_Extension': 70, 'Oljemagasinet_Extension': 20 }
            };

            let unifiedNew = {
                regnr: newData.regnr, source: newData.source, motorkod: newData.motorkod || newData.engine,
                oljevolym: newData.oljevolym || newData.oil, oljetyp: newData.oljetyp, effekt: newData.effekt || newData.motoreffekt,
                vin: newData.vin || newData.chassinummer, arsmodell: newData.årsmodell || newData.fordonsår || newData.arsmodell,
                forsta_reg: newData.forsta_reg, /* NYTT: Tillåter datumet att passera! */
                miltal: newData.miltal || newData.mätarställning, status: newData.fordonsstatus || newData.status,
                besiktning: newData.besiktning_senast || newData.besiktning, vaxellada: newData.växellåda || newData.vaxellada,
                drivmedel: newData.drivmedel || newData.ts_fuel, vardering: newData.vardering, agare: newData.agare || newData.ägare,
                arsskatt: newData.årsskatt || newData.arsskatt, forbrukning: newData.förbrukning || newData.forbrukning,
                brukare: newData.brukare, svensksald: newData.svensksåld || newData.svensksald, drivhjul: newData.drivhjul,
                historik: newData.historik, matarhistorik: newData.matarhistorik, agarhistorik: newData.agarhistorik,
                bilmodell: newData.bilmodell || (newData.fabrikat && newData.handelsbeteckning !== "SAKNAS" ? `${newData.fabrikat} ${newData.handelsbeteckning}` : newData.fabrikat)
            };

            let merged = { ...existingData };
            let updated = false;

            for (let key in unifiedNew) {
                if (key === 'regnr' || key === 'source') continue;
                
                let incomingValue = unifiedNew[key];
                
                // Vi gör bara något om den nya datan faktiskt innehåller värdefull information
                if (isValidRenderVal(incomingValue)) {
                    
                    // Kolla vilken vikt den inkommande källan har för detta specifika fält
                    let fieldWeights = FIELD_WEIGHTS[key] || FIELD_WEIGHTS['default'];
                    let incomingWeight = fieldWeights[unifiedNew.source] || 0;
                    
                    // Kolla vad som redan ligger sparat i fältet
                    let currentWeight = merged.fieldPriorities[key] || 0;

                    // Uppdatera OM det inkommande värdet är "starkare", ELLER om vi saknar värde sedan innan
                    if (!isValidRenderVal(merged[key]) || incomingWeight > currentWeight) {
                        merged[key] = incomingValue;
                        merged.fieldPriorities[key] = incomingWeight;
                        updated = true;
                    }
                }
            }

            merged.source = !merged.source ? unifiedNew.source : (updated && merged.source !== unifiedNew.source && !merged.source.includes('KOMB')) ? 'KOMBINERAD DATA' : merged.source;
            merged.regnr = unifiedNew.regnr;

            renderDataToDOM(merged, isComboActive);
            saveToHistory(merged);
            if (!isComboActive) showToast('Fordon Uppdaterat!', 'success');
        });
    }

    const renderDataToDOM = (data, isComboActive = false) => {
        if (UI.livePulse) isComboActive ? UI.livePulse.classList.remove('hidden') : UI.livePulse.classList.add('hidden');
        
        if (UI.avatar) {
            isComboActive ? UI.avatar.classList.add('avatar-loading') : UI.avatar.classList.remove('avatar-loading');
        }

        document.querySelector('.compact-card')?.classList.remove('updating-pulse');
        UI.extendedData?.classList.remove('updating-pulse');

        if(data.regnr) document.getElementById('regnr-display').innerText = data.regnr;
        const pinBtn = document.getElementById('pin-current-btn');
        if (pinBtn) {
            pinBtn.dataset.regnr = data.regnr; // Spara regnr på knappen
            if (data.isPinned) {
                pinBtn.classList.add('is-pinned');
                pinBtn.querySelector('svg').setAttribute('fill', 'currentColor');
            } else {
                pinBtn.classList.remove('is-pinned');
                pinBtn.querySelector('svg').setAttribute('fill', 'none');
            }
        }
        // Hantera varningsikonen i headern
        const headerWarning = document.getElementById('header-warning-icon');
        if (headerWarning) {
            const besiktningState = checkBesiktningStatus(data.besiktning);
            const isAvstalld = data.status && (data.status.toLowerCase().includes('avställd') || data.status.toLowerCase().includes('avregistrerad'));
            const isObesi = besiktningState === 'utgangen';
            
            let warningTitle = [];
            if (isAvstalld) warningTitle.push("Avställd");
            if (isObesi) warningTitle.push("Körförbud / Obesiktigad");
            
            if (warningTitle.length > 0) {
                headerWarning.classList.remove('hidden');
                headerWarning.title = warningTitle.join(' & '); // Visar felet när man hovrar
            } else {
                headerWarning.classList.add('hidden');
            }
        }
        const model = data.bilmodell || 'SAKNAS';
        document.getElementById('model-display').innerText = model;
        updateBrandAvatar(model);

        const badge = document.getElementById('data-source-badge');
        if (badge) {
            // Tvingar badgen att bete sig som en flex-container för ikonerna
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.gap = '4px';
            
            // Smidig funktion som hämtar sidans favicon via Googles API
            const getIcon = (domain) => `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" style="width:14px; height:14px; border-radius:3px;">`;
            
            const iOM = getIcon('oljemagasinet.se');
            const iTS = getIcon('transportstyrelsen.se');
            const iCI = getIcon('car.info');
            const iBU = getIcon('biluppgifter.se');
            const iPlus = `<span style="color:#94a3b8; font-weight:900; font-size:10px;">+</span>`;
            
            let iconHtml = '';
            
            // Bestämmer vilka ikoner som ska visas
            if (isComboActive || data.source === 'KOMBINERAD DATA') {
                iconHtml = STATE.defaultEngine === 'combo' ? `${iBU}${iPlus}${iOM}` : `${iCI}${iPlus}${iOM}`;
            } else if (data.source === 'Oljemagasinet_Extension') iconHtml = iOM;
            else if (data.source === 'Transportstyrelsen_Extension') iconHtml = iTS;
            else if (data.source === 'Car.info_Extension') iconHtml = iCI;
            else if (data.source === 'Biluppgifter.se') iconHtml = iBU;
            else iconHtml = `<span style="font-size:10px;">💾</span>`; // Lokal sparad data

            // Sätter in ikonerna i gränssnittet
            if (isComboActive) {
                badge.innerHTML = `${iconHtml} <span style="margin-left:2px; font-size:8px; color:#f97316; font-weight:800; letter-spacing:0.5px;">SÖKER...</span>`;
                badge.style.borderColor = '#fdba74';
                badge.style.background = '#fff7ed';
            } else {
                badge.innerHTML = iconHtml;
                badge.style.borderColor = '#e2e8f0';
                badge.style.background = '#f1f5f9';
            }
        }
        
        const setValue = (id, val, formatter) => {
            const el = document.getElementById(id);
            if (el) { el.classList.remove('skeleton'); el.innerHTML = isValidRenderVal(val) ? (formatter ? formatter(val) : val) : '-'; }
        };

        let engineSpec = data.bilmodell ? (data.bilmodell.match(/\b(\d\.\d\s*[a-zA-Z\-]+)\b/i) || [])[1] : "";
        engineSpec = engineSpec ? engineSpec.toUpperCase() : "";
        let year = isValidRenderVal(data.arsmodell) ? data.arsmodell : "";

        // Motorkod (endast själva koden utan extra volym/år)
        const motorEl = document.getElementById('motor-display');
        if (motorEl) {
            motorEl.classList.remove('skeleton');
            motorEl.innerText = isValidRenderVal(data.motorkod) ? data.motorkod : '-';
        }

        // Motor & Effekt
        const powerEl = document.getElementById('power-display');
        if (powerEl) {
            powerEl.classList.remove('skeleton');
            let effektStr = isValidRenderVal(data.effekt) ? data.effekt : "";
            if (effektStr && /^\d+([.,]\d+)?$/.test(effektStr.replace(/\s+/g, ''))) effektStr += ' kW';
            const powerLine = [engineSpec, effektStr].filter(Boolean).join(" | ");
            powerEl.innerText = powerLine || '-';
        }

        // Oljevolym (visar enbart liter)
        const oilEl = document.getElementById('oil-display');
        if (oilEl) {
            oilEl.classList.remove('skeleton');
            oilEl.innerHTML = isValidRenderVal(data.oljevolym) ? `${data.oljevolym} L` : '-';
        }

        // Oljetyp (på en helt egen, dedikerad rad)
        const oilTypeEl = document.getElementById('oiltype-display');
        if (oilTypeEl) {
            oilTypeEl.classList.remove('skeleton');
            oilTypeEl.innerText = isValidRenderVal(data.oljetyp) ? data.oljetyp : '-';
        }

        setValue('vin-display', data.vin);
        // ==========================================
        // OEM FILTER (SUPERETKA WAP SCRAPER I FLIK)
        // ==========================================
        const filterTabBtn = document.getElementById('tab-filters-title');
        const fetchEtkaBtn = document.getElementById('fetch-etka-btn');
        const etkaResults = document.getElementById('etka-results');
        
        if (filterTabBtn && fetchEtkaBtn && etkaResults) {
            const brandString = ((data.bilmodell || '') + ' ' + (data.fabrikat || '')).toLowerCase();
            const isVAG = /audi|volkswagen|vw|skoda|seat|cupra|porsche/i.test(brandString);
            
            if (isValidRenderVal(data.vin) && isVAG) {
                filterTabBtn.style.display = 'block'; 
                
                // --- NYTT: Om filtren redan finns sparade (från molnet eller historiken), visa dem direkt! ---
                if (data.vag_filters) {
                    fetchEtkaBtn.classList.add('hidden');
                    etkaResults.innerHTML = data.vag_filters;
                    etkaResults.classList.remove('hidden');
                    
                    // Gör dem klickbara för kopiering även i det sparade läget
                    etkaResults.querySelectorAll('.copyable').forEach(el => {
                        el.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const val = el.querySelector('.value').innerText.replace(/\s+/g, '');
                            if (val && val !== '-') {
                                navigator.clipboard.writeText(val);
                                if (typeof showToast === 'function') showToast(`Kopierade: ${val}`);
                            }
                        });
                    });
                } else {
                    // Annars visar vi knappen precis som vanligt
                    if (!fetchEtkaBtn.dataset.started || fetchEtkaBtn.dataset.vin !== data.vin) {
                        fetchEtkaBtn.dataset.vin = data.vin;
                        fetchEtkaBtn.dataset.started = 'false';
                        etkaResults.classList.add('hidden');
                        fetchEtkaBtn.classList.remove('hidden');
                        fetchEtkaBtn.innerText = 'HÄMTA OEM-FILTER (VAG)';
                        fetchEtkaBtn.style.pointerEvents = 'auto'; 
                        etkaResults.innerHTML = '';
                    }
                }
                
                fetchEtkaBtn.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    if (fetchEtkaBtn.dataset.fetching === 'true') return; 
                    fetchEtkaBtn.dataset.fetching = 'true';
                    
                    fetchEtkaBtn.innerText = 'LADDAR FRÅN SUPERETKA...';
                    fetchEtkaBtn.style.pointerEvents = 'none'; 
                    
                    // 1. Identifiera bränsletyp smart via sparad fordonsdata eller motorkod
                    const vehicleProfile = ((data.drivmedel || '') + ' ' + (data.bilmodell || '') + ' ' + (data.motorkod || '')).toLowerCase();
                    const isDiesel = vehicleProfile.includes('diesel') || vehicleProfile.includes('tdi');
                    const isPetrol = vehicleProfile.includes('bensin') || vehicleProfile.includes('tsi') || vehicleProfile.includes('tfsi') || vehicleProfile.includes('fsi') || vehicleProfile.includes('mpi');
                    
                    // 2. Basdelar som alltid är relevanta
                    let partsToFetch = [
                        { name: 'Oljefilter', code: 'RCO' }, 
                        { name: 'Luftfilter', code: 'RCE' }, 
                        { name: 'Kupéfilter', code: 'RCP' },
                        { name: 'Bränslefilter', code: 'RCK' },
                        { name: 'Kamremssats', code: 'MFS' }
                    ];
                    
                    // 3. Lägg till rätt stift baserat på vad motorn faktiskt har för drivmedel
                    if (isDiesel) {
                        partsToFetch.push({ name: 'Glödstift', code: 'NEG' });
                    } else if (isPetrol) {
                        partsToFetch.push({ name: 'Tändstift', code: 'NEZ' });
                    } else {
                        // Om tillägget av någon anledning inte hittat bränsletyp ännu, ta med båda som säkert kort
                        partsToFetch.push({ name: 'Tändstift', code: 'NEZ' });
                        partsToFetch.push({ name: 'Glödstift', code: 'NEG' });
                    }
                    
                    try {
                        const fetchPromises = partsToFetch.map(async (part) => {
                            try {
                                const res = await fetch(`https://superetka.com/etka/wap.php?cat=spareGroup&vin=${data.vin}&spare=1&spareGroup=${part.code}`);
                                const text = await res.text();
                                
                                const doc = new DOMParser().parseFromString(text, 'text/html');
                                const tds = Array.from(doc.querySelectorAll('td'));
                                let partNumber = '-';
                                
                                for (let td of tds) {
                                    let content = td.textContent.trim();
                                    let cleanContent = content.replace(/[^A-Z0-9]/ig, '').toUpperCase(); 
                                    if (cleanContent.length >= 8 && cleanContent.length <= 14 && !content.includes('ETKA') && !content.includes('Home')) {
                                        
                                        // Formaterar snyggt till ex: "03L 115 562 A" eller "030 115 561 AN"
                                        if (cleanContent.length >= 9) {
                                            let p1 = cleanContent.substring(0, 3);
                                            let p2 = cleanContent.substring(0, 6).substring(3);
                                            let p3 = cleanContent.substring(0, 9).substring(6);
                                            let rest = cleanContent.substring(9);
                                            partNumber = `${p1} ${p2} ${p3}${rest ? ' ' + rest : ''}`;
                                        } else {
                                            partNumber = cleanContent;
                                        }
                                        break;
                                    }
                                }
                                
                                // Om delen saknas, rita inte ut raden!
                                if (partNumber === '-') return '';
                                
                                // EXAKT layout som Historik-fliken!
                                return `
                                <div class="copyable" style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; padding-bottom:6px; margin-bottom:6px; line-height:1.3; cursor:pointer;" title="Klicka för att kopiera">
                                    <div style="display:flex; flex-direction:column; gap:2px; padding-right:12px; min-width:0; flex-grow:1;">
                                        <strong style="color:#0f172a; font-size:11px;">${part.name}</strong>
                                        <span style="color:#64748b; font-size:10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; white-space:normal;">Klicka för att kopiera artikelnummer</span>
                                    </div>
                                    <span class="value" style="color:#0f172a; font-size:11px; font-weight:800; text-align:right; flex-shrink:0; margin-top:1px; white-space:nowrap; letter-spacing:0.5px;">${partNumber}</span>
                                </div>`;
                            } catch (err) {
                                return `
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; padding-bottom:6px; margin-bottom:6px; line-height:1.3;">
                                    <div style="display:flex; flex-direction:column; gap:2px; padding-right:12px; min-width:0; flex-grow:1;">
                                        <strong style="color:#0f172a; font-size:11px;">${part.name}</strong>
                                        <span style="color:#ef4444; font-size:10px;">Sökning misslyckades</span>
                                    </div>
                                    <span style="color:#ef4444; font-size:10px; font-weight:600; text-align:right; flex-shrink:0; margin-top:1px; white-space:nowrap;">Nätverksfel</span>
                                </div>`;
                            }
                        });
                        
                        const resultsArray = await Promise.all(fetchPromises);
                        let html = resultsArray.join('');
                        
                        if (!html.trim()) {
                            html = `<div style="text-align:center; padding: 12px; font-size: 10px; color: #94a3b8;">Inga OEM-delar hittades för detta chassinummer.</div>`;
                        }
                        
                        fetchEtkaBtn.classList.add('hidden');
                        etkaResults.innerHTML = html;
                        etkaResults.classList.remove('hidden');
                        
                        // --- NYTT: Spara ner filtren i fordonsobjektet så de synkas mellan enheter! ---
                        data.vag_filters = html; 
                        saveToHistory(data);
                        
                        // Klick-för-att-kopiera
                        etkaResults.querySelectorAll('.copyable').forEach(el => {
                            el.addEventListener('click', (ev) => {
                                ev.stopPropagation();
                                const val = el.querySelector('.value').innerText.replace(/\s+/g, ''); // Klistra in utan mellanslag!
                                if (val && val !== '-') {
                                    navigator.clipboard.writeText(val);
                                    if (typeof showToast === 'function') showToast(`Kopierade: ${val}`);
                                }
                            });
                        });
                    } catch (fatalError) {
                        fetchEtkaBtn.innerText = 'NÄTVERKSFEL - FÖRSÖK IGEN';
                        fetchEtkaBtn.style.pointerEvents = 'auto';
                        fetchEtkaBtn.dataset.fetching = 'false';
                    }
                };
            } else {
                filterTabBtn.style.display = 'none'; 
            }
        }
        if (document.getElementById('vin-badge')) document.getElementById('vin-badge').classList.toggle('hidden', !(data.vin && data.vin.length === 17));
        setValue('year-display', data.arsmodell);
        setValue('first-reg-display', data.forsta_reg);
        setValue('milage-display', data.miltal, formatSnyggt);
        setValue('valuation-display', data.vardering, (v) => {
            if (v && v.startsWith('{')) {
                try {
                    const valObj = JSON.parse(v);
                    
                    const getDot = (color) => {
                        const colors = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444', gray: '#94a3b8' };
                        return `<span class="val-dot" style="background-color:${colors[color] || colors.gray};"></span>`;
                    };

                    const carIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.2-.7-1.8-.7H5c-.6 0-1.3.2-1.8.7C2.3 8.6 1 10 1 10s-2.7.6-3.5 1.1C-.3 11.3 -1 12.1 -1 13v3c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle></svg>`;
                    
                    const personIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;

                    return `<div class="val-container" style="display:flex; flex-direction:column; gap:6px;">
                        ${valObj.fPrice && valObj.fPrice !== "SAKNAS" ? `<div class="val-single" title="Företagsvärdering" style="display:flex; align-items:center; justify-content:space-between; width:100%;"><span style="display:inline-flex; align-items:center; color:#475569; font-size:11px; font-weight:700;">${carIcon} Företag</span><div style="display:flex; align-items:center; gap:8px;">${getDot(valObj.fLight)} <span class="val-price">${valObj.fPrice}</span></div></div>` : ''}
                        ${valObj.pPrice && valObj.pPrice !== "SAKNAS" ? `<div class="val-single" title="Privatvärdering" style="display:flex; align-items:center; justify-content:space-between; width:100%;"><span style="display:inline-flex; align-items:center; color:#475569; font-size:11px; font-weight:700;">${personIcon} Privat</span><div style="display:flex; align-items:center; gap:8px;">${getDot(valObj.pLight)} <span class="val-price">${valObj.pPrice}</span></div></div>` : ''}
                    </div>`;
                } catch(e) {}
            }

            let clean = formatSnyggt(v);
            return `<span style="font-size: 14.5px; white-space: nowrap;">${clean}</span>`;
        });
        setValue('status-display', data.status);
        setValue('inspection-display', data.besiktning);
        setValue('gearbox-display', data.vaxellada);
        setValue('fuel-display', data.drivmedel);
        setValue('tax-display', data.arsskatt, formatSnyggt); 
        setValue('consumption-display', data.forbrukning);
        setValue('users-display', data.brukare);
        setValue('swedish-display', data.svensksald);
        setValue('drivetrain-display', data.drivhjul);

        // Ägarhistorik (Visar 2 rader som standard, resten via knapp i hörnet)
        const ownerHistEl = document.getElementById('owner-history-display');
        const ownerToggleBtn = document.getElementById('toggle-owner-btn');
        
        if (ownerHistEl) {
            ownerHistEl.classList.remove('skeleton');
            if (data.agarhistorik && data.agarhistorik.length > 0) {
                let html = '<div style="display:flex; flex-direction:column; gap:0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">';
                
                data.agarhistorik.forEach((o, index) => {
                    let t = o.type.toLowerCase();
                    let dotColor = '#3b82f6'; // Standard blå
                    if (t.includes('privatperson')) dotColor = '#22c55e'; // Grön
                    else if (t.includes('bilhandlar') || t.includes('bilhandlare')) dotColor = '#f97316'; // Orange
                    else if (t.includes('företag')) dotColor = '#10b981'; // Turkos/Grön
                    else if (t.includes('finans') || t.includes('leasing')) dotColor = '#eab308'; // Gul

                    let borderStyle = index > 0 ? 'border-top: 1px solid #f1f5f9;' : '';
                    let hiddenClass = index >= 4 ? 'owner-hidden-item hidden' : '';

                    // Skapa söksträng för Hitta.se (plockar namn/företag + ort från beskrivningen)
                    let searchTarget = "";
                    let cleanDesc = o.desc;
                    let fromMatch = o.desc.match(/(?:från|i)\s+([A-ÖÅ][a-öåäöA-ÖÅ\s-]{1,20}?\b)(?=\s+ägde|\s+har|\s+hade|\s+använt|\s+och|\s+eller|\.?\s+i)/i);
                    let ort = fromMatch ? fromMatch[1].trim() : "";
                    
                    let namePart = o.desc.replace(/^(Privatperson|Bilhandlare|Företag|Finans\s*\/\s*Leasingbolag|Dödsbo)\s+/i, '');
                    if (ort) {
                        namePart = namePart.split(new RegExp(`\\s+(?:från|i)\\s+${ort}`, 'i'))[0];
                    }
                    searchTarget = (namePart + " " + ort).trim();

                    // Formatera beskrivningen så att BARA namnet/företaget blir en markerad länk
                    let formattedDescHtml = cleanDesc;
                    if (namePart && cleanDesc.includes(namePart)) {
                        let encodedSearch = encodeURIComponent(searchTarget);
                        let linkHtml = `<span class="owner-link-text" data-search="${encodedSearch}" title="Sök på Hitta.se: ${searchTarget}">${namePart}</span>`;
                        formattedDescHtml = cleanDesc.replace(namePart, linkHtml);
                    }

                    html += `
                    <div class="${hiddenClass}" style="display:flex; justify-content:space-between; align-items:flex-start; background:#ffffff; padding:8px 10px; ${borderStyle} line-height:1.3;">
                        <div style="display:flex; align-items:flex-start; gap:8px; flex-grow:1; min-width:0; padding-right:8px;">
                            <span style="width:8px; height:8px; background-color:${dotColor}; border-radius:50%; flex-shrink:0; margin-top:4px;"></span>
                            <div style="display:flex; flex-direction:column; gap:1px; min-width:0;">
                                <strong style="color:#0f172a; font-size:11px;">${o.type}</strong>
                                <span style="color:#64748b; font-size:10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; white-space:normal;">${formattedDescHtml}</span>
                            </div>
                        </div>
                        <span style="color:#64748b; font-size:10px; font-weight:600; text-align:right; width:70px; flex-shrink:0; margin-top:2px; white-space:nowrap;">${o.date}</span>
                    </div>`;
                });
                html += '</div>';
                ownerHistEl.innerHTML = html;

                // Ge namnen i ägarhistoriken klickfunktion till Hitta.se
                ownerHistEl.querySelectorAll('.owner-link-text').forEach(span => {
                    span.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let query = decodeURIComponent(span.dataset.search);
                        navigator.clipboard.writeText(query).catch(()=>{});
                        showToast(`Söker på Hitta.se: ${query}`);
                        chrome.tabs.create({ url: `https://www.hitta.se/sök?vad=${encodeURIComponent(query)}` });
                    });
                });
                
                if (ownerToggleBtn) {
                    if (data.agarhistorik.length > 4) {
                        ownerToggleBtn.style.display = 'block';
                        ownerToggleBtn.innerText = `VISA (${data.agarhistorik.length - 4} TILL) ⌄`;
                        
                        let newBtn = ownerToggleBtn.cloneNode(true);
                        ownerToggleBtn.parentNode.replaceChild(newBtn, ownerToggleBtn);
                        
                        newBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const hiddenItems = ownerHistEl.querySelectorAll('.owner-hidden-item');
                            if (hiddenItems.length > 0) {
                                const isHidden = hiddenItems[0].classList.contains('hidden');
                                hiddenItems.forEach(item => {
                                    if (isHidden) item.classList.remove('hidden');
                                    else item.classList.add('hidden');
                                });
                                newBtn.innerText = isHidden ? 'DÖLJ ⌃' : `VISA (${data.agarhistorik.length - 4} TILL) ⌄`;
                            }
                        });
                    } else {
                        ownerToggleBtn.style.display = 'none';
                    }
                }
            } else {
                ownerHistEl.innerHTML = '<span style="color:#94a3b8; font-size:11px;">Hämtade ingen ägarhistorik</span>';
                if (ownerToggleBtn) ownerToggleBtn.style.display = 'none';
            }
        }

        // NYTT: Rita ut historiklistan (Med färgkodning)
        const histEl = document.getElementById('history-display');
        const historyToggleBtn = document.getElementById('toggle-history-btn');
        
        if (histEl) {
            histEl.classList.remove('skeleton');
            if (data.historik && data.historik.length > 0) {
                let html = '<div style="display:flex; flex-direction:column; gap:6px; margin-top: 4px;">';
                
                data.historik.forEach((h, index) => {
                    let formattedDesc = h.desc;
                    formattedDesc = formattedDesc.replace(/Ej godkänd/gi, '%%EJ_GODKAND%%');
                    formattedDesc = formattedDesc.replace(/Godkänd/gi, '%%GODKAND%%');
                    formattedDesc = formattedDesc.replace(/%%EJ_GODKAND%%/g, '<span style="color:#ef4444; font-weight:800;">Ej godkänd</span>');
                    formattedDesc = formattedDesc.replace(/%%GODKAND%%/g, '<span style="color:#10b981; font-weight:800;">Godkänd</span>');

                    // Göm alla händelser efter de 4 första som standard
                    let hiddenClass = index >= 4 ? 'history-hidden-item hidden' : '';

                    html += `
                    <div class="${hiddenClass}" style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; padding-bottom:6px; line-height:1.3;">
                        <div style="display:flex; flex-direction:column; gap:2px; padding-right:12px; min-width:0; flex-grow:1;">
                            <strong style="color:#0f172a; font-size:11px;">${h.title}</strong>
                            <span style="color:#64748b; font-size:10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; white-space:normal;" title="${h.desc}">${formattedDesc}</span>
                        </div>
                        <span style="color:#64748b; font-size:10px; font-weight:600; text-align:right; width:70px; flex-shrink:0; margin-top:1px; white-space:nowrap;">${h.date}</span>
                    </div>`;
                });
                html += '</div>';
                histEl.innerHTML = html;
                
                if (historyToggleBtn) {
                    if (data.historik.length > 4) {
                        historyToggleBtn.style.display = 'block';
                        historyToggleBtn.innerText = `VISA (${data.historik.length - 4} TILL) ⌄`;
                        
                        let newBtn = historyToggleBtn.cloneNode(true);
                        historyToggleBtn.parentNode.replaceChild(newBtn, historyToggleBtn);
                        
                        newBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const hiddenItems = histEl.querySelectorAll('.history-hidden-item');
                            if (hiddenItems.length > 0) {
                                const isHidden = hiddenItems[0].classList.contains('hidden');
                                hiddenItems.forEach(item => {
                                    if (isHidden) item.classList.remove('hidden');
                                    else item.classList.add('hidden');
                                });
                                newBtn.innerText = isHidden ? 'DÖLJ ⌃' : `VISA (${data.historik.length - 4} TILL) ⌄`;
                            }
                        });
                    } else {
                        historyToggleBtn.style.display = 'none';
                    }
                }
            } else {
                histEl.innerHTML = '<span style="color:#94a3b8; font-size:11px;">Hämtade ingen historik</span>';
                if (historyToggleBtn) historyToggleBtn.style.display = 'none';
            }
        }

        // Mätarhistorik (Visar 2 rader som standard, resten via knapp)
        const meterEl = document.getElementById('meter-display');
        const meterToggleBtn = document.getElementById('toggle-meter-btn');
        const meterTabTitle = document.getElementById('tab-meter-title'); // Hämta flikens titel
        
        if (meterEl) {
            meterEl.classList.remove('skeleton');
            if (data.matarhistorik && data.matarhistorik.length > 0) {
                
                // --- NYTT: Sätt in senaste miltalet i flik-rubriken ---
                if (meterTabTitle) {
                    meterTabTitle.innerHTML = `MILTAL <span style="white-space: nowrap;">(${data.matarhistorik[0].mil})</span>`;
                }
                
                let html = '<div style="display:flex; flex-direction:column; gap:0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">';
                
                data.matarhistorik.forEach((m, index) => {
                    let t = m.type.toLowerCase();
                    let dotColor = '#94a3b8';
                    if (t.includes('uppskattning') || t.includes('idag')) dotColor = '#22c55e';
                    else if (t.includes('service')) dotColor = '#3b82f6';
                    else if (t.includes('besiktning') || t.includes('kontrollbes')) dotColor = '#f59e0b';
                    else if (t.includes('annons') || t.includes('registrerad')) dotColor = '#64748b';

                    let borderStyle = index > 0 ? 'border-top: 1px solid #f1f5f9;' : '';
                    // Göm alla rader efter de 2 första som standard
                    let hiddenClass = index >= 4 ? 'meter-hidden-item hidden' : '';

                    html += `
                    <div class="${hiddenClass}" style="display:flex; justify-content:space-between; align-items:center; background:#ffffff; padding:8px 10px; ${borderStyle}">
                        <div style="display:flex; align-items:center; gap:8px; flex-grow:1; min-width:0; padding-right:8px;">
                            <span style="width:8px; height:8px; background-color:${dotColor}; border-radius:50%; flex-shrink:0;"></span>
                            <span style="color:#0f172a; font-size:11px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${m.type}">
                                ${m.type}
                            </span>
                        </div>
                        <div style="display:flex; align-items:center; gap:16px; flex-shrink:0;">
                            <span style="color:#0f172a; font-size:11px; font-weight:800; text-align:right; width:75px;">${m.mil}</span>
                            <span style="color:#64748b; font-size:10px; font-weight:600; text-align:right; width:70px;">${m.date}</span>
                        </div>
                    </div>`;
                });
                html += '</div>';
                meterEl.innerHTML = html;
                
                if (meterToggleBtn) {
                    if (data.matarhistorik.length > 4) {
                        meterToggleBtn.style.display = 'block';
                        meterToggleBtn.innerText = `VISA (${data.matarhistorik.length - 4} TILL) ⌄`;
                        
                        let newBtn = meterToggleBtn.cloneNode(true);
                        meterToggleBtn.parentNode.replaceChild(newBtn, meterToggleBtn);
                        
                        newBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            const hiddenItems = meterEl.querySelectorAll('.meter-hidden-item');
                            if (hiddenItems.length > 0) {
                                const isHidden = hiddenItems[0].classList.contains('hidden');
                                hiddenItems.forEach(item => {
                                    if (isHidden) item.classList.remove('hidden');
                                    else item.classList.add('hidden');
                                });
                                newBtn.innerText = isHidden ? 'DÖLJ ⌃' : `VISA (${data.matarhistorik.length - 4} TILL) ⌄`;
                            }
                        });
                    } else {
                        meterToggleBtn.style.display = 'none';
                    }
                }
            } else {
                if (meterTabTitle) meterTabTitle.innerText = `MILTAL`; // Återställ rubriken
                meterEl.innerHTML = '<span style="color:#94a3b8; font-size:11px;">Hämtade ingen mätarhistorik</span>';
                if (meterToggleBtn) meterToggleBtn.style.display = 'none';
            }
        }

        const ownerTop = document.getElementById('owner-display-top');
        if (isValidRenderVal(data.agare) && ownerTop) {
            ownerTop.classList.remove('hidden');
            document.getElementById('owner-text').innerText = data.agare;
            ownerTop.onclick = (e) => {
            e.stopPropagation(); 

            // Plockar ut Namn (allt före parentesen)
            let namnMatch = data.agare.match(/^(.*?)\s*\(/);
            let namn = namnMatch ? namnMatch[1].trim() : data.agare;

            // Plockar ut Stad (allt mellan parentesen och första kommatecknet)
            let stadMatch = data.agare.match(/\(([^,)]+)/);
            let stad = stadMatch ? stadMatch[1].trim() : "";

            // Bygger den rena söksträngen
            let renAgarInfo = (namn + ' ' + stad).trim();

            navigator.clipboard.writeText(renAgarInfo).catch(()=>{});
            showToast(`Kopierade: ${renAgarInfo}`);
            chrome.tabs.create({ url: `https://www.hitta.se/sök?vad=${encodeURIComponent(renAgarInfo)}` });
        };
        } else if (ownerTop) {
            ownerTop.classList.add('hidden');
            ownerTop.onclick = null;
        }

        const statusCard = document.getElementById('status-display')?.closest('.data-card');
        if (statusCard) {
            statusCard.classList.remove('status-i-trafik', 'status-avstalld');
            // KORRIGERAD: Letar nu efter "påställ" så den fångar både Påställd och Påställt!
            if (isValidRenderVal(data.status)) statusCard.classList.add(data.status.toLowerCase().includes('trafik') || data.status.toLowerCase().includes('påställ') ? 'status-i-trafik' : 'status-avstalld');
        }

        const inspCard = document.getElementById('inspection-display')?.closest('.data-card');
        if (inspCard) {
            inspCard.classList.remove('besiktning-giltig', 'besiktning-varning', 'besiktning-utgangen');
            const status = checkBesiktningStatus(data.besiktning);
            if (status) inspCard.classList.add(`besiktning-${status}`);
        }

        UI.historySection.classList.add('hidden');
        if (UI.emptyState) UI.emptyState.classList.add('hidden');
        UI.resultContainer.classList.remove('hidden');

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (!isComboActive && (data.vin || data.motorkod || data.oljevolym)) playSuccessSound();
    };

    // ==========================================
    // 5.5 LAYOUT MANAGER & DRAG-AND-DROP
    // ==========================================
    const Layout = {
        isEditing: false, draggedEl: null, ghost: null,
        
        init() {
            this.btn = document.getElementById('edit-layout-btn');
            this.resetBtn = document.getElementById('reset-layout-btn');
            this.zones = [document.getElementById('zone-upper'), document.getElementById('zone-lower'), document.getElementById('zone-hidden')];
            this.hiddenWrapper = document.getElementById('zone-hidden-wrapper');
            this.cards = document.querySelectorAll('.drag-card');
            
            chrome.storage.local.get(['os_card_layout'], (res) => { if (res.os_card_layout) this.applyLayout(res.os_card_layout); });
            
            if(this.btn) this.btn.addEventListener('click', () => this.toggleEditMode());
            if(this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetLayout());
            
            this.setupDragEvents();
        },

        toggleEditMode() {
            this.isEditing = !this.isEditing;
            document.body.classList.toggle('edit-mode', this.isEditing);
            this.hiddenWrapper.classList.toggle('hidden', !this.isEditing);
            document.querySelector('.edit-only')?.classList.toggle('hidden', !this.isEditing);
            this.resetBtn?.classList.toggle('hidden', !this.isEditing);
            
            if (this.isEditing) {
                this.btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
                this.btn.classList.add('active-edit-btn');
                UI.extendedData?.classList.remove('hidden'); 
                if (UI.toggleBtn) UI.toggleBtn.innerText = 'GÖM SPECIFIKATIONER ⌃';
                // Vi stänger av HTML5 drag för att använda vår egen skräddarsydda mus-spårning
                this.cards.forEach(c => c.removeAttribute('draggable'));
            } else {
                this.btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>';
                this.btn.classList.remove('active-edit-btn');
                this.saveLayout(); 
                showToast('Layout sparad!', 'success');
            }
        },

        resetLayout() {
            if(confirm("Vill du återställa korten och färgerna till standard?")) {
                // NYTT: Raderar BÅDE layouten och färgerna från databasen
                chrome.storage.local.remove(['os_card_layout', 'os_card_colors'], () => {
                    showToast('Layout och färger återställda!', 'success');
                    setTimeout(() => window.location.reload(), 300);
                });
            }
        },

        applyLayout(layout) {
            this.zones.forEach(zone => {
                if (!zone) return;
                (layout[zone.id] || []).forEach(id => { const card = document.getElementById(id); if (card) zone.appendChild(card); });
            });
        },

        saveLayout() {
            const layout = {};
            this.zones.forEach(zone => { if(zone) layout[zone.id] = Array.from(zone.querySelectorAll('.drag-card')).map(c => c.id); });
            chrome.storage.local.set({ 'os_card_layout': layout });
        },

        setupDragEvents() {
            let scrollRAF;
            let currentY = 0;

            // Den mjuka auto-scroll-motorn
            const autoScrollLoop = () => {
                if (!this.draggedEl) return;
                
                const edge = 60; // Hur nära kanten (i pixlar) man måste vara för att scrolla
                const maxSpeed = 12; // Hastigheten på scrollen
                
                if (currentY < edge) {
                    window.scrollBy(0, -maxSpeed); // Scrolla uppåt
                } else if (currentY > window.innerHeight - edge) {
                    window.scrollBy(0, maxSpeed); // Scrolla nedåt
                }
                
                scrollRAF = requestAnimationFrame(autoScrollLoop);
            };

            const startDrag = (e, card) => {
                if (!this.isEditing) return;
                if (e.type === 'mousedown' && e.button !== 0) return;
                
                // STARTA BARA OM MAN KLICKAR EXAKT PÅ HANDTAGET
                if (!e.target.closest('.drag-handle')) return;
                
                e.preventDefault(); 
                document.body.style.overflow = 'hidden'; 
                this.draggedEl = card; 
                const rect = card.getBoundingClientRect();
                
                this.ghost = card.cloneNode(true); 
                this.ghost.classList.add('touch-ghost');
                this.ghost.style.width = rect.width + 'px'; 
                this.ghost.style.height = rect.height + 'px';
                this.ghost.style.pointerEvents = 'none'; 
                document.body.appendChild(this.ghost); 
                
                card.classList.add('dragging');
                
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                currentY = e.touches ? e.touches[0].clientY : e.clientY;
                this.moveGhost(clientX, currentY);

                // Starta den mjuka auto-scrollen
                scrollRAF = requestAnimationFrame(autoScrollLoop);
            };

            const moveDrag = (e) => {
                if (!this.isEditing || !this.draggedEl) return;
                e.preventDefault(); 
                
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                currentY = e.touches ? e.touches[0].clientY : e.clientY;
                this.moveGhost(clientX, currentY);
                
                const elUnder = document.elementFromPoint(clientX, currentY);
                const dropZone = elUnder?.closest('.drop-zone');
                
                this.zones.forEach(z => z.classList.remove('drag-over'));
                if (dropZone) {
                    dropZone.classList.add('drag-over');
                    const after = this.getDragAfter(dropZone, currentY);
                    if (after == null) dropZone.appendChild(this.draggedEl); 
                    else dropZone.insertBefore(this.draggedEl, after);
                }
            };

            const endDrag = () => {
                if (!this.isEditing || !this.draggedEl) return;
                document.body.style.overflow = ''; 
                this.draggedEl.classList.remove('dragging');
                this.zones.forEach(z => z.classList.remove('drag-over'));
                if (this.ghost) this.ghost.remove(); 
                this.draggedEl = null; 
                this.ghost = null;
                
                // Stoppa auto-scrollen när kortet släpps
                cancelAnimationFrame(scrollRAF); 
            };

            this.cards.forEach(card => {
                card.addEventListener('mousedown', e => startDrag(e, card));
                card.addEventListener('touchstart', e => startDrag(e, card), {passive: false});
            });

            document.addEventListener('mousemove', moveDrag, {passive: false});
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchmove', moveDrag, {passive: false});
            document.addEventListener('touchend', endDrag);
        },

        moveGhost(x, y) { 
            if (this.ghost) { 
                this.ghost.style.left = (x - this.ghost.offsetWidth / 2) + 'px'; 
                this.ghost.style.top = (y - this.ghost.offsetHeight / 2) + 'px'; 
            } 
        },

        getDragAfter(container, y) {
            return [...container.querySelectorAll('.drag-card:not(.dragging)')].reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    };
    Layout.init();

    // ==========================================
    // KORT-FÄRGER (HIGHLIGHTS)
    // ==========================================
    // ==========================================
    // KORT-FÄRGER (HIGHLIGHTS) - CENTRAL MODAL
    // ==========================================
    const CardColors = {
        themes: [
            'theme-gray', 'theme-red', 'theme-orange', 'theme-yellow', 
            'theme-green', 'theme-teal', 'theme-blue', 'theme-purple', 
            'theme-pink', 'theme-dark'
        ],
        savedColors: {},
        activeCardId: null,

        init() {
            chrome.storage.local.get(['os_card_colors'], (res) => {
                if (res.os_card_colors) {
                    this.savedColors = res.os_card_colors;
                    this.applyAll();
                }
            });
            this.buildModal();
            this.injectEditButtons();
        },

        applyAll() {
            for (const [cardId, theme] of Object.entries(this.savedColors)) {
                const card = document.getElementById(cardId);
                if (card && theme) card.classList.add(theme);
            }
        },

        setTheme(theme) {
            if (!this.activeCardId) return;
            const card = document.getElementById(this.activeCardId);
            if (!card) return;

            // Ta bort gamla färgteman
            this.themes.forEach(t => card.classList.remove(t));
            
            if (theme && theme !== 'theme-default') {
                card.classList.add(theme);
                this.savedColors[this.activeCardId] = theme;
            } else {
                delete this.savedColors[this.activeCardId];
            }

            // Spara färgerna i databasen
            chrome.storage.local.set({ 'os_card_colors': this.savedColors });
            this.closeModal();
            if (typeof showToast === 'function') showToast('Kortfärg sparad!');
        },

        buildModal() {
            // Skapa den fasta rutan som lägger sig över hela skärmen
            const modal = document.createElement('div');
            modal.id = 'color-picker-modal';
            modal.className = 'hidden';
            modal.innerHTML = `
                <div class="color-modal-overlay"></div>
                <div class="color-modal-content">
                    <div class="color-modal-header">
                        <span style="font-size:11px; font-weight:800; color:#475569; letter-spacing:0.5px;">VÄLJ FÄRG FÖR KORTET</span>
                        <button class="close-color-modal" title="Stäng">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                    <div class="color-modal-grid">
                        <button class="modal-color-btn btn-default" data-theme="theme-default" title="Standard (Vit)"></button>
                        <button class="modal-color-btn btn-gray" data-theme="theme-gray" title="Grå"></button>
                        <button class="modal-color-btn btn-red" data-theme="theme-red" title="Röd"></button>
                        <button class="modal-color-btn btn-orange" data-theme="theme-orange" title="Orange"></button>
                        <button class="modal-color-btn btn-yellow" data-theme="theme-yellow" title="Gul"></button>
                        <button class="modal-color-btn btn-green" data-theme="theme-green" title="Grön"></button>
                        <button class="modal-color-btn btn-teal" data-theme="theme-teal" title="Turkos"></button>
                        <button class="modal-color-btn btn-blue" data-theme="theme-blue" title="Blå"></button>
                        <button class="modal-color-btn btn-purple" data-theme="theme-purple" title="Lila"></button>
                        <button class="modal-color-btn btn-pink" data-theme="theme-pink" title="Rosa"></button>
                        <button class="modal-color-btn btn-dark" data-theme="theme-dark" title="Svart"></button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Stängning
            modal.querySelector('.color-modal-overlay').addEventListener('click', () => this.closeModal());
            modal.querySelector('.close-color-modal').addEventListener('click', () => this.closeModal());
            
            // Färgklick
            modal.querySelectorAll('.modal-color-btn').forEach(btn => {
                btn.addEventListener('click', () => this.setTheme(btn.dataset.theme));
            });
        },

        openModal(cardId) {
            this.activeCardId = cardId;
            document.getElementById('color-picker-modal').classList.remove('hidden');
        },

        closeModal() {
            this.activeCardId = null;
            document.getElementById('color-picker-modal').classList.add('hidden');
        },

        injectEditButtons() {
            document.querySelectorAll('.drag-card').forEach(card => {
                // Sätt inte färgknapp på kombinerade historikkortet eller externa länkar
                if (card.id === 'card-combined-history' || card.id === 'card-links') return; 

                const btn = document.createElement('button');
                btn.className = 'card-paint-btn';
                btn.title = 'Ändra färg på kort';
                // En snygg färgpalett-ikon
                btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>`;

                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openModal(card.id);
                });

                card.appendChild(btn);
            });
        }
    };
    CardColors.init();

    // ==========================================
    // 6. BAKGRUNDSSYNK (Mobile & PC)
    // ==========================================
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mobile_return') === 'true') {
        window.history.replaceState({}, document.title, window.location.pathname);
        const checkData = (retries) => {
            chrome.storage.local.get(['fordonsdata_result', 'fordonsdata_combo_buffer'], (res) => {
                let foundData = false;
                if (res.fordonsdata_combo_buffer && res.fordonsdata_combo_buffer.length > 0) {
                    res.fordonsdata_combo_buffer.forEach((data, index) => setTimeout(() => processIncomingData(data), index * 300));
                    chrome.storage.local.remove('fordonsdata_combo_buffer');
                    foundData = true;
                }
                if (res.fordonsdata_result) {
                    chrome.storage.local.remove('fordonsdata_result');
                    processIncomingData(res.fordonsdata_result);
                    foundData = true;
                }
                if (foundData) setTimeout(() => showToast('Fordon Uppdaterat!', 'success'), 600);
                else if (retries > 0) setTimeout(() => checkData(retries - 1), 500);
                else showToast('Kunde inte läsa in data från skraparen', 'error');
            });
        };
        checkData(5);
    }

    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.fordonsdata_result) processIncomingData(changes.fordonsdata_result.newValue);
            if (changes.fordonsdata_combo_buffer && changes.fordonsdata_combo_buffer.newValue) {
                const buff = changes.fordonsdata_combo_buffer.newValue;
                if (buff.length > 0) processIncomingData(buff[buff.length - 1]);
            }
        }
    });

    // ==========================================
    // 7. SÖKNING OCH SKRAPNING (OCR & API)
    // ==========================================
    let isSearchingActive = false; // Spärr mot dubbla sök-fönster
    
    const triggerSearch = (type) => {
        if (isSearchingActive) return; // Avbryt om sökning redan pågår!
        
        let regnr = UI.regInput.value.trim().toUpperCase();
        if (!regnr) {
            const displayReg = document.getElementById('regnr-display').innerText.trim().toUpperCase();
            if (displayReg && displayReg !== '-' && !displayReg.includes('VÄNTAR')) regnr = displayReg, UI.regInput.value = regnr; 
        }
        if (!regnr || regnr.length < 4) return showToast('Ange ett giltigt registreringsnummer', 'error');

        isSearchingActive = true; 
        setTimeout(() => { isSearchingActive = false; }, 1500); // Lås upp sökknappen efter 1.5 sekunder

        // Totalrensning! Förstör gamla sökningar, spök-köer och cache innan vi börjar
        chrome.storage.local.remove(['fordonsdata_result', 'fordonsdata_combo_buffer', 'os_combo_queue', 'os_combo_regnr', 'os_external_task']);

        const popupParams = 'width=450,height=550,left=9999,top=9999';

        // NYTT: Funktion som ber den aktiva hemsidan (content.js) öppna fönstret
        const executeSearch = (url, target, queue, regnr) => {
            chrome.storage.local.set({ 
                'os_combo_queue': queue, 
                'os_combo_regnr': regnr,
                'os_external_task': { regnr: regnr, target: target },
                'os_external_task_origin': 'popup'
            }, () => {
                // Skickar ett tyst meddelande till hemsidan du befinner dig på
                chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    if (tabs && tabs[0]) {
                        chrome.tabs.sendMessage(tabs[0].id, { action: 'FORCE_WINDOW_OPEN', url: url }, (res) => {
                            if (chrome.runtime.lastError) {
                                // Fallback om du försöker söka från en tom "Ny Flik"-sida där content.js saknas
                                window.open(url, 'VehicleRadarPopup', 'width=450,height=550,left=9999,top=9999');
                            }
                        });
                    }
                });
            });
        };

        // Ruttar sökningen via hemsidan
        if (type === 'combo') {
            executeSearch(`https://biluppgifter.se/fordon/${regnr}`, 'bu', ['bu', 'om'], regnr);
        } else if (type === 'combo-ci-om') {
            executeSearch(`https://www.car.info/sv-se/license-plate/S/${regnr}#specs_bmg_export`, 'ci', ['ci', 'om'], regnr);
        } else {
            const urls = {'om': 'https://www.oljemagasinet.se', 'ts': 'https://fordon-fu-regnr.transportstyrelsen.se/', 'ci': `https://www.car.info/sv-se/license-plate/S/${regnr}#specs_bmg_export`, 'bu': `https://biluppgifter.se/fordon/${regnr}`};
            executeSearch(urls[type], type, [], regnr);
        }

        UI.historySection.classList.add('hidden');
        if (UI.emptyState) UI.emptyState.classList.add('hidden');
        UI.resultContainer.classList.remove('hidden');
        UI.extendedData.classList.remove('hidden'); 
        if (UI.toggleBtn) UI.toggleBtn.innerText = 'GÖM SPECIFIKATIONER ⌃';
        if (UI.livePulse) UI.livePulse.classList.remove('hidden');
        if (UI.avatar) UI.avatar.classList.add('avatar-loading');

        chrome.storage.local.get(['os_search_history'], (res) => {
            const badge = document.getElementById('data-source-badge');
            if (badge) { 
                badge.style.cssText = ''; /* Rensar gamla färger */
                badge.style.display = 'inline-flex';
                badge.style.alignItems = 'center';
                badge.style.gap = '4px';

                const getIcon = (domain) => `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" style="width:14px; height:14px; border-radius:3px;">`;
                let iconHtml = '';
                
                if (type === 'om') iconHtml = getIcon('oljemagasinet.se');
                else if (type === 'ts') iconHtml = getIcon('transportstyrelsen.se');
                else if (type === 'ci') iconHtml = getIcon('car.info');
                else if (type === 'bu') iconHtml = getIcon('biluppgifter.se');
                else if (type === 'combo') iconHtml = `${getIcon('biluppgifter.se')}<span style="color:#94a3b8; font-weight:900; font-size:10px;">+</span>${getIcon('oljemagasinet.se')}`;
                else if (type === 'combo-ci-om') iconHtml = `${getIcon('car.info')}<span style="color:#94a3b8; font-weight:900; font-size:10px;">+</span>${getIcon('oljemagasinet.se')}`;

                // Visar loggorna plus laddningstexten
                badge.innerHTML = `${iconHtml} <span style="margin-left:2px; font-size:8px; font-weight:800; letter-spacing:0.5px;">LADDAR...</span>`; 
                badge.classList.add('loading'); /* STARTA PULSEN! */
            }
        });
    };

    async function processOCR(imageBlob) {
        showToast('Optimerar och läser av bild...', 'success');
        if (UI.ocrBtnContainer) UI.ocrBtnContainer.classList.add('scanning');
        try {
            const bitmap = await window.createImageBitmap(imageBlob);
            const canvas = document.createElement('canvas');
            let w = bitmap.width, h = bitmap.height;
            if (w > 1000) { h = Math.round((h * 1000) / w); w = 1000; }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
            
            const formData = new FormData();
            formData.append("base64Image", canvas.toDataURL('image/jpeg', 0.8));
            formData.append("language", "eng"); formData.append("apikey", "helloworld"); formData.append("OCREngine", "2"); 

            const res = await (await fetch("https://api.ocr.space/parse/image", { method: "POST", body: formData })).json();
            if (UI.ocrBtnContainer) UI.ocrBtnContainer.classList.remove('scanning');

            if (res.ParsedResults?.length) {
                // NYTT: Striktare Regex som tvingar fram svenskt format (ex. ABC12A) och blockerar ord som "PASSAT"
                const match = res.ParsedResults[0].ParsedText.replace(/[^A-Z0-9]/gi, '').toUpperCase().match(/[A-Z]{3}[0-9]{2}[A-Z0-9]/);
                
                if (match) {
                    UI.regInput.value = match[0];
                    showToast(`Hittade: ${match[0]}! Söker...`, 'success');
                    setTimeout(() => triggerSearch('om'), 400);
                } else showToast('Kunde inte tyda reg-nr. Prova igen.', 'error');
            } else showToast('Ingen text hittades i bilden.', 'error');
        } catch (err) {
            if (UI.ocrBtnContainer) UI.ocrBtnContainer.classList.remove('scanning');
            showToast('Nätverksfel vid bildavläsning.', 'error');
        }
    }

    // ==========================================
    // 8. EVENT LISTENERS
    // ==========================================
    // --- HEADER & INSTÄLLNINGAR ---
    const goHome = document.getElementById('go-home');
    if (goHome) goHome.addEventListener('click', () => window.location.reload());

    const openTabBtn = document.getElementById('open-tab-btn');
    if (openTabBtn) openTabBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: window.location.href });
    });

    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsBtn && settingsPanel) {
        settingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('hidden');
            settingsBtn.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!settingsPanel.classList.contains('hidden') && !settingsPanel.contains(e.target) && e.target !== settingsBtn) {
                settingsPanel.classList.add('hidden');
                settingsBtn.classList.remove('active');
            }
        });
    }

    UI.regInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (STATE.autoSearch && e.target.value.length === 6) setTimeout(() => { if (UI.regInput.value.length === 6) { triggerSearch(STATE.defaultEngine); UI.regInput.blur(); } }, 150);
    });
    UI.regInput.addEventListener('dblclick', () => { UI.regInput.value = ''; });
    UI.regInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') triggerSearch(STATE.defaultEngine); });
    UI.regInput.focus();

    if (UI.ocrInput) UI.ocrInput.addEventListener('change', (e) => { if(e.target.files[0]) { processOCR(e.target.files[0]); UI.ocrInput.value = ''; } });
    if (UI.historyFilterInput) UI.historyFilterInput.addEventListener('input', (e) => renderHistoryList(STATE.fullHistoryCache, e.target.value));
    if (UI.clearHistoryBtn) UI.clearHistoryBtn.addEventListener('click', () => chrome.storage.local.remove(['os_search_history'], () => { loadHistory(''); saveHistoryToCloud([]); showToast('Historiken har rensats'); }));
    
    document.getElementById('action-search-btn')?.addEventListener('click', () => triggerSearch(STATE.defaultEngine));
    document.getElementById('om-search-btn')?.addEventListener('click', () => triggerSearch('om'));
    document.getElementById('ts-search-btn')?.addEventListener('click', () => triggerSearch('ts'));
    document.getElementById('ci-search-btn')?.addEventListener('click', () => triggerSearch('ci'));
    document.getElementById('bu-search-btn')?.addEventListener('click', () => triggerSearch('bu'));

    if (UI.toggleBtn) UI.toggleBtn.addEventListener('click', () => {
        UI.extendedData.classList.toggle('hidden');
        UI.toggleBtn.innerText = UI.extendedData.classList.contains('hidden') ? 'VISA MER FORDONSDATA ⌄' : 'GÖM SPECIFIKATIONER ⌃';
    });

    // Kompakt text- och tabell-vy
    const compactViewBtn = document.getElementById('toggle-compact-view-btn');
    if (compactViewBtn) {
        chrome.storage.local.get(['os_compact_data_mode'], (res) => {
            if (res.os_compact_data_mode) {
                document.body.classList.add('compact-data-mode');
                compactViewBtn.style.background = '#e2e8f0';
            }
        });

        compactViewBtn.addEventListener('click', () => {
            document.body.classList.toggle('compact-data-mode');
            const isActive = document.body.classList.contains('compact-data-mode');
            chrome.storage.local.set({ 'os_compact_data_mode': isActive });
            compactViewBtn.style.background = isActive ? '#e2e8f0' : '';
            showToast(isActive ? 'Kompakt text-vy aktiverad' : 'Standardvy aktiverad', 'success');
        });
    }

    if (UI.closeBtn) UI.closeBtn.addEventListener('click', () => {
        UI.resultContainer.classList.add('hidden');
        UI.extendedData.classList.remove('hidden');
        if (UI.toggleBtn) UI.toggleBtn.innerText = 'GÖM SPECIFIKATIONER ⌃';
        if (UI.livePulse) UI.livePulse.classList.add('hidden');
        
        // NYTT: Stäng av avatar-snurran om fönstret stängs
        if (UI.avatar) UI.avatar.classList.remove('avatar-loading');
        
        loadHistory(UI.historyFilterInput ? UI.historyFilterInput.value : '');
        UI.regInput.focus();
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.resultContainer.classList.contains('hidden') ? UI.regInput.value = '' : UI.closeBtn?.click(); });

    document.querySelectorAll('.copyable').forEach(el => el.addEventListener('click', (e) => {
        const val = (e.currentTarget.querySelector('.value') || e.currentTarget).innerText;
        if (val && val !== '-' && !e.currentTarget.classList.contains('skeleton')) { navigator.clipboard.writeText(val); showToast(`Kopierade: ${val}`); }
    }));

    document.getElementById('copy-vin')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const vin = document.getElementById('vin-display').innerText.replace(/\s+/g, '');
        if (vin && vin !== '-' && !document.getElementById('vin-display').classList.contains('skeleton')) {
            navigator.clipboard.writeText(vin); showToast('Chassinummer kopierat!');
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Sparar original-ikonen
            const copyIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
            // Visar en grön bock när man klickat
            const checkIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            
            e.currentTarget.innerHTML = checkIcon; 
            setTimeout(() => e.currentTarget.innerHTML = copyIcon, 1500);
        }
    });

    const pinCurrentBtn = document.getElementById('pin-current-btn');
    if (pinCurrentBtn) {
        pinCurrentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const regnr = pinCurrentBtn.dataset.regnr;
            if (!regnr || regnr === '-') return;
            
            // Kör den befintliga pin-funktionen (uppdaterar databas och historikvy)
            togglePinStatus(regnr);
            
            // Uppdatera stjärnans färg direkt i UI:t för blixtsnabb respons
            const isPinned = pinCurrentBtn.classList.toggle('is-pinned');
            pinCurrentBtn.querySelector('svg').setAttribute('fill', isPinned ? 'currentColor' : 'none');
        });
    }
    if (UI.copyAllBtn) UI.copyAllBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const getV = id => document.getElementById(id)?.innerText || '';
        
        const textToCopy = [
            `Regnr: ${getV('regnr-display')}`,
            `Modell: ${getV('model-display')}`,
            `Motorkod: ${getV('motor-display')}`,
            `Årsmodell: ${getV('year-display')}`,
            `1:a Registrerad: ${getV('first-reg-display')}`,
            `Mätarställning: ${getV('milage-display')}`,
            `Oljevolym: ${getV('oil-display')}`,
            `Oljetyp: ${getV('oiltype-display')}`,
            `Motor & Effekt: ${getV('power-display')}`,
            `Växellåda: ${getV('gearbox-display')}`,
            `Drivmedel: ${getV('fuel-display')}`,
            `Drivhjul: ${getV('drivetrain-display')}`,
            `Status: ${getV('status-display')}`,
            `Besiktning senast: ${getV('inspection-display')}`,
            `Årsskatt: ${getV('tax-display')}`,
            `Förbrukning: ${getV('consumption-display')}`,
            `Brukare: ${getV('users-display')}`,
            `Svensksåld: ${getV('swedish-display')}`,
            `Chassinummer: ${getV('vin-display')}`,
            `Värdering: ${getV('valuation-display')}`
        ].filter(line => {
            // Filtrerar bort rader som saknar värde
            const val = line.split(': ')[1];
            return val && val !== '-' && val.trim() !== '';
        }).join('\n');

        navigator.clipboard.writeText(textToCopy);
        if (typeof showToast === 'function') showToast('All data kopierad!');
        
        // Snygg fix för ikonen: Byter till en grön bock tillfälligt
        const originalIcon = UI.copyAllBtn.innerHTML;
        const checkIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
        
        UI.copyAllBtn.innerHTML = checkIcon; 
        setTimeout(() => UI.copyAllBtn.innerHTML = originalIcon, 1500);
    });

    const setupExtLink = (id, urlFn) => document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        const reg = document.getElementById('regnr-display').innerText;
        if (reg && reg !== '-') navigator.clipboard.writeText(id === 'link-superetka' ? document.getElementById('vin-display').innerText.replace(/\s+/g, '') : reg);
        chrome.tabs.create({ url: urlFn(reg) });
    });
    setupExtLink('link-oljemagasinet', () => 'https://www.oljemagasinet.se');
    setupExtLink('link-superetka', () => 'https://superetka.com/etka');
    setupExtLink('link-carinfo', r => `https://www.car.info/en-se/license-plate/S/${r}`);
    setupExtLink('link-biluppgifter', r => `https://biluppgifter.se/fordon/${r}`);

    // ==========================================
    // URKLIPP (Inline Paste Icon till vänster om kameran)
    // ==========================================
    const pasteBtn = document.getElementById('smart-paste-btn');

    if (pasteBtn) {
        // Kontrollera om urklipp har ett giltigt reg-nr
        navigator.clipboard.readText().then(t => {
            const c = t?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (c?.length >= 4 && c?.length <= 6 && /^[A-Z0-9]+$/.test(c) && !UI.regInput.value) {
                pasteBtn.classList.remove('hidden');
                pasteBtn.title = `Klistra in och sök: ${c}`;
                
                pasteBtn.onclick = (e) => {
                    e.preventDefault();
                    UI.regInput.value = c;
                    pasteBtn.classList.add('hidden');
                    triggerSearch(STATE.defaultEngine);
                };
            }
        }).catch(() => {
            // Fallback för popup-säkerhet
            pasteBtn.classList.remove('hidden');
            pasteBtn.onclick = async (e) => {
                e.preventDefault();
                try {
                    const text = await navigator.clipboard.readText();
                    const c = text?.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                    if (c?.length >= 4 && c?.length <= 6 && /^[A-Z0-9]+$/.test(c)) {
                        UI.regInput.value = c;
                        pasteBtn.classList.add('hidden');
                        triggerSearch(STATE.defaultEngine);
                    } else {
                        showToast('Inget giltigt reg-nr i urklipp', 'error');
                    }
                } catch (err) {
                    showToast('Kunde inte läsa urklipp', 'error');
                }
            };
        });

        // Dölj ikonen så fort användaren börjar skriva själv
        if (UI.regInput) {
            UI.regInput.addEventListener('input', () => {
                pasteBtn.classList.add('hidden');
            }, { once: true });
        }
    }

    chrome.storage.local.get(['pending_context_search', 'pending_image_scan'], async (res) => {
        if (res.pending_context_search) {
            chrome.storage.local.remove('pending_context_search');
            setTimeout(() => { UI.regInput.value = res.pending_context_search; triggerSearch(STATE.defaultEngine); }, 100);
        }
        if (res.pending_image_scan) {
            chrome.storage.local.remove('pending_image_scan');
            try { processOCR(await (await fetch(res.pending_image_scan)).blob()); } catch (e) { showToast("Säkerhetsspärr blockerar bilden.", "error"); }
        }
    });

    // ==========================================
    // FLIKSYSTEM (TABS) LOGIK
    // ==========================================
    document.querySelectorAll('.hist-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // 1. Nollställ alla flikar och göm alla innehållsrutor
            document.querySelectorAll('.hist-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
            
            // 2. Markera den klickade fliken och visa rätt innehåll
            tab.classList.add('active');
            document.getElementById(tab.dataset.target).classList.remove('hidden');
        });
    });

    loadHistory(); // Laddar den lokala blixtsnabbt

    // Kollar molnet i bakgrunden om du har sökt/stjärnmarkerat på en annan dator
    getHistoryFromCloud().then(cloudHistory => {
        if (cloudHistory) {
            chrome.storage.local.set({ 'os_search_history': cloudHistory }, () => {
                loadHistory(); 
            });
        }
    });
    
    // ==========================================
    // UNIFIED SEARCH BAR LOGIC
    // ==========================================
    const engineBtn = document.getElementById('engine-select-trigger');
    const engineMenu = document.getElementById('engine-dropdown-menu');
    const actionSearchBtn = document.getElementById('action-search-btn');

    // Hantera dropdown (vänster)
    if (engineBtn && engineMenu) {
        engineBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            engineMenu.classList.toggle('hidden');
            engineBtn.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!engineMenu.classList.contains('hidden') && !e.target.closest('#engine-selector-container')) {
                engineMenu.classList.add('hidden');
                engineBtn.classList.remove('active');
            }
        });

        document.querySelectorAll('.engine-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = e.currentTarget.dataset.target;
                
                // Sätt som global default
                STATE.defaultEngine = target;
                chrome.storage.local.set({ 'os_default_search': target });
                updateEngineUI(target);
                
                // Synka med den stora inställningsmenyn om den finns
                const defaultSelect = document.getElementById('default-search-select');
                if (defaultSelect) defaultSelect.value = target;

                // Stäng menyn
                engineMenu.classList.add('hidden');
                engineBtn.classList.remove('active');
                
                // Hämta reg-nr från fältet, eller från bilvyn om fältet är tomt
                let currentReg = UI.regInput.value.trim();
                if (!currentReg) {
                    const displayReg = document.getElementById('regnr-display').innerText.trim().toUpperCase();
                    if (displayReg && displayReg !== '-' && !displayReg.includes('VÄNTAR')) {
                        currentReg = displayReg;
                    }
                }
                
                // --- FIX: Kolla om AutoSearch är påslaget innan vi söker! ---
                if (currentReg.length >= 4) {
                    UI.regInput.value = currentReg; // Tryck in numret i fältet så det är redo
                    
                    if (STATE.autoSearch) {
                        triggerSearch(target); // Sök direkt BARA om inställningen tillåter det
                    } else {
                        showToast('Sökkälla ändrad. Tryck på sök-knappen.'); // Annars väntar vi
                    }
                } else {
                    showToast('Standardsökning uppdaterad');
                }
            });
        });
    }

    // Hantera den stora sökknappen (höger)
    if (actionSearchBtn) {
        actionSearchBtn.addEventListener('click', () => triggerSearch(STATE.defaultEngine));
    }

    // Gör hela värderingskortet klickbart till Car.info
    const valCard = document.getElementById('card-valuation');
    if (valCard) {
        valCard.style.cursor = 'pointer';
        valCard.onclick = (e) => {
            e.stopPropagation();
            const regDisplay = document.getElementById('regnr-display');
            const reg = regDisplay ? regDisplay.innerText.trim() : '';
            if (reg && reg !== '-' && !reg.includes('VÄNTAR')) {
                chrome.tabs.create({ url: `https://www.car.info/en-se/valuation/S/${reg}` });
            } else {
                showToast('Inget giltigt reg-nr för värdering', 'error');
            }
        };
    }
});