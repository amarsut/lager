/**
 * PLANERARE // OS - EXTERNAL SCRAPER EXTENSION
 * Version: 4.7 (Classic TS Engine + Shadow DOM)
 */

// ==========================================
// 1. VERKTYG & HJÄLPMEDEL
// ==========================================
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
}

// ==========================================
// 2. ISOLERAD WIDGET (Shadow DOM)
// ==========================================
class RadarWidget {
    constructor(title, subtitle, theme = 'orange') {
        this.host = document.createElement('div');
        this.host.id = 'os-radar-host';
        this.host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;';
        document.documentElement.appendChild(this.host);
        
        this.shadow = this.host.attachShadow({ mode: 'open' });
        this.theme = theme;
        this.colors = theme === 'blue' 
            ? { main: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.2)', success: '#10b981' } 
            : { main: '#f97316', glow: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.2)', success: '#10b981' }; 
            
        this.render(title, subtitle);
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
            
            .os-radar-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(1.2); background: linear-gradient(135deg, rgba(15,21,34,0.95), rgba(20,28,45,0.95)); border: 1px solid ${c.bg}; border-radius: 16px; padding: 16px 24px; display: flex; align-items: center; gap: 16px; transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); animation: pulseGlow 2s ease-in-out infinite alternate; pointer-events: all; width: max-content; }
            .os-radar-wrapper.shrunk .os-radar-box { top: calc(100% - 24px); left: calc(100% - 24px); transform: translate(-100%, -100%) scale(1); }
        `;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'os-radar-wrapper';
        this.wrapper.innerHTML = `
            <div class="os-radar-box">
                <div style="width:36px; height:36px; position:relative; flex-shrink:0;">
                    <div style="position:absolute; inset:0; border:3px solid ${c.bg}; border-top-color:${c.main}; border-radius:50%; animation: spinOuter 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;" id="os-spin-1"></div>
                    <div style="position:absolute; inset:6px; border:2px solid rgba(255,255,255,0.1); border-bottom-color:#ffffff; border-radius:50%; animation: spinInner 1.2s linear infinite;" id="os-spin-2"></div>
                </div>
                <div style="flex-grow:1; min-width:140px;">
                    <h1 style="color:${c.main}; font-size:11px; font-weight:900; letter-spacing:1.5px; margin:0; text-transform:uppercase; text-shadow: 0 0 10px ${c.bg};">${title}</h1>
                    <p style="color:#e4e4e7; font-size:10px; font-weight:500; letter-spacing:0.5px; margin:4px 0 0 0; opacity: 0.9;" id="os-radar-text">${subtitle}</p>
                </div>
            </div>
        `;
        
        this.shadow.appendChild(style);
        this.shadow.appendChild(this.wrapper);
    }

    shrink() { if (this.wrapper) this.wrapper.classList.add('shrunk'); }
    updateText(text) { const textEl = this.shadow.getElementById('os-radar-text'); if (textEl) textEl.innerText = text; }
    
    stopAnimation() {
        const box = this.shadow.querySelector('.os-radar-box');
        if (box) box.style.animation = 'none';
        const spin1 = this.shadow.getElementById('os-spin-1');
        const spin2 = this.shadow.getElementById('os-spin-2');
        if (spin1) spin1.style.animation = 'none';
        if (spin2) spin2.style.display = 'none';
    }

    success(text) {
        this.wrapper.classList.remove('shrunk');
        const box = this.shadow.querySelector('.os-radar-box');
        box.style.animation = 'none'; 
        box.style.borderColor = this.colors.success;
        box.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.4)`;
        
        const spin1 = this.shadow.getElementById('os-spin-1');
        spin1.style.borderColor = this.colors.success;
        spin1.style.borderTopColor = 'transparent';
        spin1.style.animation = 'spinOuter 3s linear infinite';
        this.shadow.getElementById('os-spin-2').style.display = 'none';
        
        this.shadow.getElementById('os-radar-text').innerHTML = `<span style="color:${this.colors.success}; font-weight:900;">✓ ${text}</span>`;
    }

    error(text) {
        this.wrapper.classList.remove('shrunk');
        const box = this.shadow.querySelector('.os-radar-box');
        box.style.animation = 'none'; box.style.borderColor = '#ef4444';
        this.shadow.getElementById('os-radar-text').innerHTML = `<span style="color:#ef4444; font-weight:900;">✕ ${text}</span>`;
    }

    destroy() {
        this.wrapper.style.opacity = '0';
        setTimeout(() => this.host.remove(), 500);
    }
}

