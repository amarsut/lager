// --- GEMENSAM PREMIUM-STIL FÖR WIDGET ---
const premiumWidgetStyles = `
    <style>
        @keyframes pulseGlow { 
            0%, 100% { box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(249,115,22,0.1); border-color: rgba(249,115,22,0.3); } 
            50% { box-shadow: 0 25px 60px rgba(0,0,0,0.6), 0 0 40px rgba(249,115,22,0.4); border-color: rgba(249,115,22,0.7); } 
        }
        @keyframes spinOuter { to { transform: rotate(360deg); } }
        @keyframes spinInner { to { transform: rotate(-360deg); } }
        @keyframes dataBlink { 
            0%, 100% { opacity: 0.3; transform: scaleY(0.4); } 
            50% { opacity: 1; transform: scaleY(1); } 
        }
        
        /* HELSKÄRMS-ÖVERLÄGG */
        .os-radar-wrapper {
            position: fixed;
            inset: 0;
            z-index: 2147483647;
            pointer-events: all;
            transition: background-color 0.8s ease, backdrop-filter 0.8s ease;
            background-color: rgba(15, 21, 34, 0.95);
            backdrop-filter: blur(10px);
            font-family: system-ui, sans-serif;
        }
        
        /* NÄR ÅTGÄRD KRÄVS: TONAR BORT BAKGRUNDEN */
        .os-radar-wrapper.shrunk {
            background-color: transparent;
            backdrop-filter: blur(0px);
            pointer-events: none;
        }
        
        /* SJÄLVA RADAR-RUTAN */
        .os-radar-box {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(1.2);
            background: linear-gradient(135deg, rgba(15,21,34,0.95), rgba(20,28,45,0.95));
            border: 1px solid rgba(249,115,22,0.5);
            border-radius: 16px;
            padding: 16px 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
            animation: pulseGlow 2s ease-in-out infinite alternate;
            pointer-events: all;
            width: max-content;
        }
        
        /* NÄR ÅTGÄRD KRÄVS: RUTAN FLYGER NER TILL HÖRNET */
        .os-radar-wrapper.shrunk .os-radar-box {
            top: calc(100% - 24px);
            left: calc(100% - 24px);
            transform: translate(-100%, -100%) scale(1);
        }
    </style>
`;

function getPremiumWidgetHTML(title, subtitle) {
    return premiumWidgetStyles + `
        <div class="os-radar-box">
            <div style="width:36px; height:36px; position:relative; flex-shrink:0;" id="os-spinner-container">
                <div style="position:absolute; inset:0; border:3px solid rgba(249,115,22,0.2); border-top-color:#f97316; border-radius:50%; animation: spinOuter 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;" id="os-spin-1"></div>
                <div style="position:absolute; inset:6px; border:2px solid rgba(255,255,255,0.1); border-bottom-color:#ffffff; border-radius:50%; animation: spinInner 1.2s linear infinite;" id="os-spin-2"></div>
            </div>
            <div style="flex-grow:1; min-width:140px;">
                <h1 style="color:#f97316; font-size:11px; font-weight:900; letter-spacing:1.5px; margin:0; text-transform:uppercase; text-shadow: 0 0 10px rgba(249,115,22,0.3);">${title}</h1>
                <p style="color:#e4e4e7; font-size:10px; font-weight:500; letter-spacing:0.5px; margin:4px 0 0 0; opacity: 0.9;" id="os-radar-text">${subtitle}</p>
            </div>
            <div style="display:flex; gap:3px; height:14px; align-items:flex-end; padding-bottom:2px;" id="os-equalizer">
                <div style="width:3px; height:100%; background:#f97316; border-radius:2px; animation: dataBlink 0.8s infinite 0.1s;"></div>
                <div style="width:3px; height:100%; background:#f97316; border-radius:2px; animation: dataBlink 0.8s infinite 0.3s;"></div>
                <div style="width:3px; height:100%; background:#f97316; border-radius:2px; animation: dataBlink 0.8s infinite 0.2s;"></div>
            </div>
        </div>
    `;
}

