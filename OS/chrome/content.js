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
        
        // Gömmer rutan (opacity: 0) tills minnet är avläst för att slippa blinkningar
        this.host.style.cssText = 'position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;';
        document.documentElement.appendChild(this.host);
        
        this.shadow = this.host.attachShadow({ mode: 'open' });
        this.theme = theme;
        this.colors = theme === 'blue' 
            ? { main: '#3b82f6', glow: 'rgba(59,130,246,0.4)', bg: 'rgba(59,130,246,0.2)', success: '#10b981' } 
            : { main: '#f97316', glow: 'rgba(249,115,22,0.4)', bg: 'rgba(249,115,22,0.2)', success: '#10b981' }; 
            
        this.isMinimized = false;
        this.render(title, subtitle);

        // Läs av Chromes minne (Överlever när TS byter länk)
        chrome.storage.local.get(['os_radar_minimized'], (result) => {
            if (result.os_radar_minimized === true) {
                this.wrapper.classList.add('shrunk');
                this.isMinimized = true;
            }
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
            
            .os-radar-wrapper.shrunk .os-radar-box { 
                top: auto; bottom: 24px; 
                left: auto; right: 24px; 
                transform: translate(0, 0) scale(1); 
                padding: 0; 
                border-radius: 50%; 
                width: 56px; height: 56px; 
                gap: 0; 
                cursor: pointer; 
                border: 2px solid ${c.main};
                box-shadow: 0 10px 25px rgba(0,0,0,0.5), 0 0 15px ${c.glow};
            }
            
            .os-radar-wrapper.shrunk .os-radar-content { display: none !important; }
            .os-radar-wrapper.shrunk #os-min-btn { display: none !important; }

            .os-radar-wrapper.captcha-mode { 
                background-color: transparent !important; 
                backdrop-filter: blur(0px) !important; 
                pointer-events: none !important; 
            }
            .os-radar-wrapper.captcha-mode .os-radar-box { 
                top: 10%; 
                transform: translate(-50%, 0) scale(1); 
                pointer-events: none !important; 
                box-shadow: 0 15px 35px rgba(0,0,0,0.8);
            }
            
            #os-min-btn:hover { background: rgba(255,255,255,0.1); color: #fff !important; }
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
                    <h1 style="color:${c.main}; font-size:11px; font-weight:900; letter-spacing:1.5px; margin:0; text-transform:uppercase; text-shadow: 0 0 10px ${c.bg};">${title}</h1>
                    <p style="color:#e4e4e7; font-size:10px; font-weight:500; letter-spacing:0.5px; margin:4px 0 0 0; opacity: 0.9;" id="os-radar-text">${subtitle}</p>
                </div>

                <button id="os-min-btn" style="background:transparent; border:none; color:#9ca3af; cursor:pointer; padding:6px; margin-left:8px; border-radius:6px; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
        `;
        
        this.shadow.appendChild(style);
        this.shadow.appendChild(this.wrapper);

        this.shadow.getElementById('os-min-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.shrink();
        });

        this.shadow.querySelector('.os-radar-box').addEventListener('click', () => {
            if (this.isMinimized) {
                this.expand();
            }
        });
    }

    shrink() { 
        if (this.wrapper) {
            this.wrapper.classList.add('shrunk'); 
            this.isMinimized = true;
            chrome.storage.local.set({ 'os_radar_minimized': true });
        }
    }

    expand() {
        if (this.wrapper) {
            this.wrapper.classList.remove('shrunk');
            this.isMinimized = false;
            chrome.storage.local.set({ 'os_radar_minimized': false });
        }
    }

    setCaptchaMode(active) {
        if (this.wrapper) {
            if (active) {
                this.wrapper.classList.add('captcha-mode');
                // Stanna animationen tillfälligt så den inte är distraherande
                this.stopAnimation(); 
            } else {
                this.wrapper.classList.remove('captcha-mode');
            }
        }
    }

    updateText(text) { 
        const textEl = this.shadow.getElementById('os-radar-text'); 
        if (textEl) textEl.innerText = text; 
    }
    
    stopAnimation() {
        const box = this.shadow.querySelector('.os-radar-box');
        if (box) box.style.animation = 'none';
        const spin1 = this.shadow.getElementById('os-spin-1');
        const spin2 = this.shadow.getElementById('os-spin-2');
        if (spin1) spin1.style.animation = 'none';
        if (spin2) spin2.style.display = 'none';
    }

    success(text) {
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
// 3. CAR.INFO SKANNERN (DIAGNOSTISK & FELSÄKER)
// ==========================================
if (window.location.hostname.includes('car.info') && window.location.hash.includes('bmg_export')) {
    const widget = new RadarWidget('Datalänk Aktiv', 'Laddar Car.info...', 'blue');
    let attempts = 0;
    
    const carInfoRadar = setInterval(() => {
        attempts++;
        try {
            // 1. Klicka bort eventuella Cookie-banners som blockerar sidladdningen
            const buttons = Array.from(document.querySelectorAll('button'));
            const consentBtn = buttons.find(b => b.innerText.match(/godkänn alla|acceptera|tillåt/i));
            if (consentBtn) {
                try { consentBtn.click(); } catch(e){}
            }

            if (attempts % 4 === 0) widget.updateText(`Söker i databasen...`);

            let regnr = "", model = "", motor = "", miltal = "", oljevolym = "", årsmodell = "", vin = "";
            const visibleText = document.body.innerText;
            const hiddenText = document.documentElement.textContent; 
            const compressedText = hiddenText.replace(/\s+/g, ' ');

            // Regnr från URL
            const urlParts = window.location.pathname.split('/');
            const potentialReg = urlParts[urlParts.length - 1];
            if (potentialReg && potentialReg.length <= 6) regnr = potentialReg.toUpperCase();

            // Huvudrubriken är ofta bilmodellen
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

            // Regex-sökning på sidans råtext
            const vinMatch = compressedText.match(/(?:Chassinummer|VIN)[\s\S]{0,30}?([A-HJ-NPR-Z0-9]{17})/i);
            if (vinMatch) vin = vinMatch[1].trim().toUpperCase();

            const motorMatch = compressedText.match(/(?:Motorkod|Motorfamilj)\s*([A-Z0-9\-]{3,10})/i);
            if (motorMatch) motor = motorMatch[1].trim();

            const milMatch = visibleText.match(/Mätarställning[\s\n]*([\d\s]+mil)/i) || visibleText.match(/Senaste mätarställning[\s\n]*([\d\s]+mil)/i);
            if (milMatch) miltal = milMatch[1].trim();

            const oljaMatch = compressedText.match(/Motorolja,\s*volym\s*([\d.,]+)\s*l/i) || compressedText.match(/Oljevolym\s*([\d.,]+)\s*l/i) || compressedText.match(/Motorolja\s*([\d.,]+)\s*l/i);
            if (oljaMatch) oljevolym = oljaMatch[1].trim();

            // TRIGG: Vi är nöjda om vi hittar bilmodellen OCH någon teknisk detalj, 
            // ELLER om sidan har fått ladda i 8 sekunder (16 försök) - då tar vi vad vi har!
            const hasGoodData = model && (motor || vin || oljevolym || miltal);
            
            if (hasGoodData || attempts > 16) {
                clearInterval(carInfoRadar);

                // Om tiden gick ut och sidan är helt tom på data (Car.info hittade inte bilen)
                if (!model && !motor && !vin) {
                    widget.error('Car.info saknar data för detta fordon.');
                    setTimeout(() => window.close(), 3000);
                    return;
                }

                const fordonData = {
                    regnr, 
                    bilmodell: model || "Okänd modell", 
                    motorkod: motor || "", 
                    miltal: miltal || "", 
                    oljevolym: oljevolym || "", 
                    årsmodell: årsmodell || "", 
                    vin: vin || "",
                    source: "Car.info_Extension"
                };

                widget.success('Data fångad från Car.info!');
                if (window.opener) window.opener.postMessage(fordonData, "*");
                setTimeout(() => window.close(), 1500);
            }
        } catch (e) { 
            console.error("Fel i Car.info skrapan:", e); 
        }
        
        // Hård säkerhets-timeout efter 20 sekunder (40 försök)
        if (attempts > 40) {
            clearInterval(carInfoRadar);
            widget.error('Sidan laddade inte. Avbryter.');
            setTimeout(() => window.close(), 3000);
        }
    }, 500); 
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
// 5. TRANSPORTSTYRELSEN SKRAPA (MASTER LOOP - THE ULTIMATE FIX)
// ==========================================
if (window.location.hostname.includes('transportstyrelsen.se')) {
    
    if (window._tsListener) window.removeEventListener('message', window._tsListener);
    
    window._tsListener = (event) => {
        if (event.data && event.data.action === 'START_TS_RADAR') {
            const activeReg = event.data.regnr;
            if (window.osRadarActive) return;
            window.osRadarActive = true;

            const widget = new RadarWidget('Myndighetslänk', `Laddar: ${activeReg}...`, 'blue');
            let attempts = 0;
            let captchaMode = false;

            // EN ENDA SMART LOOP SOM HANTERAR ALLA SCENARIER
            const masterLoop = setInterval(() => {
                attempts++;
                
                // Läs både rå HTML (för dold text) och synlig text
                const rawText = document.documentElement.textContent.toLowerCase();
                const visibleText = document.body.innerText.toLowerCase();

                // 1. IP-SPÄRR KONTROLL
                if (visibleText.includes('maximala antalet') || visibleText.includes('för många') || visibleText.includes('överskridit')) {
                    clearInterval(masterLoop);
                    widget.error('IP-SPÄRR: För många sökningar hos TS idag.');
                    setTimeout(() => window.close(), 5000);
                    return;
                }

                // 2. CAPTCHA KONTROLL
                if (visibleText.includes('robot') || visibleText.includes('säkerhetskontroll') || visibleText.includes('captcha')) {
                    if (!captchaMode) {
                        captchaMode = true;
                        widget.updateText('Kräver manuell Captcha. Lös i fönstret!');
                        
                        // Aktivera det nya Captcha-läget istället för shrink()
                        widget.setCaptchaMode(true);

                        const w = 500, h = 750; // Ökade höjden lite för att ge Captchan mer utrymme
                        const left = (window.screen.availWidth / 2) - (w / 2);
                        const top = (window.screen.availHeight / 2) - (h / 2);
                        window.moveTo(left, top);
                        window.resizeTo(w, h); // Tvinga rätt storlek om fönstret är för litet
                        window.focus();
                    }
                    return; // Pausar inmatningen tills användaren löst det
                }

                // 3. ÄR VI PÅ RESULTATSIDAN? (Sök i råtexten oavsett om menyerna är stängda)
                if (rawText.includes('fordonsstatus') && rawText.includes('färg')) {
                    clearInterval(masterLoop);
                    captchaMode = false;
                    
                    // Återställ UI:t till det normala stadiet för att indikera att det laddar
                    widget.wrapper.classList.remove('shrunk');
                    widget.setCaptchaMode(false); 
                    
                    widget.updateText('Träff! Fäller ut dolda menyer...');
                    
                    // Brute-force: Fäll ut alla dragspelsmenyer på sidan
                    const openAllPanels = () => {
                        document.querySelectorAll('button, a, summary').forEach(el => {
                            if (el.getAttribute('aria-expanded') === 'false' || el.classList.contains('collapsed')) {
                                try { el.click(); } catch(e){}
                            }
                        });
                    };
                    
                    openAllPanels();
                    setTimeout(openAllPanels, 1000); // Dubbelkoll så att inget missas

                    // Vänta 2 sekunder för animationerna att bli klara, sen extraherar vi!
                    setTimeout(() => {
                        widget.updateText('Extraherar fordonsdata...');
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
                    
                    return; // Vi är klara här
                }

                // 4. ÄR VI PÅ STARTSIDAN? (Letar inmatningsfält)
                const regInput = document.querySelector('input[type="text"], input[name*="regnr"], input[id*="reg"]');
                const searchBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(b => b.innerText?.toLowerCase().includes('sök') || b.value?.toLowerCase().includes('sök') || b.classList?.contains('btn-primary'));

                if (regInput && searchBtn && !captchaMode) {
                    if (!regInput.value || regInput.value.toUpperCase() !== activeReg.toUpperCase()) {
                        widget.updateText('Matar in registreringsnummer...');
                        ScraperUtils.setNativeValue(regInput, activeReg);
                        
                        setTimeout(() => {
                            widget.updateText('Klickar Sök...');
                            searchBtn.click();
                            
                            setTimeout(() => {
                                const form = regInput.closest('form');
                                if (form) form.submit();
                            }, 1000);
                        }, 500);
                    } else {
                        widget.updateText('Väntar på omdirigering...');
                    }
                } else if (!captchaMode) {
                    widget.updateText(`Laddar sida (${attempts})...`);
                }

                // 5. TIMEOUT (Avbryt om inget hänt på 60 sekunder)
                if (attempts > 120 && !captchaMode) { 
                    clearInterval(masterLoop);
                    widget.error('Timeout. Sidan laddade aldrig resultatet.');
                    setTimeout(() => window.close(), 4000);
                }

            }, 2000);
        }
    };
    window.addEventListener('message', window._tsListener);
}

// ==========================================
// SYSTEM BRIDGE - LÄNKAR IHOP PLANERARE OS MED TILLÄGGET
// ==========================================

// A. Lyssnar på klick INUTI din React-app och sparar ordern i Chromes kassaskåp
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'SET_TRODO_MISSION') {
        chrome.storage.local.set({
            'os_trodo_task': {
                regnr: event.data.regnr,
                partsToFetch: event.data.parts,
                preferredBrands: ['BOSCH', 'MANN-FILTER', 'MAHLE', 'BREMBO', 'NGK'],
                results: {}
            }
        });
    }
});

// B. Lyssnar på när Trodo har sparat resultatet i kassaskåpet, och skickar in det i din React-app
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.os_trodo_result && changes.os_trodo_result.newValue) {
        window.postMessage({ source: 'Trodo_Extension', data: changes.os_trodo_result.newValue }, '*');
        chrome.storage.local.remove('os_trodo_result'); 
    }
});

// ==========================================
// 6. TRODO.SE RESERVDELSSKRAPA (VISUAL TEXT ENGINE - REFINED)
// ==========================================
if (window.location.hostname.includes('trodo.se')) {
    
    chrome.storage.local.get(['os_trodo_task'], (result) => {
        let task = result.os_trodo_task;
        
        if (!task || !task.partsToFetch || task.partsToFetch.length === 0) return; 

        // 1. ÖPPNA NERE I HÖGRA HÖRNET
        const w = 450, h = 550;
        const left = window.screen.availWidth - w - 20; // 20px marginal från höger
        const top = window.screen.availHeight - h - 20; // 20px marginal från botten
        window.moveTo(left, top);

        let widget = window.trodoWidget;
        if (!widget) {
            widget = new RadarWidget('Grossistlänk', 'Initierar...', 'orange');
            window.trodoWidget = widget;
        }

        const getCategorySlug = (part) => {
            const p = part.toLowerCase();
            if (p.includes('oljefilter')) return 'oljefilter';
            if (p.includes('luftfilter')) return 'luftfilter';
            if (p.includes('kupé') || p.includes('kupe')) return 'kupefilter';
            if (p.includes('bränsle')) return 'branslefilter';
            if (p.includes('tändstift')) return 'tandstift';
            if (p.includes('belägg') || p.includes('bromsklossar')) return 'bromsbelagg';
            if (p.includes('skivor') || p.includes('bromsskivor')) return 'bromsskivor';
            return 'bildelar'; 
        };

        let phaseState = ''; 
        let attemptsInPhase = 0;

        const masterLoop = setInterval(() => {
            const url = window.location.href.toLowerCase();
            const currentPart = task.partsToFetch[0]; 
            
            if (!currentPart) {
                clearInterval(masterLoop);
                return;
            }

            const catSlug = getCategorySlug(currentPart);
            // 2. LÄGG TILL MÄRKES-FILTRET
            const brandsSlug = 'bosch--mann_filter'; 

            if (url.includes('/bildelar/') && !task.vehicleSlug) {
                const rawSlug = url.split('/bildelar/')[1].split('?')[0].split('#')[0].replace(/\/$/, "");
                task.vehicleSlug = rawSlug;
                chrome.storage.local.set({ 'os_trodo_task': task });
                phaseState = ''; 
            }

            const vehicleSlug = task.vehicleSlug;
            const isResultPage = vehicleSlug && url.includes(`/${catSlug}/`);
            const isCarSelected = vehicleSlug && url.includes('/bildelar/');

            // --- FAS 3: RESULTATSIDAN ---
            if (isResultPage) {
                if (phaseState !== 'FAS3') {
                    phaseState = 'FAS3';
                    attemptsInPhase = 0;
                }
                attemptsInPhase++;
                widget.updateText(`Söker i sidans text (${attemptsInPhase})...`);
                
                const pageText = document.body.innerText.toUpperCase();
                const noProducts = pageText.includes('HITTADE INGA') || pageText.includes('INGA PRODUKTER') || pageText.includes('SAKNAS');

                let priceNodes = [];
                document.querySelectorAll('*').forEach(el => {
                    // Förbättring: Skippa element som uppenbart är överstrukna gamla priser
                    if (el.children.length <= 2 && !el.closest('.old-price, s, del')) {
                        let txt = el.textContent.toLowerCase().trim();
                        if (txt.includes('kr') && /\d/.test(txt) && txt.length < 40) {
                            priceNodes.push(el);
                        }
                    }
                });

                if (priceNodes.length > 4 || attemptsInPhase > 10 || noProducts) {
                    clearInterval(masterLoop); 
                    
                    let foundPrice = null;
                    let foundBrand = null;

                    if (!noProducts && priceNodes.length > 0) {
                        // 1. Leta efter föredragna märken
                        for (let node of priceNodes) {
                            let parent = node;
                            let containerText = "";
                            
                            for (let i = 0; i < 7; i++) { 
                                if (!parent) break;
                                containerText = parent.innerText.toUpperCase();
                                
                                let matchedBrand = task.preferredBrands.find(b => containerText.includes(b));
                                if (matchedBrand && containerText.length < 2000) {
                                    let priceMatch = node.textContent.match(/(\d+[\s.,]*\d*)\s*kr/i);
                                    if (priceMatch) {
                                        foundPrice = priceMatch[1].replace(/[^0-9,]/g, '').trim();
                                        foundBrand = matchedBrand;
                                        break;
                                    }
                                }
                                parent = parent.parentElement;
                            }
                            if (foundPrice) break;
                        }

                        // 2. FALLBACK
                        if (!foundPrice) {
                            for (let node of priceNodes) {
                                let parent = node.parentElement?.parentElement?.parentElement; 
                                if (parent && parent.innerText && parent.innerText.length < 2000) {
                                    let priceMatch = node.textContent.match(/(\d+[\s.,]*\d*)\s*kr/i);
                                    if (priceMatch) {
                                        foundPrice = priceMatch[1].replace(/[^0-9,]/g, '').trim();
                                        let lines = parent.innerText.split('\n').filter(l => l.trim() && !l.toLowerCase().includes('kr') && l.length > 3);
                                        foundBrand = lines.length > 0 ? lines[0].substring(0, 15).trim() : 'Alternativ';
                                        break;
                                    }
                                }
                            }
                        }
                    }

                    // Spara resultatet OCH den aktuella URL:en så den blir klickbar i din app
                    task.results[currentPart] = { price: foundPrice || '0', brand: foundBrand || 'Hittades ej', url: window.location.href };
                    task.partsToFetch.shift();
                    
                    chrome.storage.local.set({ 'os_trodo_task': task }, () => {
                        if (task.partsToFetch.length === 0) {
                            widget.success('Alla priser hämtade!');
                            chrome.storage.local.set({ 'os_trodo_result': task.results });
                            chrome.storage.local.remove('os_trodo_task'); 
                            setTimeout(() => window.close(), 2000);
                        } else {
                            const nextCatSlug = getCategorySlug(task.partsToFetch[0]);
                            // Navigera till NÄSTA del med Bosch/Mann-filtret aktivt
                            window.location.href = `https://www.trodo.se/${nextCatSlug}/${brandsSlug}/${vehicleSlug}`;
                        }
                    });
                }
            }
            // --- FAS 2: FORDON VALT ---
            else if (isCarSelected) {
                if (phaseState !== 'FAS2') {
                    phaseState = 'FAS2';
                    widget.updateText(`Fordon redo! Laddar ${catSlug}...`);
                    setTimeout(() => {
                        // Navigera till FÖRSTA delen med Bosch/Mann-filtret aktivt
                        window.location.href = `https://www.trodo.se/${catSlug}/${brandsSlug}/${vehicleSlug}`;
                    }, 500);
                }
            }
            // --- FAS 1: STARTSIDA ---
            else if (!vehicleSlug) {
                if (phaseState !== 'FAS1_WAITING') {
                    widget.updateText(`Letar upp ${task.regnr}...`);
                    
                    const allInputs = Array.from(document.querySelectorAll('input'));
                    const regInput = allInputs.find(i => {
                        const p = (i.placeholder || '').toLowerCase();
                        const n = (i.name || '').toLowerCase();
                        return p.includes('reg') || p.includes('abc') || n.includes('reg') || n.includes('plate') || n.includes('vrn');
                    });

                    if (regInput) {
                        phaseState = 'FAS1_WAITING'; 
                        ScraperUtils.setNativeValue(regInput, task.regnr);
                        
                        setTimeout(() => {
                            const form = regInput.closest('form');
                            if (form) {
                                const submitBtn = form.querySelector('button[type="submit"], button[name="submit"]');
                                if (submitBtn) submitBtn.click();
                                else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                            }
                        }, 1500);
                    }
                }
            }
        }, 3500); 
    });
}
