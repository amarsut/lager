/**
 * PLANERARE // OS - EXTERNAL SCRAPER EXTENSION
 * Version: 6.2 (Refactored & Mobile Sync Safe)
 */
const HOST = window.location.hostname;

class ScraperUtils {
    static setNativeValue(element, value) {
        if (!element) return;
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        if (valueSetter && valueSetter !== prototypeValueSetter) prototypeValueSetter.call(element, value);
        else valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    static extractMatch(text, regex, group = 1) {
        const m = text.match(regex);
        return m ? m[group].trim() : "";
    }
    // NYTT: Bombsäker funktion som "dammsuger" runt ordet skatt
    static extractTax(text) {
        const clean = text.replace(/&nbsp;|\u00A0|\u202F/g, ' '); 
        
        // Letar efter upp till 5 siffror i rad, med eller utan tusentalsavskiljare
        const amountRegex = /(\d{1,2}[\s.,]\d{3}|\d{1,5})\s*(?:kr|SEK)/i;
        
        const matchRight = clean.match(new RegExp(`(?:Fordonsskatt|Årlig skatt|Årsskatt|Skatt)[\\s\\S]{0,40}?${amountRegex.source}`, 'i'));
        const matchLeft  = clean.match(new RegExp(`${amountRegex.source}[\\s\\S]{0,40}?(?:Fordonsskatt|Årlig skatt|Årsskatt|Skatt)`, 'i'));
        
        let val = matchRight ? matchRight[1] : (matchLeft ? matchLeft[1] : null);
        if (val) return val.replace(/[^\d]/g, '') + ' kr';
        return "";
    }
    // NYTT: Dammsuger specifika HTML-element för att undvika fällor
    static extractTaxDOM() {
        // Letar efter listelement eller divar som innehåller "Årlig skatt" eller liknande
        const labels = Array.from(document.querySelectorAll('span, div, th, td, label'));
        const targetLabel = labels.find(el => {
            const t = el.textContent.trim().toLowerCase();
            return t === 'årlig skatt' || t === 'fordonsskatt' || t === 'årsskatt';
        });

        if (targetLabel) {
            // Kolla om värdet ligger i nästa syskon-element (t.ex. <span class="value">3084 SEK</span>)
            const parent = targetLabel.closest('li') || targetLabel.parentElement;
            if (parent) {
                const valueEl = parent.querySelector('.value') || parent.querySelector('span:last-child');
                if (valueEl && valueEl !== targetLabel) {
                    const match = valueEl.textContent.match(/(\d{1,2}(?:[\s\u00A0]?\d{3})*|\d{3,5})\s*(?:kr|sek)/i);
                    if (match) return match[1].replace(/[^\d]/g, '') + ' kr';
                }
                // Fallback: Läs av hela förälderns text om klassen saknades
                const matchAll = parent.textContent.match(/(\d{1,2}(?:[\s\u00A0]?\d{3})*|\d{3,5})\s*(?:kr|sek)/i);
                if (matchAll) return matchAll[1].replace(/[^\d]/g, '') + ' kr';
            }
        }
        return "";
    }
    // NYTT: Sniper som siktar exakt på "#vehicle-icon-grid" och skalar bort alla Emojis
    static extractFromBUGrid(labelName) {
        // Hämtar exakt den listan du visade på bilden!
        const gridItems = document.querySelectorAll('#vehicle-icon-grid li');
        const cleanLabel = labelName.toLowerCase();
        
        for (let i = 0; i < gridItems.length; i++) {
            const li = gridItems[i];
            const text = (li.innerText || li.textContent).toLowerCase();
            
            if (text.includes(cleanLabel)) {
                // Ikonen och etiketten brukar ligga först, värdet ligger nästan alltid i sista elementet
                let valueNode = li.lastElementChild;
                
                if (valueNode) {
                    let val = valueNode.textContent.trim();
                    // MAGI: Detta raderar "✓", "👍", "●" och mellanslag framför texten
                    return val.replace(/^[^a-zA-Z0-9åäöÅÄÖ]+/, '').trim();
                }
                
                // Fallback om de ändrar designen
                let fallbackText = (li.innerText || li.textContent).trim();
                let regex = new RegExp(labelName, 'i');
                let rawVal = fallbackText.replace(regex, '').trim();
                return rawVal.replace(/^[^a-zA-Z0-9åäöÅÄÖ]+/, '').trim();
            }
        }
        return "";
    }

    // NYTT: Den asynkrona motorn som ersätter setInterval och setTimeout!
    static waitForCondition(conditionFn, timeout = 15000) {
        return new Promise((resolve, reject) => {
            // 1. Om datan redan finns på skärmen (0 ms väntetid)
            if (conditionFn()) return resolve();
            
            // 2. Annars, sätt upp en tyst bevakning av webbsidan
            const observer = new MutationObserver((mutations, obs) => {
                if (conditionFn()) {
                    obs.disconnect(); // Stäng av bevakningen blixtsnabbt
                    resolve();
                }
            });
            
            // Bevaka alla förändringar på sidan
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
            
            // 3. Om sidan är trasig eller fastnar, ge upp efter X sekunder
            setTimeout(() => {
                observer.disconnect();
                reject(new Error('Timeout i waitForCondition'));
            }, timeout);
        });
    }
}

class RadarWidget {
    constructor(title, subtitle, theme = 'orange') {
        this.host = document.createElement('div');
        this.host.id = 'os-radar-host';
        this.host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;';
        document.documentElement.appendChild(this.host);
        this.shadow = this.host.attachShadow({ mode: 'open' });
        this.theme = theme;
        this.colors = theme === 'blue' ? { main: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.2)', success: '#10b981' } : { main: '#f97316', glow: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.2)', success: '#10b981' };
        this.isMinimized = false;
        this.render(title, subtitle);
        chrome.storage.local.get(['os_radar_minimized'], (result) => {
            if (result.os_radar_minimized) { this.wrapper.classList.add('shrunk'); this.isMinimized = true; }
            this.host.style.opacity = '1';
        });
    }