function successWidget(loader, text) {
    loader.classList.remove('shrunk');
    
    const box = loader.querySelector('.os-radar-box');
    box.style.animation = 'none'; 
    box.style.borderColor = '#10b981';
    box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(16,185,129,0.4)';
    
    loader.querySelector('#os-equalizer').style.display = 'none';
    loader.querySelector('#os-spin-1').style.borderColor = '#10b981';
    loader.querySelector('#os-spin-1').style.borderTopColor = 'transparent';
    loader.querySelector('#os-spin-1').style.animation = 'spinOuter 3s linear infinite';
    loader.querySelector('#os-spin-2').style.display = 'none';
    
    const textEl = loader.querySelector('#os-radar-text');
    textEl.innerHTML = `<span style="color:#10b981; font-weight:900;">✓ ${text}</span>`;
}


// --- 1. CAR.INFO SKANNERN ---
if (window.location.hostname.includes('car.info') && window.location.hash.includes('bmg_export')) {
    
    const loader = document.createElement('div');
    loader.className = 'os-radar-wrapper';
    loader.innerHTML = getPremiumWidgetHTML('Datalänk Aktiv', 'Laddar uppgifter...');
    document.documentElement.appendChild(loader);

    let attempts = 0;
    const carInfoRadar = setInterval(() => {
        attempts++;
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

            if (oljaMatch || motorMatch || attempts > 10) {
                clearInterval(carInfoRadar);

                const fordonData = {
                    regnr, bilmodell: model || "Okänd modell", motorkod: motor || "", miltal: miltal || "", oljevolym: oljevolym || "", årsmodell: årsmodell || "", vin: vin || "",
                    source: "Car.info_Extension"
                };

                successWidget(loader, 'Fordon data fångad!');
                if (window.opener) window.opener.postMessage(fordonData, "*");
                
                setTimeout(() => window.close(), 1200);
            }

        } catch (e) { console.error("Fel:", e); }
    }, 500); 
}