// ==========================================
// 3. CAR.INFO SKANNERN
// ==========================================
if (window.location.hostname.includes('car.info') && window.location.hash.includes('bmg_export')) {
    const widget = new RadarWidget('Datalänk Aktiv', 'Laddar uppgifter...');
    
    let searchTimeout = setTimeout(() => {
        carInfoObserver.disconnect();
        widget.error('Timeout - Kunde inte ladda data');
        setTimeout(() => window.close(), 2000);
    }, 15000); // 15 sekunder max

    const carInfoObserver = new MutationObserver((mutations, obs) => {
        try {
            let regnr = "", model = "", motor = "", miltal = "", oljevolym = "", årsmodell = "", vin = "";
            const visibleText = document.body.innerText;
            const hiddenText = document.documentElement.textContent; 
            const compressedText = hiddenText.replace(/\s+/g, ' ');

            const urlParts = window.location.pathname.split('/');
            const potentialReg = urlParts[urlParts.length - 1];
            if (potentialReg && potentialReg.length <= 6) regnr = potentialReg.toUpperCase();

            const h1 = document.querySelector('h1');
            if (h1) {
                let rawModel = h1.innerText.replace(regnr, '').replace(/^[S\s\n]+/g, '').replace(/(\r\n|\n|\r)/gm, " ").trim();
                const yearMatch = rawModel.match(/,\s*(19\d{2}|20\d{2})\s*$/);
                if (yearMatch) årsmodell = yearMatch[1];
                else {
                    const fallbackYear = compressedText.match(/(?:Fordonsår|Tillverkningsår)\s*(\d{4})/i);
                    if (fallbackYear) årsmodell = fallbackYear[1];
                }
                model = rawModel; 
            }

            const vinMatch = compressedText.match(/(?:Chassinummer|VIN)[\s\S]{0,30}?([A-HJ-NPR-Z0-9]{17})/i);
            if (vinMatch) vin = vinMatch[1].trim().toUpperCase();

            const motorMatch = compressedText.match(/(?:Motorkod|Motorfamilj)\s*([A-Z0-9\-]{3,10})/i);
            if (motorMatch) motor = motorMatch[1].trim();

            const milMatch = visibleText.match(/Mätarställning[\s\n]*([\d\s]+mil)/i) || visibleText.match(/Senaste mätarställning[\s\n]*([\d\s]+mil)/i);
            if (milMatch) miltal = milMatch[1].trim();

            const oljaMatch = compressedText.match(/Motorolja,\s*volym\s*([\d.,]+)\s*l/i) || compressedText.match(/Oljevolym\s*([\d.,]+)\s*l/i) || compressedText.match(/Motorolja\s*([\d.,]+)\s*l/i);
            if (oljaMatch) oljevolym = oljaMatch[1].trim();

            // Trigg: Vi har tillräckligt med data (eller så har h1 laddats och vi får nöja oss med det vi har)
            if (oljaMatch || motorMatch || h1) {
                obs.disconnect(); // Stanna övervakningen
                clearTimeout(searchTimeout);

                const fordonData = {
                    regnr, bilmodell: model || "Okänd modell", motorkod: motor || "", miltal: miltal || "", oljevolym: oljevolym || "", årsmodell: årsmodell || "", vin: vin || "",
                    source: "Car.info_Extension"
                };

                widget.success('Fordon data fångad!');
                if (window.opener) window.opener.postMessage(fordonData, "*");
                setTimeout(() => window.close(), 1200);
            }
        } catch (e) { console.error("Fel:", e); }
    });

    carInfoObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// ==========================================
// 4. OLJEMAGASINET SPÖK-SKANNERN 
// ==========================================
if (window.location.hostname.includes('oljemagasinet.se')) {
    if (window._omListener) window.removeEventListener('message', window._omListener);
    
    window._omListener = (event) => {
        if (event.data && event.data.action === 'START_OS_RADAR') {
            const activeReg = event.data.regnr;
            if (window.osRadarActive) return;
            window.osRadarActive = true;

            const widget = new RadarWidget('Systemradar', `Söker: ${activeReg}...`);

            const tryToInput = setInterval(() => {
                const inputs = Array.from(document.querySelectorAll('input'));
                const regInput = inputs.find(i => 
                    (i.placeholder && i.placeholder.toLowerCase().includes('reg')) || 
                    (i.name && i.name.toLowerCase().includes('reg')) || 
                    (i.id && i.id.toLowerCase().includes('reg')) ||
                    (i.className && i.className.toLowerCase().includes('reg'))
                );

                if (regInput && !regInput.value) {
                    clearInterval(tryToInput);
                    regInput.focus();
                    ScraperUtils.setNativeValue(regInput, activeReg);
                    
                    setTimeout(() => {
                        const form = regInput.closest('form');
                        if (form) {
                            const btn = form.querySelector('button') || form.querySelector('input[type="submit"]');
                            if (btn) btn.click();
                            else form.submit();
                        } else {
                            regInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', keyCode: 13, bubbles: true }));
                        }
                    }, 400);
                }
            }, 500); 

            let timeoutTrigger = setTimeout(() => widget.shrink(), 4000);

            const observer = new MutationObserver((mutations, obs) => {
                const text = document.body.innerText.replace(/\s+/g, ' '); 
                const volymMatch = text.match(/(?:Kapacitet|Volym|Motorolja|Påfyllningsmängd|Servicevolym|Rymmer|Åtgång|Oljesump|filter)[\s\S]{0,120}?(\d+[.,]\d+)\s*(?:l|liter)/i) || 
                                   text.match(/(\d+[.,]\d+)\s*(?:l|liter)[\s\S]{0,80}?(?:Kapacitet|Volym|Motorolja|Åtgång|Oljesump|filter)/i);

                if (volymMatch) {
                    obs.disconnect(); 
                    clearTimeout(timeoutTrigger);
                    
                    const volym = volymMatch[1].replace(',', '.').trim();
                    let motorkod = "", arsmodell = "", bilmodell = "";
                    
                    try {
                        const carBox = document.querySelector('.plate-car-selection-box');
                        if (carBox) {
                            const titleEl = carBox.querySelector('p strong');
                            if (titleEl) {
                                const titleParts = titleEl.innerHTML.split(/<br\s*\/?>/i);
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = titleParts[0];
                                bilmodell = tempDiv.textContent.trim();
                                
                                if (titleParts.length > 1) {
                                    const yearMatch = titleParts[1].match(/\b(19\d{2}|20\d{2})\b/);
                                    if (yearMatch) arsmodell = yearMatch[1];
                                } else {
                                    const yearMatch = bilmodell.match(/\b(19\d{2}|20\d{2})\b/);
                                    if (yearMatch) arsmodell = yearMatch[1];
                                }
                            }
                            
                            const ths = carBox.querySelectorAll('th');
                            for (let th of ths) {
                                if (th.textContent.trim().toLowerCase().includes('motorkod')) {
                                    const nextTd = th.nextElementSibling;
                                    if (nextTd && nextTd.tagName.toLowerCase() === 'td') motorkod = nextTd.textContent.trim();
                                }
                            }
                        }
                        
                        if (!motorkod || !arsmodell || !bilmodell) {
                            const flatText = document.body.innerText.replace(/\s+/g, ' ');
                            if (!motorkod) { let mMatch = flatText.match(/Motorkod\s*([A-Z0-9\-]{3,12})/i); if (mMatch) motorkod = mMatch[1].trim(); }
                            if (!arsmodell) { let yMatch = flatText.match(/Årsmodell\s*(\d{4})/i); if (yMatch) arsmodell = yMatch[1].trim(); }
                            if (!bilmodell) {
                                const safeReg = activeReg.replace(/[^A-Z0-9]/gi, '');
                                const modelRegex = new RegExp(`([A-Z0-9\\s\\-\\(\\)\\.,]+?)\\s*(?:Bensin|Diesel|El|Laddhybrid|Etano|Hybrid)?.*?\\(${safeReg}\\)`, 'i');
                                let modelMatch = flatText.match(modelRegex);
                                if (modelMatch) bilmodell = modelMatch[1].trim();
                            }
                        }
                    } catch (e) {}

                    const payload = { source: 'Oljemagasinet_Extension', regnr: activeReg, oljevolym: volym, motorkod, årsmodell: arsmodell, bilmodell };

                    if (!event.data.readOnly) {
                        if (event.source) event.source.postMessage(payload, "*");
                        else if (window.opener) window.opener.postMessage(payload, "*");
                        widget.success(`${volym} Liter Fångad!`);
                        setTimeout(() => window.close(), 1500);
                    } else {
                        const extraInfo = motorkod ? ` | Motor: ${motorkod}` : '';
                        widget.success(`Volym: ${volym} L${extraInfo}`);
                        widget.stopAnimation();
                    }
                }
            });

            observer.observe(document.body, { childList: true, subtree: true, characterData: true });

            setTimeout(() => {
                observer.disconnect();
                clearInterval(tryToInput);
                widget.destroy();
            }, 60000);
        }
    };
    window.addEventListener('message', window._omListener);
}

// ==========================================
// 5. TRANSPORTSTYRELSEN SKRAPA (MUTATION OBSERVER)
// ==========================================
if (window.location.hostname.includes('transportstyrelsen.se')) {
    
    if (window._tsListener) window.removeEventListener('message', window._tsListener);
    
    window._tsListener = (event) => {
        if (event.data && event.data.action === 'START_TS_RADAR') {
            const activeReg = event.data.regnr;
            if (window.osRadarActive) return;
            window.osRadarActive = true;

            const widget = new RadarWidget('Myndighetslänk', `Slår upp: ${activeReg}...`, 'blue');

            // 1. INMATNING (Körs tills fältet hittas)
            const tryToInput = setInterval(() => {
                const regInput = document.querySelector('input[type="text"], input[name*="regnr"], input[id*="reg"]');
                const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
                const searchBtn = buttons.find(b => b.innerText.toLowerCase().includes('sök') || b.value?.toLowerCase().includes('sök') || b.classList.contains('btn-primary'));

                if (regInput && searchBtn && !regInput.value) {
                    clearInterval(tryToInput);
                    regInput.value = activeReg;
                    regInput.dispatchEvent(new Event('input', { bubbles: true }));
                    regInput.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(() => searchBtn.click(), 800);
                }
            }, 500);

            // 2. EXTRAHERING MED MUTATION OBSERVER (Blixtsnabb, drar noll CPU)
            let timeoutTimer = setTimeout(() => {
                observer.disconnect();
                widget.error('Timeout. Hittade inte datan.');
                setTimeout(() => window.close(), 3000);
            }, 60000); // Ger upp efter 60 sekunder

            const observer = new MutationObserver((mutations, obs) => {
                const bodyTextLower = document.body.innerText.toLowerCase();
                
                // Captcha-skydd
                if (bodyTextLower.includes('robot') || bodyTextLower.includes('säkerhetskontroll')) {
                    widget.updateText('Kräver manuell Captcha. Lös i fönstret!');
                    return; 
                }

                // Trigg: Titta efter om Regnr OCH chassinummer syns. Då är sidan redo!
                if (bodyTextLower.includes(activeReg.toLowerCase()) && (bodyTextLower.includes('chassinummer') || bodyTextLower.includes('fordonsstatus'))) {
                    
                    obs.disconnect(); // Stanna övervakaren direkt så den inte körs i onödan
                    clearTimeout(timeoutTimer);
                    
                    widget.wrapper.classList.remove('shrunk');
                    widget.updateText('Extraherar all fordonsdata...');
                    
                    // Brute-force för att fälla ut alla dolda menyer
                    const openAllPanels = () => {
                        document.querySelectorAll('button, a, summary').forEach(el => {
                            if (el.getAttribute('aria-expanded') === 'false' || el.classList.contains('collapsed')) {
                                try { el.click(); } catch(e){}
                            }
                        });
                    };
                    
                    openAllPanels();
                    setTimeout(openAllPanels, 1000);

                    setTimeout(() => {
                        const finalLines = document.body.innerText.split('\n').map(l => l.trim()).filter(l => l !== '');
                        
                        const extract = (labels) => {
                            const labelArray = Array.isArray(labels) ? labels : [labels];
                            for (let label of labelArray) {
                                const idx = finalLines.findIndex(l => l.toLowerCase() === label.toLowerCase());
                                if (idx !== -1 && idx + 1 < finalLines.length) return finalLines[idx + 1];
                                
                                const inline = finalLines.find(l => l.toLowerCase().startsWith(label.toLowerCase() + ':'));
                                if (inline) return inline.substring(label.length + 1).trim();
                            }
                            return "SAKNAS";
                        };

                        const payload = { 
                            source: 'Transportstyrelsen_Extension', 
                            regnr: activeReg,
                            chassinummer: extract(['Chassinummer', 'Identifieringsnummer']),
                            fabrikat: extract(['Fabrikat', 'Märke']),
                            handelsbeteckning: extract(['Handelsbeteckning', 'Modell']),
                            färg: extract('Färg'),
                            fordonsår: extract(['Fordonsår', 'Årsmodell']),
                            tillverkad: extract(['Fordonet tillverkat', 'Tillverkningsår/månad']),
                            import: extract(['Import/införsel', 'Import']),
                            fordonsstatus: extract('Fordonsstatus'),
                            användningsförbud: extract(['Användningsförbud', 'Körförbud']),
                            besiktning_senast: extract(['Besiktigas senast', 'Senaste besiktning', 'Giltig till']),
                            mätarställning: extract('Mätarställning'),
                            upplysningar: extract(['Upplysningar', 'Övriga upplysningar']),
                            årsskatt: extract('Årsskatt'),
                            betalningsmånad: extract(['Betalningsmånad/er', 'Betalningsmånad']),
                            återbetalning: extract(['Återbetalning vid avställning', 'Återbetalning']),
                            växellåda: extract('Växellåda'),
                            drivmedel: extract(['Drivmedel', 'Drivmedel 1']),
                            motoreffekt: extract(['Motoreffekt', 'Effekt']),
                            euroklass: extract(['Euroklassning', 'Miljöklass']),
                            blandad_körning: extract(['Blandad körning', 'Bränsleförbrukning'])
                        };

                        if (window.opener) window.opener.postMessage(payload, "*");
                        widget.success('Data sparad!');
                        setTimeout(() => window.close(), 2000);
                    }, 2500);
                }
            });

            // Starta övervakningen av hela sidan
            observer.observe(document.body, { childList: true, subtree: true, characterData: true });
        }
    };
    window.addEventListener('message', window._tsListener);
}