    render(title, subtitle) {
        const c = this.colors;
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulseGlow { 0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px ${c.bg}; border-color: ${c.bg}; } 50% { box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px ${c.glow}; border-color: ${c.glow}; } }
            @keyframes spinOuter { to { transform: rotate(360deg); } }
            @keyframes spinInner { to { transform: rotate(-360deg); } }
            .os-radar-wrapper { position: fixed; inset: 0; pointer-events: all; transition: background-color 0.8s ease, backdrop-filter 0.8s ease; background-color: rgba(15, 21, 34, 0.95); backdrop-filter: blur(10px); font-family: system-ui, sans-serif; }
            .os-radar-wrapper.shrunk { background-color: transparent; backdrop-filter: blur(0px); pointer-events: none; }
            .os-radar-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1.2); background: linear-gradient(135deg, rgba(15,21,34,0.95), rgba(20,28,45,0.95)); border: 1px solid ${c.bg}; border-radius: 16px; padding: 16px 24px; display: flex; align-items: center; justify-content: center; gap: 16px; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); animation: pulseGlow 2s ease-in-out infinite alternate; pointer-events: all; width: max-content; overflow: hidden; box-sizing: border-box; }
            .os-radar-wrapper.shrunk .os-radar-box { top: auto; bottom: 24px; left: auto; right: 24px; transform: translate(0, 0) scale(1); padding: 0; border-radius: 50%; width: 56px; height: 56px; gap: 0; cursor: pointer; border: 2px solid ${c.main}; box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px ${c.glow}; }
            .os-radar-wrapper.shrunk .os-radar-content, .os-radar-wrapper.shrunk #os-min-btn { display: none !important; }
            .os-radar-wrapper.captcha-mode { background-color: transparent !important; backdrop-filter: blur(0px) !important; pointer-events: none !important; }
            .os-radar-wrapper.captcha-mode .os-radar-box { top: 10%; transform: translate(-50%, 0) scale(1); pointer-events: none !important; box-shadow: 0 15px 35px rgba(0,0,0,0.8); }
            #os-min-btn:hover { background: rgba(255,255,255,0.1); color: #fff !important; }

            @media (max-width: 600px) {
                .os-radar-wrapper { background-color: rgba(15, 23, 42, 0.35) !important; backdrop-filter: blur(6px) !important; -webkit-backdrop-filter: blur(6px) !important; pointer-events: all !important; }
                .os-radar-box { top: auto !important; bottom: 40px !important; left: 50% !important; transform: translateX(-50%) !important; width: max-content !important; min-width: 200px !important; background: #1e293b !important; border: 1px solid rgba(255, 255, 255, 0.12) !important; border-radius: 30px !important; padding: 12px 24px !important; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(15, 23, 42, 0.2) !important; animation: slideUpPremium 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important; }
                .os-radar-content h1 { color: #f8fafc !important; font-size: 11px !important; letter-spacing: 1px !important; }
                .os-radar-content p { color: #94a3b8 !important; font-size: 10px !important; font-weight: 700 !important; margin-top: 3px !important; }
                #os-spin-1, #os-spin-2 { border-width: 2px !important; }
                #os-min-btn { display: none !important; }
            }
            @keyframes slideUpPremium { 0% { transform: translate(-50%, 60px) scale(0.9); opacity: 0; } 100% { transform: translate(-50%, 0) scale(1); opacity: 1; } }
        `;
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'os-radar-wrapper';
        this.wrapper.innerHTML = `
            <div class="os-radar-box">
                <div style="width:36px; height:36px; position:relative; flex-shrink:0;">
                    <div style="position:absolute; inset:0; border:3px solid ${c.bg}; border-top-color:${c.main}; border-radius:50%; animation: spinOuter 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;" id="os-spin-1"></div>
                    <div style="position:absolute; inset:6px; border:2px solid rgba(255,255,255,0.1); border-bottom-color:#ffffff; border-radius:50%; animation: spinInner 1.2s linear infinite;" id="os-spin-2"></div>
                </div>
                <div class="os-radar-content" style="flex-grow:1; min-width:140px;">
                    <h1 style="color:${c.main}; font-size:11px; font-weight:900; letter-spacing:1.5px; margin:0; text-transform:uppercase;">${title}</h1>
                    <p style="color:#e4e4e7; font-size:10px; font-weight:500; letter-spacing:0.5px; margin:4px 0 0 0;" id="os-radar-text">${subtitle}</p>
                </div>
                <button id="os-min-btn" style="background:transparent; border:none; color:#9ca3af; cursor:pointer; padding:6px; margin-left:8px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background 0.2s;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
            </div>
        `;
        this.shadow.appendChild(style);
        this.shadow.appendChild(this.wrapper);
        this.shadow.getElementById('os-min-btn').addEventListener('click', (e) => { e.stopPropagation(); this.shrink(); });
        this.shadow.querySelector('.os-radar-box').addEventListener('click', () => { if (this.isMinimized) this.expand(); });
    }

    shrink() { if (this.wrapper) { this.wrapper.classList.add('shrunk'); this.isMinimized = true; chrome.storage.local.set({ 'os_radar_minimized': true }); } }
    expand() { if (this.wrapper) { this.wrapper.classList.remove('shrunk'); this.isMinimized = false; chrome.storage.local.set({ 'os_radar_minimized': false }); } }
    setCaptchaMode(active) { if (this.wrapper) { if (active) { this.wrapper.classList.add('captcha-mode'); this.stopAnimation(); } else { this.wrapper.classList.remove('captcha-mode'); } } }
    updateText(text) { const textEl = this.shadow.getElementById('os-radar-text'); if (textEl) textEl.innerText = text; }
    stopAnimation() {
        const box = this.shadow.querySelector('.os-radar-box'); if (box) box.style.animation = 'none';
        const spin1 = this.shadow.getElementById('os-spin-1'); const spin2 = this.shadow.getElementById('os-spin-2');
        if (spin1) spin1.style.animation = 'none'; if (spin2) spin2.style.display = 'none';
    }
    success(text) {
        const box = this.shadow.querySelector('.os-radar-box'); box.style.animation = 'none'; box.style.borderColor = this.colors.success; box.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.4)`;
        const spin1 = this.shadow.getElementById('os-spin-1'); spin1.style.borderColor = this.colors.success; spin1.style.borderTopColor = 'transparent'; spin1.style.animation = 'spinOuter 3s linear infinite';
        this.shadow.getElementById('os-spin-2').style.display = 'none';
        this.shadow.getElementById('os-radar-text').innerHTML = `<span style="color:${this.colors.success}; font-weight:900;">✓ ${text}</span>`;
    }
    error(text) { const box = this.shadow.querySelector('.os-radar-box'); box.style.animation = 'none'; box.style.borderColor = '#ef4444'; this.shadow.getElementById('os-radar-text').innerHTML = `<span style="color:#ef4444; font-weight:900;">✕ ${text}</span>`; }
    destroy() { this.wrapper.style.opacity = '0'; setTimeout(() => this.host.remove(), 500); }
}

// ==========================================
// 1. GLOBAL TASK MANAGER & SÄKERHET
// ==========================================
const closeExtensionTask = (payload, widget, successMsg, triggerEvent) => {
    // SÄKERHET: Callback-nästling garanterar att datan sparas innan fönstret stängs/navigerar (Kritisk för mobil)
    chrome.storage.local.set({ 'fordonsdata_result': payload }, () => {
        chrome.storage.local.remove('os_external_task', () => {
            if (triggerEvent?.source && (!triggerEvent.data || !triggerEvent.data.readOnly)) {
                triggerEvent.source.postMessage(payload, "*");
            } else if (window.opener) {
                window.opener.postMessage(payload, "*");
            }
            if (widget) widget.success(successMsg);
            setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_WINDOW' }), 500);
        });
    });
};

const abortExtensionTask = (widget, errorMsg, delay = 3000) => {
    if (widget) widget.error(errorMsg);
    chrome.storage.local.remove('os_external_task', () => setTimeout(() => chrome.runtime.sendMessage({ action: 'CLOSE_WINDOW' }), delay));
};

chrome.storage.local.get(['os_external_task'], (res) => {
    const t = res.os_external_task;
    if (!t) return;
    if (HOST.includes('car.info') && t.target === 'ci') startCarInfoRadar(t.regnr);
    else if (HOST.includes('oljemagasinet.se') && t.target === 'om') startOMRadar(t.regnr);
    else if (HOST.includes('transportstyrelsen.se') && t.target === 'ts') startTSRadar(t.regnr);
    else if (HOST.includes('biluppgifter.se') && t.target === 'bu') startBURadar(t.regnr);
});

window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.action) return;
    if (HOST.includes('oljemagasinet.se') && data.action === 'START_OS_RADAR') startOMRadar(data.regnr, event);
    if (HOST.includes('transportstyrelsen.se') && data.action === 'START_TS_RADAR') startTSRadar(data.regnr, event);
});

// ==========================================
// 2. CAR.INFO SKANNERN (Blixtsnabb via MutationObserver)
// ==========================================
if (HOST.includes('car.info') && window.location.hash.includes('bmg_export')) {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0 && parts[parts.length - 1].length >= 4) startCarInfoRadar(parts[parts.length - 1].toUpperCase());
}