// --- 2. OLJEMAGASINET SPÖK-SKANNERN ---
if (window.location.hostname.includes('oljemagasinet.se')) {
    
    window.addEventListener('message', (event) => {
        if (event.data && event.data.action === 'START_OS_RADAR') {
            
            const activeReg = event.data.regnr;
            if (window.osRadarActive) return;
            window.osRadarActive = true;

            const loader = document.createElement('div');
            loader.className = 'os-radar-wrapper';
            loader.innerHTML = getPremiumWidgetHTML('Systemradar', `Söker: ${activeReg}...`);
            document.documentElement.appendChild(loader);

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
                    regInput.value = activeReg;
                    regInput.dispatchEvent(new Event('input', { bubbles: true }));
                    regInput.dispatchEvent(new Event('change', { bubbles: true }));
                    
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

            let attempts = 0;
            const radar = setInterval(() => {
                attempts++;
                const text = document.body.innerText.replace(/\s+/g, ' '); 
                
                if (attempts === 8) {
                    loader.classList.add('shrunk');
                    const textEl = loader.querySelector('#os-radar-text');
                    if (textEl) textEl.innerHTML = "Väntar på val...";
                }

                const volymMatch = text.match(/(?:Kapacitet|Volym|Motorolja|Påfyllningsmängd|Servicevolym|Rymmer|Åtgång|Oljesump|filter)[\s\S]{0,120}?(\d+[.,]\d+)\s*(?:l|liter)/i) || 
                                   text.match(/(\d+[.,]\d+)\s*(?:l|liter)[\s\S]{0,80}?(?:Kapacitet|Volym|Motorolja|Åtgång|Oljesump|filter)/i);

                if (volymMatch) {
                    clearInterval(radar);
                    const volym = volymMatch[1].replace(',', '.').trim();
                    
                    let motorkod = "";
                    let arsmodell = "";
                    let bilmodell = "";
                    
                    try {
                        // --- NYTT: Fysisk DOM-tolk anpassad exakt för Oljemagasinets nya layout ---
                        const carBox = document.querySelector('.plate-car-selection-box');
                        if (carBox) {
                            
                            // 1. Bilmodell & Årsmodell (Ligger i <p><strong>)
                            const titleEl = carBox.querySelector('p strong');
                            if (titleEl) {
                                // Delar upp texten vid <br> (t.ex. "VOLKSWAGEN TIGUAN" och "SUV 2024")
                                const titleParts = titleEl.innerHTML.split(/<br\s*\/?>/i);
                                
                                // Rensa bort ev. inre HTML från bilnamnet
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = titleParts[0];
                                bilmodell = tempDiv.textContent.trim();
                                
                                // Årsmodell från andra halvan av texten
                                if (titleParts.length > 1) {
                                    const yearMatch = titleParts[1].match(/\b(19\d{2}|20\d{2})\b/);
                                    if (yearMatch) arsmodell = yearMatch[1];
                                } else {
                                    // Reserv om <br> saknas
                                    const yearMatch = bilmodell.match(/\b(19\d{2}|20\d{2})\b/);
                                    if (yearMatch) arsmodell = yearMatch[1];
                                }
                            }
                            
                            // 2. Motorkod (Ligger i <th>Motorkod</th> och sedan i intilliggande <td>)
                            const ths = carBox.querySelectorAll('th');
                            for (let th of ths) {
                                if (th.textContent.trim().toLowerCase().includes('motorkod')) {
                                    const nextTd = th.nextElementSibling;
                                    if (nextTd && nextTd.tagName.toLowerCase() === 'td') {
                                        motorkod = nextTd.textContent.trim();
                                    }
                                }
                            }
                        }
                        
                        // --- FALLBACK (Om HTML-klassen skulle saknas helt) ---
                        if (!motorkod || !arsmodell || !bilmodell) {
                            const flatText = document.body.innerText.replace(/\s+/g, ' ');
                            if (!motorkod) {
                                let mMatch = flatText.match(/Motorkod\s*([A-Z0-9\-]{3,12})/i);
                                if (mMatch) motorkod = mMatch[1].trim();
                            }
                            if (!arsmodell) {
                                let yMatch = flatText.match(/Årsmodell\s*(\d{4})/i);
                                if (yMatch) arsmodell = yMatch[1].trim();
                            }
                            if (!bilmodell) {
                                const safeReg = activeReg.replace(/[^A-Z0-9]/gi, '');
                                const modelRegex = new RegExp(`([A-Z0-9\\s\\-\\(\\)\\.,]+?)\\s*(?:Bensin|Diesel|El|Laddhybrid|Etano|Hybrid)?.*?\\(${safeReg}\\)`, 'i');
                                let modelMatch = flatText.match(modelRegex);
                                if (modelMatch) bilmodell = modelMatch[1].trim();
                            }
                        }
                    } catch (e) { console.error("Kunde inte läsa extra data:", e); }

                    const payload = { 
                        source: 'Oljemagasinet_Extension', 
                        regnr: activeReg, 
                        oljevolym: volym,
                        motorkod: motorkod,
                        årsmodell: arsmodell,
                        bilmodell: bilmodell
                    };

                    if (!event.data.readOnly) {
                        if (event.source) {
                            event.source.postMessage(payload, "*");
                        } else if (window.opener) {
                            window.opener.postMessage(payload, "*");
                        }
                        
                        successWidget(loader, `${volym} Liter Fångad!`);
                        setTimeout(() => window.close(), 1500);
                    } else {
                        const extraInfo = motorkod ? ` | Motor: ${motorkod}` : '';
                        successWidget(loader, `Volym: ${volym} L${extraInfo}`);
                        loader.querySelector('.os-radar-box').style.animation = 'none'; 
                    }
                }

                if (attempts > 120) { 
                    clearInterval(radar);
                    clearInterval(tryToInput);
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 500);
                }
            }, 500);
        }
    });
}