async function startCarInfoRadar(activeReg) {
    if (window.osRadarActive) return;
    window.osRadarActive = true;
    const widget = new RadarWidget('Datalänk Aktiv', 'Laddar Car.info...', 'blue');

    // Hämta detaljerad värdering (Företag/Privat + precision) i bakgrunden
    let advValuation = null;
    let advValuationFetched = false;
    
    fetch(`https://www.car.info/sv-se/valuation/S/${activeReg}`)
        .then(r => r.text())
        .then(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            
            let foretagPris = "", privatPris = "";
            let fLight = 'green', pLight = 'green';

            // 1. Extrahera Företagspris direkt från dess specifika container (.val_column:första)
            try {
                const compCol = doc.querySelectorAll('.val_column')[0];
                if (compCol) {
                    const priceEl = compCol.querySelector('.h3');
                    if (priceEl) foretagPris = priceEl.textContent.trim().replace(/SEK/i, 'kr');
                    
                    // Läs av trafikljus för företag
                    if (compCol.querySelector('.yellow_lamp:not(.inactive)')) fLight = 'yellow';
                    else if (compCol.querySelector('.red_lamp:not(.inactive)')) fLight = 'red';
                    else if (compCol.querySelector('.green_lamp:not(.inactive)')) fLight = 'green';
                }
            } catch(e) {}

            // 2. Extrahera Privatpris direkt från dess specifika container (.val_column:andra)
            try {
                const privCol = doc.querySelectorAll('.val_column')[1];
                if (privCol) {
                    const priceEl = privCol.querySelector('.h3');
                    if (priceEl) privatPris = priceEl.textContent.trim().replace(/SEK/i, 'kr');
                    
                    // Läs av trafikljus för privatperson
                    if (privCol.querySelector('.yellow_lamp:not(.inactive)')) pLight = 'yellow';
                    else if (privCol.querySelector('.red_lamp:not(.inactive)')) pLight = 'red';
                    else if (privCol.querySelector('.green_lamp:not(.inactive)')) pLight = 'green';
                }
            } catch(e) {}

            // Fallback om .val_column skulle saknas av någon anledning
            if (!foretagPris || !privatPris) {
                const textContent = doc.body.textContent.replace(/\s+/g, ' ');
                const allPrices = textContent.match(/([\d\s]{4,8}\s*SEK)/gi);
                if (allPrices && allPrices.length >= 2) {
                    if (!foretagPris) foretagPris = allPrices[0].replace(/SEK/i, 'kr').replace(/\s+/g, ' ').trim();
                    if (!privatPris) privatPris = allPrices[1].replace(/SEK/i, 'kr').replace(/\s+/g, ' ').trim();
                }
            }

            if (foretagPris || privatPris) {
                advValuation = {
                    fPrice: foretagPris, 
                    fLight: fLight, 
                    pPrice: privatPris, 
                    pLight: pLight  
                };
            }
            advValuationFetched = true;
        })
        .catch(() => { advValuationFetched = true; });

    try {
        // 1. Klicka bort cookies DIREKT! (Om de ligger som ett överlägg stoppar de laddningen)
        Array.from(document.querySelectorAll('button')).find(b => b.innerText.match(/godkänn alla|acceptera|tillåt|accept all|allow/i))?.click();

        // 2. Vänta enbart på att bilens rubrik ELLER specifika dataelement dyker upp i HTML:en
        await ScraperUtils.waitForCondition(() => {
            return document.querySelector('h1') || document.querySelector('.sptitle') || document.querySelector('.spec-title');
        }, 15000);

        // 3. Nu när DOM:en finns, öppnar vi ALLA dragspel och "Visa fler"-knappar
        document.querySelectorAll('[data-toggle-type="section"], .expand_list_section, .toggle_expand_btn, summary, .accordion-header, button[aria-expanded="false"]').forEach(el => {
            if (el.tagName !== 'A') { 
                try { el.click(); } catch (e) { } 
            }
        });

        // 4. VÄNTA PÅ AJAX/NÄTVERK: Vi väntar upp till 3 sekunder tills "Motorkod" faktiskt har laddats in på skärmen!
        await ScraperUtils.waitForCondition(() => {
            return document.body.innerText.includes('Motorkod') || document.body.innerText.includes('Motorolja');
        }, 3000).catch(() => {});

        // 5. SÄKERHETSSPÄRR FÖR VÄRDERINGEN
        let valWaits = 0;
        while (!advValuationFetched && valWaits < 7) {
            await new Promise(res => setTimeout(res, 200));
            valWaits++;
        }

    } catch (e) {
        console.warn("Car.info timeout, försöker skrapa det vi har...");
    }

    widget.updateText('Extraherar data...');

    const combinedText = document.body.innerText + " " + document.documentElement.textContent.replace(/\s+/g, ' ');
    let model = "", årsmodell = "";

    const h1 = document.querySelector('h1');
    if (h1) {
        model = h1.innerText.replace(activeReg, '').replace(/^\s*S\s+/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/Specifikationer|Specifications/i, "").trim();
        årsmodell = ScraperUtils.extractMatch(model, /,\s*(19\d{2}|20\d{2})\s*$/) || ScraperUtils.extractMatch(combinedText, /(?:Fordonsår|Tillverkningsår|Model year)[^\dA-Za-z]{0,20}?(\d{4})/i);
    }

    const vin = ScraperUtils.extractMatch(combinedText, /(?:Chassinummer|VIN)[^\w]{0,30}?([A-HJ-NPR-Z0-9]{17})/i).toUpperCase();

    // ==========================================
    // EXAKT PARSER FÖR CAR.INFO (Dictionary-metod)
    // ==========================================
    let ciSpecs = {};
    document.querySelectorAll('.sprow, tr, li, .featured_info_item').forEach(row => {
        let labelEl = row.querySelector('.sptitle, th, .spec-title, strong');
        let valEl = labelEl ? labelEl.nextElementSibling : null;
        
        if (!valEl && row.tagName === 'TR') {
            labelEl = row.querySelector('th, td:first-child');
            valEl = labelEl ? labelEl.nextElementSibling : null;
        }

        if (labelEl && valEl) {
            // EXTREM TVÄTT: Tar bort precis allt utom bokstäver och siffror
            let key = labelEl.textContent.toLowerCase().replace(/[^a-zåäö0-9]/g, '');
            let val = valEl.textContent.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
            if (val && val !== "-" && val !== "" && !ciSpecs[key]) {
                ciSpecs[key] = val;
            }
        }
    });

    // 1. MOTORKOD
    let motor = ciSpecs['motorkod'] || ciSpecs['motorfamilj'] || ScraperUtils.extractMatch(combinedText, /(?:Motorkod|Motorfamilj)[\s\S]{0,40}?([A-Z0-9\-]{3,15})/i);

    // 2. EFFEKT OCH HÄSTKRAFTER
    let kwRaw = ciSpecs['effekt'];
    let hkRaw = ciSpecs['hästkrafter'];
    let effekt = "";
    if (kwRaw && hkRaw) {
        let kw = kwRaw.match(/\d+/);
        let hk = hkRaw.match(/\d+/);
        if (kw && hk) effekt = `${kw[0]} kW / ${hk[0]} hk`;
    } else if (kwRaw) {
        effekt = kwRaw;
    } else {
        let eMatch = combinedText.match(/(\d+)\s*kW[\s\S]{0,20}?(\d+)\s*hk/i) || combinedText.match(/(\d+)\s*hk/i);
        if (eMatch && eMatch[2]) effekt = `${eMatch[1]} kW / ${eMatch[2]} hk`;
        else if (eMatch && eMatch[1]) effekt = `${eMatch[1]} hk`;
    }

    // 3. OLJEVOLYM
    let oljevolym = ciSpecs['motoroljavolym'] || ciSpecs['oljevolym'] || "";
    if (!oljevolym) {
        let oMatchReg = combinedText.match(/(?:Motorolja, volym|Oljevolym)[\s\S]{0,40}?([\d.,]+)\s*(?:l|liter)/i);
        if (oMatchReg) oljevolym = oMatchReg[1].replace(',', '.') + " l";
    } else {
        let oMatch = oljevolym.match(/([\d.,]+)/);
        if (oMatch) oljevolym = oMatch[1].replace(',', '.') + " l";
    }

    // 4. OLJETYP
    let oljetypRaw = ciSpecs['helsyntetiskmotoroljaviskositet'] || ciSpecs['motoroljaviskositet'] || ciSpecs['halvsyntetiskmotoroljaviskositet'];
    let oljetyp = "";
    if (oljetypRaw) {
        oljetyp = oljetypRaw.split('|')[0].trim();
    } else {
        let typeMatch = combinedText.match(/(?:motorolja|viskositet)[\s\S]{0,40}?(\d{1,2}W-\d{2,6})/i);
        if (typeMatch) oljetyp = typeMatch[1].toUpperCase();
    }

    // 5. VÄXELLÅDA & DRIVMEDEL
    const växellåda = ciSpecs['växellåda'] || ScraperUtils.extractMatch(combinedText, /(?:Växellåda|Gearbox|Transmission)[\s\S]{0,40}?(Automat|Manuell|Automatic|Manual)/i);
    const drivmedel = ciSpecs['bränsle'] || ciSpecs['drivmedel'] || ScraperUtils.extractMatch(combinedText, /(?:Bränsle|Drivmedel|Fuel)[\s\S]{0,40}?(Diesel|Bensin|El|Laddhybrid|Hybrid|Etanol|Miljöbränsle)/i);

    // 6. DRIVHJUL
    let drivhjul = ciSpecs['drivlina'] || ciSpecs['drivhjul'];
    if (!drivhjul) drivhjul = ScraperUtils.extractMatch(combinedText, /(?:Drivlina|Drivning|Drivhjul)[\s\S]{0,30}?(AWD|4WD|FWD|RWD|Fyrhjulsdrift|Framhjulsdrift|Bakhjulsdrift)/i);
    if (drivhjul) {
        if (drivhjul.toLowerCase().includes('fyr') || drivhjul.toUpperCase().includes('WD') || drivhjul.toUpperCase() === 'AWD') drivhjul = '4WD';
        else if (drivhjul.toLowerCase().includes('fram') || drivhjul.toUpperCase() === 'FWD') drivhjul = 'FWD';
        else if (drivhjul.toLowerCase().includes('bak') || drivhjul.toUpperCase() === 'RWD') drivhjul = 'RWD';
    }

    // 5. BESIKTNING
    let besiktning = "";
    const elements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.children.length === 0 && (el.textContent || "").trim() === "Besiktas senast"
    );
    for (let el of elements) {
        let container = el.closest('.featured_info_item') || el.parentElement;
        if (container) {
            let match = container.textContent.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) {
                besiktning = match[1];
                break;
            }
        }
    }

    // 6. FÖRBRUKNING (SÄKRAD MATRIS-MATCHNING)
    let forbrukning = ciSpecs['blandadförbrukning'] || ciSpecs['bränsleförbrukning'];
    let fMatch = forbrukning ? forbrukning.match(/([\d.,]+)/) : null;
    if (fMatch) {
        forbrukning = fMatch[1].replace(',', '.') + " l/100 km";
    } else {
        let altMatch = combinedText.match(/([\d.,]+)\s*(?:l\/100\s*km|liter\/100\s*km|l\/100km)/i);
        forbrukning = altMatch ? altMatch[1].replace(',', '.') + " l/100 km" : "";
    }

    // 7. SVENSKSÅLD
    let svensksald = "";
    const allaEtiketter = Array.from(document.querySelectorAll('.sptitle, .badge, span, div')).map(el => (el.textContent || "").trim().toLowerCase());
    if (allaEtiketter.includes('svensksåld') || allaEtiketter.includes('såld i sverige')) {
        svensksald = "Ja";
    } else if (allaEtiketter.includes('importerad') || allaEtiketter.includes('import')) {
        svensksald = "Nej";
    }

    // 9. FORDONSSKATT
    let årsskatt = ScraperUtils.extractTax(combinedText);
    if (!årsskatt) {
        const skattNodes = Array.from(document.querySelectorAll('*')).filter(el => 
            el.children.length === 0 && /(?:årsskatt|fordonsskatt|skatt)/i.test(el.textContent)
        );
        for (let node of skattNodes) {
            let parentText = (node.parentElement || node).textContent.replace(/\s+/g, ' ');
            let m = parentText.match(/(\d{1,2}(?:[\s\u00A0]?\d{3})*|\d{3,5})\s*(?:kr|sek)/i);
            if (m) {
                årsskatt = m[1].replace(/[^\d]/g, '') + ' kr';
                break;
            }
        }
    }
    
    // 8. BRUKARE
    const brukareMatch = ScraperUtils.extractMatch(combinedText, /(?:Antal ägare|Ägare)[^\d]{0,30}?(\d+)/i);
    const brukare = brukareMatch ? brukareMatch + " st" : "";

    let miltal = "";
    const milMatch = combinedText.match(/(?:Mätarställning|Miltal|Senaste mätarställning|Odometer)[\s\S]{0,100}?(\d{1,3}(?:[ \u00A0.,]\d{3})+|\d{1,7})\s*(mil|km)/i);
    if (milMatch) miltal = milMatch[1].replace(/[^\d]/g, '') + ' ' + milMatch[2].toLowerCase();

    let status = ScraperUtils.extractMatch(combinedText, /\b(Avställd|I trafik|Påställd|Avregistrerad|Canceled|In traffic|Deregistered)\b/i).toLowerCase();
    if (status) status = (status === 'i trafik' || status === 'in traffic') ? 'Påställd' : (status === 'canceled' || status === 'deregistered') ? 'Avställd' : status.charAt(0).toUpperCase() + status.slice(1);

    let vardering = "";
    if (advValuation) {
        vardering = JSON.stringify(advValuation);
    } else {
        const valMatch = document.body.innerText.match(/(?:Indicative valuation|Uppskattat värde|Värdering)[\s\S]{0,40}?([\d\s.,]+(?:(?:\s*-\s*|\s*till\s*)[\d\s.,]+)?\s*(?:SEK|kr))/i);
        if (valMatch) vardering = valMatch[1].replace(/[,.]/g, ' ').replace(/\bSEK\b/i, 'kr').replace(/\s+/g, ' ').trim();
    }

    if (!model && !motor && !vin) {
        return abortExtensionTask(widget, 'Car.info saknar data.', 1500);
    }

    // HISTORIK FRÅN CAR.INFO
    let historikArray = [];
    let agarArray = []; // Skapar en separat behållare för ägarbyte

    document.querySelectorAll('#history_items .histitem.card, .histitem.card').forEach(card => {
        let text = card.innerText.replace(/\s+/g, ' ').trim();
        let dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
            let date = dateMatch[0];
            let label = card.getAttribute('data-history-event-label') || "";
            let desc = text.replace(date, '').trim();
            let title = label ? label : (desc.split(' ')[0] || "Händelse");
            
            if (title.toLowerCase() === 'trafik') {
                title = desc.toLowerCase().includes('avställd') ? 'Avställd' : 'Trafikstatus';
            }

            // Kollar om händelsen är ett ägarbyte (baserat på label eller titel)
            if (title.toLowerCase().includes('ägarbyte') || label.toLowerCase().includes('owner')) {
                agarArray.push({ type: 'Ägarbyte', desc: desc, date: date });
            } else {
                // Annars lägger vi den i den vanliga fordonshistoriken
                historikArray.push({ date, title, desc });
            }
        }
    });

    // MÄTARHISTORIK FRÅN CAR.INFO
    let matarArray = [];
    document.querySelectorAll('#mileage_service_section tbody tr, .mileage_history tbody tr').forEach(tr => {
        let text = tr.innerText.replace(/\s+/g, ' ').trim();
        let dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
        let milMatch = text.match(/(?:ca\s*)?(\d[\d\s]*mil)/i);
        if (milMatch) {
            let date = dateMatch ? dateMatch[0] : new Date().toISOString().split('T')[0];
            let mil = milMatch[1].trim();
            let type = text.replace(dateMatch ? dateMatch[0] : '', '').replace(milMatch[0], '').replace(/ca/i, '').trim();
            type = type.replace(/^[^a-zA-ZÅÄÖåäö]+/, '').trim();
            if(type.toLowerCase().includes('idag') || type.toLowerCase().includes('uppskattad')) type = 'Uppskattning';
            else if(!type || type === '') type = 'Besiktning';
            if(type.length > 3 && !type.toLowerCase().includes('körsträcka')) {
                matarArray.push({ type: type.substring(0, 25), mil, date });
            }
        }
    });

    let forsta_reg = ciSpecs['1aregistreringsdatum'] || ciSpecs['itrafikförstagångenisverige'] || ciSpecs['förstaregistrering'] || ScraperUtils.extractMatch(combinedText, /(?:1:a registreringsdatum|I trafik första gången|Första registrering)[\s\S]{0,40}?(\d{4}-\d{2}-\d{2})/i);

    const payload = { 
        source: "Car.info_Extension", 
        regnr: activeReg, 
        bilmodell: model || "Okänd modell", 
        forsta_reg: forsta_reg,
        motorkod: motor, 
        miltal, 
        oljevolym, 
        oljetyp: oljetyp, /* NY */
        effekt: effekt,   /* NY */
        årsmodell, 
        vin, 
        vardering, 
        växellåda, 
        drivmedel, 
        besiktning_senast: besiktning, 
        fordonsstatus: status, 
        årsskatt,
        förbrukning: forbrukning, 
        brukare: brukare,         
        svensksåld: svensksald,   
        drivhjul: drivhjul,
        historik: historikArray,
        matarhistorik: matarArray,
        agarhistorik: agarArray
    };
    closeExtensionTask(payload, widget, 'Data fångad från Car.info!');
}

// ==========================================
// 3. OLJEMAGASINET SKANNERN (Blixtsnabb via MutationObserver)
// ==========================================
async function startOMRadar(activeReg, triggerEvent = null) {
    if (window.osRadarActive) return;
    window.osRadarActive = true;
    
    // ENHETLIG ENGÅNGSSPÄRR: Förhindrar att loopen triggas om sidan laddar om
    const lockKey = `om_searched_${activeReg}`;
    if (sessionStorage.getItem(lockKey)) {
        console.log("AutoSearch: Redan sökt på detta reg-nr i denna session, hoppar över inmatningsloopen.");
    }

    const widget = new RadarWidget('Systemradar', `Söker: ${activeReg}...`);

    try {
        // Kör inmatningen ENDAST om vi inte redan har gjort det i denna session
        if (!sessionStorage.getItem(lockKey)) {
            sessionStorage.setItem(lockKey, 'true'); // Lås omedelbart!

            await ScraperUtils.waitForCondition(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const regInput = inputs.find(i => 
                    (i.placeholder || '').toLowerCase().includes('reg') || 
                    (i.name || '').toLowerCase().includes('reg') || 
                    (i.id || '').toLowerCase().includes('reg')
                );

                if (regInput) {
                    if (regInput.value.toUpperCase() !== activeReg.toUpperCase()) {
                        regInput.focus();
                        ScraperUtils.setNativeValue(regInput, activeReg);

                        setTimeout(() => {
                            const form = regInput.closest('form');
                            if (form && (form.querySelector('button') || form.querySelector('input[type="submit"]'))) {
                                (form.querySelector('button') || form.querySelector('input[type="submit"]')).click();
                            } else if (form) {
                                form.submit();
                            } else {
                                regInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                            }
                        }, 100);
                    } else {
                        const form = regInput.closest('form');
                        if (form && (form.querySelector('button') || form.querySelector('input[type="submit"]'))) {
                            (form.querySelector('button') || form.querySelector('input[type="submit"]')).click();
                        }
                    }
                    return true;
                }
                return false;
            }, 8000).catch(() => {});
        }

        setTimeout(() => widget.shrink(), 2000);

        // Vänta på resultatet som vanligt...
        await ScraperUtils.waitForCondition(() => {
            const text = document.body.innerText.replace(/\s+/g, ' ');
            
            if (text.toLowerCase().includes('något gick fel') || text.toLowerCase().includes('hittade inget fordon') || text.toLowerCase().includes('okänt reg')) {
                throw new Error('SITE_ERROR');
            }

            const volymMatch = text.match(/(?:Kapacitet|Volym|Motorolja|Påfyllningsmängd|Servicevolym|Rymmer|Åtgång|Oljesump|filter)[\s\S]{0,120}?(\d+[.,]\d+)\s*(?:l|liter)/i) ||
                               text.match(/(\d+[.,]\d+)\s*(?:l|liter)[\s\S]{0,80}?(?:Kapacitet|Volym|Motorolja|Åtgång|Oljesump|filter)/i);
            return volymMatch !== null;
        }, 15000);

        // Resten av din extraheringskod...
        const text = document.body.innerText.replace(/\s+/g, ' ');
        const volymMatch = text.match(/(?:Kapacitet|Volym|Motorolja|Påfyllningsmängd|Servicevolym|Rymmer|Åtgång|Oljesump|filter)[\s\S]{0,120}?(\d+[.,]\d+)\s*(?:l|liter)/i) ||
                           text.match(/(\d+[.,]\d+)\s*(?:l|liter)[\s\S]{0,80}?(?:Kapacitet|Volym|Motorolja|Åtgång|Oljesump|filter)/i);
        
        const volym = volymMatch[1].replace(',', '.').trim();

        // NYTT: Ge Oljemagasinet en halv sekund att rendera klart märke, motorkod och ch.nr!
        await new Promise(res => setTimeout(res, 500));

        let motorkod = "", arsmodell = "", bilmodell = "", drivmedel = "", vaxellada = "", effekt = "", oljetyp = "", vin = "";
        
        try {
            const recSplit = document.body.innerText.split(/rekommenderar/i);
            if (recSplit.length > 1) {
                const recArea = recSplit[1].substring(0, 1000);
                const viscoMatch = recArea.match(/\b\d{1,2}W-\d{2,6}\b/i);
                const specMatch = recArea.match(/\b(VW\s*50\d\.\d{2}|LL-04|MB\s*229\.\d{2}|DEXOS\s*\d|ACEA\s*[A-Z]\d|RN\d{4})\b/i);
                if (viscoMatch) oljetyp += viscoMatch[0].toUpperCase();
                if (specMatch) oljetyp += (oljetyp ? " " : "") + specMatch[0].toUpperCase();
            }

            const headerSpan = document.querySelector('.vehicle-header span.font-bold');
            if (headerSpan) {
                let rawText = headerSpan.textContent.replace(/\s+/g, ' ').trim();
                bilmodell = rawText.replace(/,\s*(SUV|Kombi|Sedan|Halvkombi|Coupé|Cabriolet).*$/i, '').trim();
            }

            if (!bilmodell) {
                const brandsRegex = /^(Volvo|Volkswagen|VW|Audi|Skoda|Škoda|Seat|Cupra|BMW|Mercedes|Porsche|Kia|Toyota|Ford|Peugeot|Renault|Nissan|Hyundai|Mazda|Honda|Tesla|Dacia|Mini)/i;
                document.querySelectorAll('h1, h2, h3, strong, b, .title, p').forEach(el => {
                    let txt = el.textContent.replace(/\s+/g, ' ').trim();
                    if (!bilmodell && brandsRegex.test(txt) && txt.length > 5 && txt.length < 80) {
                        bilmodell = txt.replace(/,\s*(SUV|Kombi|Sedan|Halvkombi).*$/i, '').trim(); 
                    }
                });
            }

            const fullText = document.body.innerText.replace(/\s+/g, ' ');

            let mkMatch = fullText.match(/Motorkod:\s*([A-Z0-9\-]+)/i);
            if (mkMatch) motorkod = mkMatch[1].toUpperCase();

            let amMatch = fullText.match(/Årsmodell:\s*(\d{4})/i);
            if (amMatch) arsmodell = amMatch[1];

            let fuelMatch = fullText.match(/Bränsle:\s*([a-zåäöA-ZÅÄÖ]+)/i);
            if (fuelMatch) drivmedel = fuelMatch[1];

            let vinMatchRegex = fullText.match(/Chassinummer[\s:]*([A-HJ-NPR-Z0-9]{17})/i);
            if (vinMatchRegex) vin = vinMatchRegex[1].toUpperCase();

            document.querySelectorAll('div').forEach(el => {
                const label = el.textContent.trim().toLowerCase();
                const nextEl = el.nextElementSibling;
                
                if (nextEl) {
                    const val = nextEl.textContent.trim();
                    if (label === 'motorkod' && !motorkod) motorkod = val.toUpperCase();
                    if (label === 'växellåda' && !vaxellada) vaxellada = val;
                    if (label === 'effekt' && !effekt) effekt = val;
                    if (label === 'chassinummer' && !vin && /^[A-HJ-NPR-Z0-9]{17}$/i.test(val)) vin = val.toUpperCase();
                }
            });

            document.querySelectorAll('th, td.label').forEach(th => {
                const thText = th.textContent.trim().toLowerCase();
                const nextTd = th.nextElementSibling;
                if (nextTd && (nextTd.tagName.toLowerCase() === 'td' || nextTd.classList.contains('value'))) {
                    const val = nextTd.textContent.trim();
                    if (!motorkod && thText.includes('motorkod')) motorkod = val;
                    if (!vaxellada && thText.includes('växellåda')) vaxellada = val;
                    if (!effekt && thText.includes('effekt')) effekt = val;
                    if (!vin && thText.includes('chassi')) vin = val.toUpperCase();
                }
            });

        } catch (e) { console.error("Fel vid extrahering av Oljemagasinet:", e); }

        const payload = { source: 'Oljemagasinet_Extension', regnr: activeReg, oljevolym: volym, motorkod, årsmodell: arsmodell, bilmodell, drivmedel, växellåda: vaxellada, effekt, oljetyp, vin };
        
        sessionStorage.removeItem(lockKey);
        closeExtensionTask(payload, widget, `Volym: ${volym} L${motorkod ? ` | Motor: ${motorkod}` : ''}`, triggerEvent);

    } catch (error) {
        sessionStorage.removeItem(lockKey); // Rensa låset vid fel också
        chrome.storage.local.remove(['os_combo_queue', 'os_combo_regnr', 'fordonsdata_combo_buffer'], () => {
            if (error.message === 'SITE_ERROR') {
                widget.setCaptchaMode(true);
                abortExtensionTask(widget, 'Oljemagasinet hittade inte bilen.', 3500);
            } else {
                abortExtensionTask(widget, 'Timeout. Hittade ingen fordonsdata.', 3500);
            }
        });
    }
}