// --- 3. TRODO ASSISTENTEN (AJAX-Säker) ---
if (window.location.hostname.includes('trodo.se')) {
    
    const checkStorage = setInterval(() => {
        try {
            if (!chrome || !chrome.storage || !chrome.storage.local) return;
            chrome.storage.local.get(['TRODO_MISSION'], (result) => {
                if (chrome.runtime.lastError) return;
                if (result && result.TRODO_MISSION && !window.osRadarActive) {
                    clearInterval(checkStorage);
                    startTrodoAssistant(result.TRODO_MISSION);
                }
            });
        } catch (e) { clearInterval(checkStorage); }
    }, 500);

    function startTrodoAssistant(mission) {
        window.osRadarActive = true;
        const loader = document.createElement('div');
        loader.className = 'os-radar-wrapper';
        loader.innerHTML = getPremiumWidgetHTML('Trodo Assistent', `Initierar...`);
        document.documentElement.appendChild(loader);

        let attempts = 0;
        const radar = setInterval(() => {
            attempts++;
            
            document.querySelectorAll('button').forEach(btn => {
                const t = btn.innerText.toLowerCase();
                if(t.includes('godkänn') || t.includes('tillåt') || t.includes('accept') || t.includes('förstår')) btn.click();
            });

            if (mission.phase === 'ENTER_REG') {
                loader.querySelector('#os-radar-text').innerText = `Låser fordon: ${mission.regnr}...`;
                
                const allRegInputs = document.querySelectorAll('input[name*="reg"], input[id*="reg"], input[placeholder*="ABC"], input[placeholder*="Reg"], .registration-input input');
                let regInput = Array.from(allRegInputs).find(el => el.offsetWidth > 0 && el.offsetHeight > 0);
                
                if (regInput) { 
                    regInput.focus();
                    
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
                    if (nativeInputValueSetter) {
                        nativeInputValueSetter.call(regInput, mission.regnr);
                    } else {
                        regInput.value = mission.regnr;
                    }
                    
                    ['input', 'change', 'keydown', 'keyup'].forEach(eType => {
                        regInput.dispatchEvent(new Event(eType, { bubbles: true }));
                    });
                    
                    mission.phase = 'WAIT_FOR_AJAX';
                    
                    try {
                        chrome.storage.local.set({ TRODO_MISSION: mission }, () => {
                            setTimeout(() => {
                                let btn = null;
                                let parent = regInput.parentElement;
                                for(let i=0; i<3; i++) {
                                    if(parent) {
                                        btn = Array.from(parent.querySelectorAll('button')).find(b => b.offsetWidth > 0);
                                        if(btn) break;
                                        parent = parent.parentElement;
                                    }
                                }

                                if (btn) {
                                    btn.click();
                                } else {
                                    regInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                                    if (regInput.form) regInput.form.submit();
                                }
                            }, 800);
                        });
                    } catch(e) {}
                }
            }
            
            else if (mission.phase === 'WAIT_FOR_AJAX') {
                loader.querySelector('#os-radar-text').innerText = `Synkar databas för ${mission.regnr}...`;
                
                mission.phase = 'DONE';
                try {
                    chrome.storage.local.set({ TRODO_MISSION: mission }, () => {
                        clearInterval(radar); 
                        
                        setTimeout(() => {
                            loader.querySelector('#os-radar-text').innerText = `Öppnar ${mission.part}...`;
                            
                            chrome.storage.local.remove('TRODO_MISSION', () => {
                                window.location.href = `https://www.trodo.se/${mission.slug}`; 
                            });
                        }, 2500); 
                    });
                } catch(e) { clearInterval(radar); }
            }

            if (attempts > 40) { 
                clearInterval(radar);
                chrome.storage.local.remove('TRODO_MISSION');
            }
        }, 500);
    }
}