// ==========================================
// 4. TRANSPORTSTYRELSEN SKRAPA
// ==========================================
// ==========================================
// 4. TRANSPORTSTYRELSEN SKRAPA (Blixtsnabb via MutationObserver)
// ==========================================
async function startTSRadar(activeReg, triggerEvent = null) {
    if (window.osRadarActive) return;
    window.osRadarActive = true;
    const widget = new RadarWidget('Myndighetslänk', `Laddar: ${activeReg}...`, 'blue');
    let captchaMode = false;

    try {
        // Skriv in reg-nr om vi är på inmatningssidan
        const regInput = Array.from(document.querySelectorAll('input')).find(i => (i.name || '').toLowerCase().includes('reg') || (i.id || '').toLowerCase().includes('reg') || i.type === 'text');
        const searchBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(b => (b.innerText || b.value || '').toLowerCase().includes('sök') || (b.innerText || b.value || '').toLowerCase().includes('hitta'));

        if (regInput && searchBtn && (!regInput.value || regInput.value.toUpperCase() !== activeReg.toUpperCase())) {
            widget.updateText('Matar in...'); ScraperUtils.setNativeValue(regInput, activeReg);
            setTimeout(() => { searchBtn.click(); setTimeout(() => { if (regInput.closest('form')) regInput.closest('form').submit(); }, 1000); }, 500);
        }

        // 1. Väntar blixtsnabbt på resultatsidan (eller Captcha!)
        await ScraperUtils.waitForCondition(() => {
            const visibleText = document.body.innerText.toLowerCase();

            if (visibleText.includes('maximala antalet') || visibleText.includes('för många')) {
                throw new Error('IP_SPARR'); // Skickar felet direkt till catch-blocket
            }

            if (visibleText.includes('robot') || visibleText.includes('säkerhetskontroll') || visibleText.includes('captcha')) {
                if (!captchaMode) { 
                    captchaMode = true; 
                    widget.updateText('Kräver manuell Captcha. Lös i fönstret!'); 
                    widget.setCaptchaMode(true); 
                }
                return false; // Återvänd false, systemet fortsätter bevaka tills det är löst!
            }

            // Om sidan laddar bilens status och färg är vi i mål
            if (document.documentElement.textContent.toLowerCase().includes('fordonsstatus') && document.documentElement.textContent.toLowerCase().includes('färg')) {
                if (captchaMode) { captchaMode = false; widget.wrapper.classList.remove('shrunk'); widget.setCaptchaMode(false); }
                return true;
            }
            return false;
        }, 120000); // Lång timeout (2 min) för att ge användaren tid att lösa Captchan

        widget.updateText('Träff! Extraherar data...');

        // Öppna panelerna
        const openPanels = () => document.querySelectorAll('button, a, summary').forEach(el => { if (el.getAttribute('aria-expanded') === 'false' || el.classList.contains('collapsed')) { try { el.click(); } catch (e) { } } });
        openPanels(); 
        await new Promise(res => setTimeout(res, 100)); // Låt renderingen rulla ut
        openPanels();

        // NY OCH TRÄFFSÄKER DOM-EXTRAKTOR FÖR TRANSPORTSTYRELSEN
                const extractDOM = (labels) => {
                    const labelArray = Array.isArray(labels) ? labels : [labels];
                    const strongs = Array.from(document.querySelectorAll('strong')); 
                    for (let lbl of labelArray) {
                        const target = strongs.find(el => {
                            const text = el.textContent.replace(/\u00A0/g, ' ').trim().toLowerCase();
                            return text === lbl.toLowerCase() || text.startsWith(lbl.toLowerCase());
                        });
                        if (target) {
                            let parent = target.closest('p');
                            if (!parent) parent = target.parentElement; 
                            if (parent) {
                                let clone = parent.cloneNode(true);
                                let strongToRemove = clone.querySelector('strong');
                                if(strongToRemove) strongToRemove.remove();
                                clone.querySelectorAll('a, i, button, span.visually-hidden').forEach(el => el.remove());
                                
                                // Raderar citattecknen (" ")
                                let text = clone.textContent.replace(/["']/g, '').trim();
                                if (text) return text;
                            }
                        }
                    }
                    return "SAKNAS";
                };

                let fabrikat = extractDOM('Fabrikat');
                let handelsbeteckning = extractDOM('Handelsbeteckning');
                let modell = (fabrikat !== 'SAKNAS' ? fabrikat : '') + ' ' + (handelsbeteckning !== 'SAKNAS' ? handelsbeteckning : '');
                
                let skatt = extractDOM(['Årsskatt', 'Fordonsskatt', 'Grundskatt']);
                let arsskatt = skatt !== "SAKNAS" ? skatt.replace(/[^\d]/g, '') + ' kr' : "";

                // Mätarställning (Räknas om från km till mil)
                let miltalStr = extractDOM('Mätarställning');
                let miltal = "";
                if (miltalStr !== "SAKNAS") {
                    let milMatch = miltalStr.replace(/\D/g, '');
                    if (milMatch) miltal = Math.round(parseInt(milMatch) / 10) + " mil";
                }

                let importVal = extractDOM('Import/införsel');
                let svensksald = "";
                if (importVal !== "SAKNAS") svensksald = importVal.toLowerCase().includes('nej') ? "Ja" : "Nej";

                let brukareStr = extractDOM('Antal brukare');
                let brukare = brukareStr !== "SAKNAS" ? brukareStr + " st" : "";

                // --- Nästa Besiktning (Deadline) ---
                let besiktningRaw = extractDOM('Besiktas senast');
                let besiktning = "";
                if (besiktningRaw !== "SAKNAS") {
                    let dMatch = besiktningRaw.match(/\d{4}-\d{2}-\d{2}/);
                    if (dMatch) besiktning = dMatch[0];
                }

                // --- BYGGER MÄTARHISTORIK ---
                let senastGodkandRaw = extractDOM('Senast godkända besiktning');
                let senastGodkandDatum = "";
                if (senastGodkandRaw !== "SAKNAS") {
                    let dMatch = senastGodkandRaw.match(/\d{4}-\d{2}-\d{2}/);
                    if (dMatch) senastGodkandDatum = dMatch[0];
                }
                
                let matarArray = [];
                // Har vi både miltal och datum för mätningen så bygger vi en historikrad
                if (miltal && senastGodkandDatum) {
                    matarArray.push({ 
                        type: 'Besiktning', 
                        mil: miltal, 
                        date: senastGodkandDatum 
                    });
                }

                // --- BYGGER ÄGARHISTORIK ---
                let forvarvsdatumRaw = extractDOM('Förvärvsdatum');
                let agarArray = [];
                if (forvarvsdatumRaw !== "SAKNAS") {
                    let dMatch = forvarvsdatumRaw.match(/\d{4}-\d{2}-\d{2}/);
                    if (dMatch) {
                        agarArray.push({ 
                            type: 'Ägare', 
                            desc: 'Nuvarande ägare (Transportstyrelsen)', 
                            date: dMatch[0] 
                        });
                    }
                }

                // --- Förbrukning ---
                let forbrukning = "";
                const allStrongs = Array.from(document.querySelectorAll('strong')); 
                const blandadNodes = allStrongs.filter(el => el.textContent.trim().toLowerCase() === 'blandad körning');
                for (let node of blandadNodes) {
                    let parent = node.closest('p') || node.parentElement;
                    if (parent && parent.textContent.toLowerCase().includes('l/100')) {
                        let match = parent.textContent.match(/(\d+,\d+)\s*l\/100\s*km/i);
                        if (match) {
                            forbrukning = match[1] + " l/100 km";
                            break;
                        }
                    }
                }

                // --- Motoreffekt (Räknar automatiskt om kW till hk) ---
                let effektRaw = extractDOM('Motoreffekt');
                let motoreffektStr = "";
                if (effektRaw !== "SAKNAS") {
                    let kwMatch = effektRaw.match(/(\d+(?:,\d+)?)/); // Fångar in tex "75" eller "75,5"
                    if (kwMatch) {
                        let kwNum = parseFloat(kwMatch[1].replace(',', '.')); // Konverterar till decimaltal för matten
                        let hkNum = Math.round(kwNum * 1.35962); // 1 kW = 1.36 hk
                        motoreffektStr = `${kwMatch[1]} kW / ${hkNum} hk`; // Sammanfogar resultatet
                    }
                }

                let forsta_reg = extractDOM(['Första registreringsdatum', 'Datum för första ibruktagande', 'I trafik första gången i Sverige', 'Fordonet tillverkat']);

                const payload = {
                    source: 'Transportstyrelsen_Extension', 
                    regnr: activeReg, 
                    bilmodell: modell.trim() || 'Okänd modell',
                    forsta_reg: forsta_reg !== 'SAKNAS' ? forsta_reg : "",
                    fabrikat: fabrikat !== 'SAKNAS' ? fabrikat : "",
                    handelsbeteckning: handelsbeteckning !== 'SAKNAS' ? handelsbeteckning : "",
                    vin: extractDOM(['Identifieringsnummer', 'Chassinummer', 'Chassinummer/VIN']),
                    årsmodell: extractDOM(['Fordonsår', 'Modellår']),
                    fordonsstatus: extractDOM('Fordonsstatus'),
                    drivmedel: extractDOM('Drivmedel'),
                    växellåda: extractDOM('Växellåda'),
                    besiktning_senast: besiktning,
                    årsskatt: arsskatt,
                    motorkod: extractDOM('Variant'), 
                    miltal: miltal,
                    brukare: brukare,
                    svensksåld: svensksald,
                    förbrukning: forbrukning,
                    motoreffekt: motoreffektStr, // Skickar med den uträknade effekten
                    matarhistorik: matarArray, 
                    agarhistorik: agarArray    
                };

                // Rensa bort eventuella "SAKNAS"-värden innan payload skickas
                Object.keys(payload).forEach(key => {
                    if (payload[key] === 'SAKNAS') payload[key] = '';
                });

                closeExtensionTask(payload, widget, 'Data hämtad från Transportstyrelsen!');
        
    } catch (err) {
        abortExtensionTask(widget, err.message === 'IP_SPARR' ? 'IP-SPÄRR: För många sökningar.' : 'Timeout. Avbryter.', 5000);
    }
}

// ==========================================
// 5. BILUPPGIFTER.SE SKRAPA (Blixtsnabb via MutationObserver)
// ==========================================
async function startBURadar(activeReg) {
    if (window.osRadarActive) return;
    window.osRadarActive = true;
    const widget = new RadarWidget('Datainsamling', `Laddar Biluppgifter...`, 'blue');

    try {
        // 1. Klicka på "Hämta motorkod" exakt den millisekund knappen renderas
        // 1. Klicka på "Hämta motorkod" och VÄNTA PÅ AJAX-SVARET
        let btnClicked = false;
        try {
            await ScraperUtils.waitForCondition(() => {
                const btn = Array.from(document.querySelectorAll('a, button, span, div, p')).find(el => el.textContent && el.textContent.trim() === 'Hämta motorkod');
                if (btn) {
                    btn.click();
                    btnClicked = true;
                    return true;
                }
                if (document.body.innerText.match(/Motorkod[^\w]*[A-Z0-9\-]{2,10}/i)) return true;
                return false;
            }, 4000);
            
            if (btnClicked) {
                widget.updateText('Laddar motorkod...');
                await new Promise(res => setTimeout(res, 1200)); // Ge servern 1.2 sek att svara
            }
        } catch(e) {}

        // 2. Koden pausar asynkront här och hugger exakt när texten laddats in!
        await ScraperUtils.waitForCondition(() => {
            const visibleText = document.body.innerText;
            return visibleText.includes('Modellår') || visibleText.includes('Status') || visibleText.includes('Mätarställning');
        }, 15000);

        // FIX: Biluppgifter laddar ibland in "Bilhandlarpris" (Värdering) asynkront precis efter huvudtexten.
        // Vi ger den upp till 800 millisekunder på sig att rita ut priset. Om det dyker upp hugger vi det direkt,
        // om det inte dyker upp (vissa bilar saknar pris) går koden vidare automatiskt utan att krascha!
        try {
            await ScraperUtils.waitForCondition(() => document.body.innerText.includes('Bilhandlarpris'), 800);
        } catch (e) {
            // Finns inget pris, vi kör på med det vi har!
        }

        widget.updateText('Extraherar data...');

        // 3. Nu är vi 100% säkra på att koden är laddad – plocka ut datan!
        const textLine = document.body.innerText.replace(/\s+/g, ' ');
                let modell = (document.title || "").replace(new RegExp(activeReg, 'ig'), '').replace(/Biluppgifter(?:\.se)?/ig, '').replace(/[-|]/g, '').trim(); 
                let motorkod = ScraperUtils.extractMatch(textLine, /Motorkod[^\w]*([A-Z0-9\-]{2,10})/i).toUpperCase();
        if (['TECDOC', 'SAKNAS', 'INFO', 'HÄMTA'].includes(motorkod) || motorkod.includes('HÄMTA') || motorkod.includes('HMTA')) motorkod = "";

                let agare = "";
                if (textLine.includes("ägs av")) {
                    let afterText = textLine.split(/ägs av/i)[1]; 
                    let cleanOwnerPart = afterText.split(/(?:\s+en\s+|\s+ett\s+|\s+från\s+|\.?\s+Vi\s+uppskattar)/i)[0].trim();
                    let city = ScraperUtils.extractMatch(afterText, /\b(?:från|i)\s+([A-ÖÅ][a-öåäöA-ÖÅ\s-]{1,20}?\b)(?=\s*[,.]|\s+har|\s+ägde|\s+ägt|\s+handlaren|\s+och|\s+eller|\s+Vi|\s+den)/i);
                    let ägarTidMatch = afterText.match(/(?:har ägt|ägt)[^,.]*?\si\s+(\d+\s*(?:år|mån|vecka|dagar)[^,.]*)/i);
                    let ägarTid = ägarTidMatch ? `ägt i ${ägarTidMatch[1].trim().replace(/månader/ig, 'mån')}` : "";
                    let extraDetaljer = [city, ägarTid].filter(Boolean).join(", ");
                    agare = `${cleanOwnerPart}${extraDetaljer ? ' (' + extraDetaljer + ')' : ''}`;
                }

                let årsskatt = ScraperUtils.extractTaxDOM();
                let ägarAntal = ScraperUtils.extractMatch(textLine, /Antal ägare\s+(\d+)/i);
                
                let svensksald = ScraperUtils.extractMatch(textLine, /Svensksåld\s*(?:✓|✔)?\s*(Ja|Nej)/i);
                if (!svensksald) {
                    let imp = ScraperUtils.extractMatch(textLine, /Import \/ Införsel\s+(Ja|Nej)/i);
                    if (imp) svensksald = (imp.toLowerCase() === 'nej') ? 'Ja' : 'Nej';
                }

                let drivhjul = ScraperUtils.extractFromBUGrid('Drivning') || ScraperUtils.extractFromBUGrid('Drivhjul') || ScraperUtils.extractMatch(textLine, /(?:Drivhjul|Drivning)\s*(4WD|2WD|AWD|FWD|RWD|Fram|Bak|Fyrhjulsdrift|Framhjulsdrift|Bakhjulsdrift)/i);
                if (drivhjul) {
                    if (drivhjul.toLowerCase().includes('fyr')) drivhjul = '4WD';
                    else if (drivhjul.toLowerCase().includes('fram')) drivhjul = 'FWD';
                    else if (drivhjul.toLowerCase().includes('bak')) drivhjul = 'RWD';
                }

                let forbrukning = ScraperUtils.extractMatch(textLine, /([\d.,]+\s*l\/100\s*km)/i);
                if (!forbrukning) {
                    forbrukning = ScraperUtils.extractMatch(textLine, /(?:Blandad|Blandad körning)[^\d]*?([\d.,]+\s*l\/100km)/i);
                }

                // 1. FORDONSHISTORIK
                let historikArray = [];
                const hLog = document.querySelector('#history-log .inner');
                if (hLog) {
                    let lines = hLog.innerText.split('\n').map(s => s.trim()).filter(l => l && !l.includes('Biltrygg'));
                    for (let i = 0; i < lines.length; i++) {
                        if (/\d{4}-\d{2}-\d{2}/.test(lines[i])) {
                            let date = lines[i].match(/\d{4}-\d{2}-\d{2}/)[0];
                            let title = (i > 0) ? lines[i - 1] : "Händelse";
                            let desc = (i < lines.length - 1) ? lines[i + 1] : "";
                            historikArray.push({ date, title, desc });
                        }
                    }
                }

                // 2. MÄTARHISTORIK
                let matarArray = [];
                const mTimeline = document.querySelector('#meter-timeline');
                if (mTimeline) {
                    Array.from(mTimeline.querySelectorAll('li')).forEach(li => {
                        let text = li.innerText.replace(/\s+/g, ' ').trim();
                        let dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
                        let milMatch = text.match(/(\d[\d\s]*mil)/i);
                        if (dateMatch && milMatch) {
                            let date = dateMatch[0];
                            let mil = milMatch[1].trim();
                            let type = text.replace(date, '').replace(mil, '').trim();
                            matarArray.push({ type, mil, date });
                        }
                    });
                }

                // 3. ÄGARHISTORIK
                let agarArray = [];
                const oTimeline = document.querySelector('#owner-history ul.owners') || document.querySelector('#owner-history ul');
                if (oTimeline) {
                    Array.from(oTimeline.querySelectorAll('li')).forEach(li => {
                        let text = li.innerText.replace(/\s+/g, ' ').trim();
                        let dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
                        if (dateMatch) {
                            let date = dateMatch[0];
                            // Texten innan datumet innehåller ofta typ (Privatperson, Bilhandlare etc) och beskrivning
                            let mainPart = text.replace(date, '').trim();
                            
                            // Försök särskilja typ från beskrivning
                            let types = ['Privatperson', 'Bilhandlare', 'Företag', 'Finans', 'Leasingbolag', 'Dödsbo'];
                            let type = "Ägare";
                            for (let t of types) {
                                if (mainPart.toLowerCase().includes(t.toLowerCase())) {
                                    type = t;
                                    break;
                                }
                            }
                            
                            agarArray.push({ type, desc: mainPart, date });
                        }
                    });
                }

                // 3. SKICKA DATA
                let forsta_reg = ScraperUtils.extractFromBUGrid('Först registrerad') || ScraperUtils.extractFromBUGrid('I trafik första gången i Sverige') || ScraperUtils.extractMatch(textLine, /(?:Först registrerad|I trafik första gången|Första registrering)[^\d]*(\d{4}-\d{2}-\d{2})/i);

                const payload = {
                    source: 'Biluppgifter.se', regnr: activeReg, bilmodell: modell, motorkod, agare,
                    forsta_reg: forsta_reg,
                    vardering: ScraperUtils.extractMatch(textLine, /Bilhandlarpris[^\d]*([\d\s]+(?:-|till)[\d\s]+kr)/i).replace(/\s+/g, ' '),
                    vin: ScraperUtils.extractMatch(textLine, /(?:Chassinummer|VIN)[^\w]*([A-HJ-NPR-Z0-9]{17})/i),
                    årsmodell: ScraperUtils.extractMatch(textLine, /(?:Modellår|Fordonsår)[^\w]*(\d{4})/i),
                    miltal: ScraperUtils.extractMatch(textLine, /Mätarställning[^\d]*([\d\s]+mil)/i),
                    växellåda: ScraperUtils.extractMatch(textLine, /Växellåda[^\w]*(Manuell|Automat)/i),
                    drivmedel: ScraperUtils.extractMatch(textLine, /(?:Bränsle|Drivmedel)[^\w]*(Bensin|Diesel|El|Laddhybrid|Hybrid|Etanol)/i),
                    status: ScraperUtils.extractMatch(textLine, /Status[^\w]*(I trafik|Avställd|Avregistrerad)/i),
                    besiktning: ScraperUtils.extractMatch(textLine, /Nästa besiktning senast[^\d]*(\d{4}-\d{2}-\d{2})/i),
                    årsskatt: årsskatt,
                    förbrukning: forbrukning,
                    brukare: ägarAntal ? ägarAntal + " st" : "",
                    svensksåld: svensksald,
                    drivhjul: drivhjul,
                    historik: historikArray,
                    matarhistorik: matarArray,
                    agarhistorik: agarArray
                };

                closeExtensionTask(payload, widget, 'Data hämtad från Biluppgifter!');
                
    } catch (error) {
        // Om sidan av någon anledning inte renderar datan på 15 sekunder
        abortExtensionTask(widget, 'Timeout på Biluppgifter.', 3000);
    }
}

// ==========================================
// 6. VISUELL REG-NR HIGHLIGHTING & PLANERARE OS
// ==========================================
if (!HOST.includes('oljemagasinet.se') && !HOST.includes('car.info') && !HOST.includes('transportstyrelsen.se') && !HOST.includes('trodo.se')) {
    
    // Injicera CSS-mallarna en enda gång för maximal prestanda!
    if (!document.getElementById('bmg-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'bmg-highlight-styles';
        style.textContent = `
            /* 1. SaaS Badge */
            .bmg-style-saas { background-color: rgba(249, 115, 22, 0.15) !important; color: #f97316 !important; border: 1px solid rgba(249, 115, 22, 0.3) !important; border-radius: 6px !important; padding: 1px 6px !important; font-weight: 700 !important; letter-spacing: 0.5px !important; cursor: pointer !important; transition: all 0.2s ease !important; display: inline-block !important; pointer-events: auto !important; margin: 0 2px !important; }
            .bmg-style-saas:hover { background-color: #f97316 !important; color: #ffffff !important; }
            
            /* 2. Underline Reveal */
            .bmg-style-underline { background-color: transparent !important; color: inherit !important; border-bottom: 2px solid #f97316 !important; padding: 0 2px !important; font-weight: 800 !important; cursor: pointer !important; transition: all 0.2s ease-out !important; display: inline-block !important; pointer-events: auto !important; box-shadow: inset 0 0 0 rgba(249, 115, 22, 0) !important; }
            .bmg-style-underline:hover { box-shadow: inset 0 -24px 0 rgba(249, 115, 22, 0.15) !important; color: #f97316 !important; }
            
            /* 3. Diskret Ram (Ghost) */
            .bmg-style-ghost { background-color: transparent !important; color: inherit !important; border: 1px dashed #f97316 !important; border-radius: 4px !important; padding: 1px 5px !important; font-weight: 700 !important; cursor: pointer !important; transition: all 0.2s ease !important; display: inline-block !important; pointer-events: auto !important; margin: 0 2px !important; }
            .bmg-style-ghost:hover { background-color: rgba(249, 115, 22, 0.1) !important; border-style: solid !important; color: #f97316 !important; }
            
            /* 4. Sidomarkör (Accent) - Med adaptiv ram */
            .bmg-style-accent { background-color: transparent !important; color: inherit !important; border: 1px solid rgba(148, 163, 184, 0.4) !important; border-left: 3px solid #f97316 !important; border-radius: 4px !important; padding: 1px 5px 1px 6px !important; font-weight: 700 !important; cursor: pointer !important; transition: all 0.2s ease !important; display: inline-block !important; pointer-events: auto !important; margin: 0 2px !important; box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important; }
            .bmg-style-accent:hover { background-color: rgba(249, 115, 22, 0.15) !important; color: #f97316 !important; border-color: rgba(249, 115, 22, 0.4) !important; border-left-color: #ea580c !important; }
        `;
        document.head.appendChild(style);
    }

    let highlightInterval = null, isHighlightEnabled = true, currentHighlightStyle = 'saas';

    function highlightRegNumbers() {
        if (!isHighlightEnabled) return;
        const regex = /\b(?!(?:SEK|EUR|USD)\s?)[A-Z]{3}\s?[0-9]{2}[A-Z0-9]\b(?!\s*(?:kr|:-|\.\d|,\d))/g;
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node, nodesToReplace = [];
        
        while (node = walker.nextNode()) {
            const p = node.parentElement;
            if (p && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'BUTTON'].includes(p.tagName) && !p.classList.contains('bmg-reg-highlight') && !p.isContentEditable && regex.test(node.nodeValue)) nodesToReplace.push(node);
        }
        
        nodesToReplace.forEach(textNode => {
            const text = textNode.nodeValue; let match, lastIndex = 0, matched = false; const fragment = document.createDocumentFragment();
            regex.lastIndex = 0;
            while ((match = regex.exec(text)) !== null) {
                matched = true; fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));
                
                const span = document.createElement('span'); 
                // Kopplar automatiskt på den CSS-klass som du valt i inställningarna!
                span.className = `bmg-reg-highlight bmg-style-${currentHighlightStyle}`;
                span.textContent = match[0]; 
                span.title = 'Sök fordon med AutoSearch';
                
                span.addEventListener('mousedown', (e) => {
                    if (e.button === 0) { e.preventDefault(); e.stopPropagation(); chrome.runtime.sendMessage({ action: 'OPEN_POPUP_FOR_REG', regnr: match[0].replace(/\s/g, '') }); }
                    else if (e.button === 2) { const sel = window.getSelection(), range = document.createRange(); range.selectNodeContents(span); sel.removeAllRanges(); sel.addRange(range); }
                });
                span.addEventListener('contextmenu', e => e.stopPropagation());
                fragment.appendChild(span); lastIndex = regex.lastIndex;
            }
            if (matched) { fragment.appendChild(document.createTextNode(text.substring(lastIndex))); if (textNode.parentNode) textNode.parentNode.replaceChild(fragment, textNode); }
        });
    }

    chrome.storage.local.get(['os_highlight_enabled', 'os_highlight_style'], (res) => {
        if (isHighlightEnabled = res.os_highlight_enabled !== false) {
            currentHighlightStyle = res.os_highlight_style || 'saas';
            highlightInterval = setInterval(highlightRegNumbers, 2000);
        }
    });

    if (HOST === '' || HOST.includes('planerare') || HOST.includes('localhost') || HOST.includes('127.0.0.1') || HOST.includes('amarsut')) {
        // Rättat "source" till AutoSearch_Extension så systemen känner igen varandra
        const sendToFb = (d, isSilent) => d?.regnr && window.postMessage(Object.assign({}, d, { source: 'AutoSearch_Extension', silentSync: isSilent }), "*");
        setTimeout(() => chrome.storage.local.get(['os_search_history', 'os_cloud_sync_enabled'], (res) => { if (res.os_cloud_sync_enabled !== false && res.os_search_history) [...res.os_search_history].reverse().forEach(d => sendToFb(d, true)); }), 5000);
        chrome.storage.onChanged.addListener((changes, ns) => { if (ns === 'local' && changes.fordonsdata_result) chrome.storage.local.get(['os_cloud_sync_enabled'], (res) => { if (res.os_cloud_sync_enabled !== false) sendToFb(changes.fordonsdata_result.newValue, false); }); });
        
        // NYTT: Lyssna på kommandon FRÅN Serviceprotokollet för att fjärrstarta skrapningen!
        // NYTT: Fjärrstyrning från AutoGrid med specifik motor/källa
        window.addEventListener('message', (event) => {
            if (event.data && event.data.action === 'BMG_REMOTE_SEARCH' && event.data.regnr) {
                chrome.storage.local.get(['os_default_search'], (res) => {
                    // Om AutoGrid ber om en specifik källa kör vi den, annars tar vi standard!
                    const engine = event.data.engine || res.os_default_search || 'combo-ci-om';
                    const reg = event.data.regnr;
                    
                    let queue = [];
                    let startUrl = "";
                    let startTarget = "";

                    if (engine === 'combo-ci-om') {
                        queue = ['ci', 'om'];
                        startUrl = `https://www.car.info/sv-se/license-plate/S/${reg}#specs_bmg_export`;
                        startTarget = 'ci';
                    } else if (engine === 'combo') {
                        queue = ['bu', 'om'];
                        startUrl = `https://biluppgifter.se/fordon/${reg}`;
                        startTarget = 'bu';
                    } else if (engine === 'ci') {
                        queue = ['ci'];
                        startUrl = `https://www.car.info/sv-se/license-plate/S/${reg}#specs_bmg_export`;
                        startTarget = 'ci';
                    } else if (engine === 'bu') {
                        queue = ['bu'];
                        startUrl = `https://biluppgifter.se/fordon/${reg}`;
                        startTarget = 'bu';
                    } else if (engine === 'ts') {
                        queue = ['ts'];
                        startUrl = 'https://fordon-fu-regnr.transportstyrelsen.se/';
                        startTarget = 'ts';
                    } else if (engine === 'om') {
                        queue = ['om'];
                        startUrl = 'https://www.oljemagasinet.se';
                        startTarget = 'om';
                    }
                    
                    // Vi sätter upp uppgiften direkt här och använder fönstrets inbyggda popup-funktion (window.open)
                    chrome.storage.local.set({ 
                        'os_combo_queue': queue, 
                        'os_combo_regnr': reg,
                        'os_external_task': { regnr: reg, target: startTarget },
                        'os_external_task_origin': 'webpage'
                    }, () => {
                        window.open(startUrl, 'VehicleRadarPopup', 'width=450,height=550,left=9999,top=9999');
                    });
                });
            }

            // NYTT: Fångar upp när AutoGrid ber om att skanna ETKA i bakgrunden
            if (event.data && event.data.action === 'BMG_FETCH_ETKA' && event.data.vin) {
                chrome.runtime.sendMessage({ action: 'FETCH_ETKA_OEM', vin: event.data.vin }, (response) => {
                    window.postMessage({ action: 'BMG_ETKA_RESULT', data: response }, '*');
                });
            }
        });
    }
}

// ==========================================
// LYSSNARE FÖR ATT ÖPPNA POPUP FRÅN TILLÄGGET
// ==========================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FORCE_WINDOW_OPEN') {
        // Tvingar fram den lilla popupen i nedre hörnet!
        window.open(request.url, 'VehicleRadarPopup', 'width=450,height=550,left=9999,top=9999');
        sendResponse({success: true});
    }
});