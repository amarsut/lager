import { collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, addDoc, serverTimestamp, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, AppState, showToast } from "./core.js";

let canvas, ctx, isDrawing = false;
let activeDrivesData = [];
let historyDrivesData = [];
let historyLimit = 10;
let searchTerm = "";
let lastCanvasWidth = 0;

export function initTestDrives() {
    setupUI();
    setupSignature();
    setupLicenseUpload();
    listenToActiveDrives();
    listenToHistoryDrives();
    populateCarSelect();

    if (window.lucide) window.lucide.createIcons();
}

// DIN ALGORITM (Orörd och skottsäker)
function isValidSwedishPnr(pnr) {
    let cleanNumber = pnr.replace(/\D/g, '');
    if (cleanNumber.length === 12) cleanNumber = cleanNumber.substring(2);
    if (cleanNumber.length !== 10) return false;

    let sum = 0;
    for (let i = 0; i < 10; i++) {
        let digit = parseInt(cleanNumber.charAt(i));
        if (i % 2 === 0) digit *= 2;
        if (digit > 9) digit -= 9;
        sum += digit;
    }
    return sum % 10 === 0;
}

function setupUI() {
    // Formaterar personnumret snyggt när man skriver
    document.getElementById('td_pnr')?.addEventListener('input', function (e) {
        let v = this.value.replace(/\D/g, '');
        if (v.length > 12) v = v.substring(0, 12);

        if (v.length > 8 && (v.startsWith('19') || v.startsWith('20'))) {
            this.value = v.substring(0, 8) + '-' + v.substring(8);
        } else if (v.length > 6 && !v.startsWith('19') && !v.startsWith('20')) {
            this.value = v.substring(0, 6) + '-' + v.substring(6);
        } else {
            this.value = v;
        }

        // Live validering med ikon istället för att spärra
        const iconSpan = document.getElementById('pnrIcon');
        if (iconSpan) {
            if (this.value.replace(/\D/g, '').length < 10) {
                // Inte tillräckligt många siffror än, visa ingen ikon
                iconSpan.innerHTML = '';
            } else if (isValidSwedishPnr(this.value)) {
                // Giltigt enligt algoritmen! (Grön bock)
                iconSpan.innerHTML = '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-500"></i>';
                if (window.lucide) window.lucide.createIcons({ root: iconSpan });
            } else {
                // Ogiltigt enligt algoritmen! (Orange varning)
                iconSpan.innerHTML = '<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-500"></i>';
                if (window.lucide) window.lucide.createIcons({ root: iconSpan });
            }
        }
    });

    document.getElementById('btnKioskMode')?.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => showToast("Kunde inte starta helskärm", "error"));
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
        }
    });

    document.getElementById('searchTestDrives')?.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderActive();
        renderHistory();
    });

    document.getElementById('btnLoadMoreHistory')?.addEventListener('click', () => {
        historyLimit += 10;
        listenToHistoryDrives();
    });

    setupForm();
}

function setupSignature() {
    canvas = document.getElementById('signatureCanvas');
    const wrapper = document.getElementById('canvasWrapper');
    if (!canvas || !wrapper) return;

    ctx = canvas.getContext('2d');

    const resize = () => {
        const rect = wrapper.getBoundingClientRect();
        if (rect.width > 0 && rect.width !== lastCanvasWidth) {
            const temp = ctx.getImageData(0, 0, canvas.width, canvas.height);
            canvas.width = rect.width;
            canvas.height = rect.height;
            lastCanvasWidth = rect.width;

            ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#cbd5e1' : '#1e293b';
            ctx.lineWidth = 3;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            if (temp && canvas.width > 0) ctx.putImageData(temp, 0, 0);
        }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrapper);
    setTimeout(resize, 100);

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const start = (e) => { isDrawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); e.preventDefault(); };
    const draw = (e) => { if (!isDrawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    const stop = () => { isDrawing = false; };

    canvas.onmousedown = start; canvas.onmousemove = draw; window.addEventListener('mouseup', stop);
    canvas.ontouchstart = start; canvas.ontouchmove = draw; window.addEventListener('touchend', stop);

    document.getElementById('clearSignature')?.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
}

function populateCarSelect() {
    const select = document.getElementById('td_car');
    if (!select) return;

    if (!AppState.inventory || AppState.inventory.length === 0) {
        select.innerHTML = '<option value="">Väntar på lager...</option>';
        setTimeout(populateCarSelect, 1000);
        return;
    }

    select.innerHTML = '<option value="">Välj fordon...</option>' +
        AppState.inventory.map(c => `<option value="${c.id}" data-reg="${c.regNo}" data-model="${c.make} ${c.model}" class="dark:bg-[#1e293b]">${c.regNo} - ${c.make} ${c.model}</option>`).join('');
}

function listenToActiveDrives() {
    onSnapshot(collection(db, "active_testdrives"), (snap) => {
        activeDrivesData = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.startTime - a.startTime);
        
        // HÄR ÄR DEN MAGISKA LÄNKEN TILL SÖKMOTORN!
        if (!window.AppState) window.AppState = {};
        window.AppState.activeDrives = activeDrivesData;
        
        renderActive();
    });
}

function renderActive() {
    const list = document.getElementById('activeDrivesList');
    if (!list) return;

    const filtered = activeDrivesData.filter(d => `${d.customerName} ${d.carReg} ${d.customerPnr}`.toLowerCase().includes(searchTerm));

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-8 text-center bg-slate-50 dark:bg-[#1e293b]/50 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded text-slate-400 text-[10px] font-bold uppercase tracking-widest">Inga pågående provkörningar</div>`;
        return;
    }

    list.innerHTML = filtered.map(d => {
        const diffMins = Math.floor((Date.now() - d.startTime) / 60000);
        return `
        <div class="bg-[#FAFAFA] dark:bg-[#1e293b] border border-brand-500/30 dark:border-brand-500/50 p-4 rounded shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden group">
            <div class="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-500/5 to-transparent pointer-events-none"></div>
            
            <div class="flex items-center gap-4 z-10">
                <div class="w-10 h-10 rounded bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 flex items-center justify-center shrink-0">
                    <i data-lucide="gauge" class="w-5 h-5 text-brand-500"></i>
                </div>
                <div class="min-w-0">
                    <div class="text-base font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">${d.customerName}</div>
                    <div class="text-xs font-bold text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span class="bg-slate-100 dark:bg-[#0f172a] text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono tracking-wider">${d.carReg}</span> 
                        <span class="text-brand-500 flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> Ute i ${diffMins} min</span>
                    </div>
                </div>
            </div>
            <button onclick="window.endTestDrive('${d.id}')" class="w-full sm:w-auto bg-slate-900 hover:bg-emerald-500 text-white text-xs font-black px-5 py-3 rounded uppercase tracking-widest transition-all outline-none shrink-0 shadow-lg flex items-center justify-center gap-2 z-10">
                <i data-lucide="check-circle" class="w-4 h-4"></i> Avsluta Körning
            </button>
        </div>`;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
}

function listenToHistoryDrives() {
    const q = query(collection(db, "history_testdrives"), orderBy("endTime", "desc"), limit(historyLimit));
    onSnapshot(q, (snap) => {
        historyDrivesData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // HÄR LÄGGER VI TILL KOPPLINGEN TILL SÖKMOTORN:
        if (!window.AppState) window.AppState = {};
        window.AppState.historyDrives = historyDrivesData;
        
        const btnMore = document.getElementById('btnLoadMoreHistory');
        if (btnMore) btnMore.classList.toggle('hidden', historyDrivesData.length < historyLimit);
        renderHistory();
    });
}

function renderHistory() {
    const list = document.getElementById('historyDrivesList');
    if (!list) return;

    const filtered = historyDrivesData.filter(d => `${d.customerName} ${d.carReg} ${d.customerPnr}`.toLowerCase().includes(searchTerm));

    if (filtered.length === 0) {
        list.innerHTML = `<div class="p-8 text-center bg-slate-50 dark:bg-[#1e293b]/50 border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded text-slate-400 text-[10px] font-bold uppercase tracking-widest md:col-span-2">Arkivet är tomt</div>`;
        return;
    }

    list.innerHTML = filtered.map(d => {
        const dateStr = d.endTime ? new Date(d.endTime).toLocaleDateString('sv-SE') : '';
        return `
        <div class="bg-[#FAFAFA] dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 p-4 rounded shadow-lg flex items-center justify-between group hover:border-brand-500/50 dark:hover:border-brand-500/50 transition-all">
            <div class="min-w-0 pr-4">
                <div class="text-sm font-black text-slate-800 dark:text-slate-200 uppercase truncate">${d.customerName}</div>
                <div class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-1.5">
                    <span class="bg-slate-100 dark:bg-[#0f172a] px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 font-mono">${d.carReg}</span> 
                    <span>• ${dateStr}</span>
                </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.printTestDriveAgreement('${d.id}')" class="p-2.5 text-slate-400 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 bg-slate-50 dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-700 outline-none transition-colors" title="Skriv ut avtal">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                </button>
                <button onclick="window.deleteHistoryDrive('${d.id}')" class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 bg-slate-50 dark:bg-[#0f172a] rounded border border-slate-200 dark:border-slate-700 outline-none transition-colors" title="Radera permanent">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
    }).join('');
    if (window.lucide) window.lucide.createIcons();
}

window.printTestDriveAgreement = async (id) => {
    try {
        const d = await getDoc(doc(db, "history_testdrives", id));
        if (!d.exists()) { showToast("Kunde inte hitta avtalet", "error"); return; }
        const data = d.data();
        const dateStr = data.startTime ? new Date(data.startTime).toLocaleString('sv-SE') : 'Okänt datum';

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
            <head>
                <title>Provkörningsavtal - ${data.carReg}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
                    .header { border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                    h1 { margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 1px;}
                    .box { border: 1px solid #cbd5e1; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
                    .row { display: flex; margin-bottom: 10px; }
                    .col { flex: 1; }
                    .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px; margin-bottom: 4px;}
                    .val { font-size: 16px; font-weight: bold; }
                    .legal { background: #f8fafc; padding: 15px; font-size: 12px; border-radius: 6px; margin-bottom: 40px; color: #334155; border: 1px solid #e2e8f0; }
                    .signature-box { width: 300px; }
                    .sig-img { max-width: 100%; height: auto; border-bottom: 1px solid #1e293b; margin-bottom: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Provkörningsavtal</h1>
                    <div style="text-align: right; color: #64748b; font-size: 12px; font-weight:bold;">DATUM: ${dateStr}</div>
                </div>
                
                <div class="box">
                    <div class="row">
                        <div class="col"><div class="label">Kundens Namn</div><div class="val">${data.customerName}</div></div>
                        <div class="col"><div class="label">Personnummer</div><div class="val">${data.customerPnr}</div></div>
                    </div>
                </div>

                <div class="box">
                    <div class="row">
                        <div class="col"><div class="label">Fordon (Regnr)</div><div class="val">${data.carReg}</div></div>
                        <div class="col"><div class="label">Fordon (Modell)</div><div class="val">${data.carModel}</div></div>
                    </div>
                </div>

                <div class="legal">
                    <strong>VILLKOR FÖR PROVKÖRNING:</strong><br><br>
                    Genom min signatur nedan intygar jag härmed att jag innehar ett giltigt körkort för fordonstypen.<br><br> 
                    Jag påtar mig fullt ansvar för fordonet under provkörningen och förbinder mig att betala en självrisk på upp till <strong>15 000 kr</strong> vid uppkommen skada, vagnskada eller stöld. Jag ansvarar även personligen fullt ut för eventuella parkeringsböter, fartkameraböter, trängselskatter och andra avgifter som kan uppkomma under provkörningen.
                    <br><br>
                    <span style="color: #64748b; font-size: 10px;">Dina personuppgifter behandlas för att administrera provkörningen i enlighet med dataskyddsförordningen (GDPR). Ev. insamlad id-handling har nu raderats automatiskt. Detta avtal sparas maximalt i 60 dagar.</span>
                </div>

                <div class="signature-box">
                    <div class="label">Kundens Signatur</div>
                    ${data.signature ? `<img src="${data.signature}" class="sig-img">` : `<div style="height: 60px; border-bottom: 1px solid #1e293b; margin-bottom: 5px;"></div>`}
                    <div style="font-size: 12px; color: #64748b;">${data.customerName}</div>
                </div>

                <script>
                    setTimeout(() => { window.print(); }, 500);
                </script>
            </body>
            </html>
        `);
        printWin.document.close();
    } catch (e) {
        showToast("Kunde inte skapa avtal", "error");
    }
};

// ==========================================
// AVSLUTA (HÄR LIGGER AUTO-RADERING AV KÖRKORTSBILDEN)
// ==========================================
window.endTestDrive = async (id) => {
    if (!confirm("Avsluta provkörningen?\nEv. bild på id-handling raderas permanent enligt GDPR.")) return;
    try {
        const docRef = doc(db, "active_testdrives", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            data.endTime = Date.now();

            // RADERA KÖRKORTSBILDEN FÖR GDPR INNAN SPARNING TILL HISTORIK
            if (data.licenseImage) {
                delete data.licenseImage;
            }

            await setDoc(doc(db, "history_testdrives", id), data);
            await deleteDoc(docRef);
            showToast("Körning avslutad & ID-bild raderad!");
        }
    } catch (e) { showToast("Kunde inte avsluta", "error"); }
};

window.deleteHistoryDrive = async (id) => {
    if (!confirm("Vill du verkligen radera detta avtal permanent?")) return;
    try {
        await deleteDoc(doc(db, "history_testdrives", id));
        showToast("Avtal raderat!");
    } catch (e) { showToast("Kunde inte radera", "error"); }
};

function setupForm() {
    const form = document.getElementById('startTestDriveForm');
    if (!form) return;

    form.onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitTestDriveBtn');

        const carSelect = document.getElementById('td_car');
        const selected = carSelect.options[carSelect.selectedIndex];

        const isCanvasBlank = () => {
            const blank = document.createElement('canvas');
            blank.width = canvas.width; blank.height = canvas.height;
            return canvas.toDataURL() === blank.toDataURL();
        };

        if (isCanvasBlank()) {
            showToast("Signatur krävs!", "error");
            return;
        }

        // Hämta bild från körkortet om det finns
        const preview = document.getElementById('licensePreview');
        const licenseData = !preview.classList.contains('hidden') ? preview.src : null;

        const driveData = {
            carId: carSelect.value,
            carReg: selected.dataset.reg,
            carModel: selected.dataset.model,
            customerName: document.getElementById('td_name').value,
            customerPnr: document.getElementById('td_pnr').value,
            startTime: Date.now(),
            createdAt: serverTimestamp(),
            signature: canvas.toDataURL(),
            licenseImage: licenseData
        };

        // UI Laddar
        const origBtnHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Bearbetar...`;
        btn.disabled = true;

        try {
            await addDoc(collection(db, "active_testdrives"), driveData);
            showToast("Provkörning startad!");

            form.reset();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            preview.classList.add('hidden');
            document.getElementById('uploadPlaceholder')?.classList.remove('hidden');

            if (document.fullscreenElement) document.exitFullscreen();
        } catch (error) {
            showToast("Fel vid start", "error");
        } finally {
            btn.innerHTML = origBtnHtml;
            btn.disabled = false;
            if (window.lucide) window.lucide.createIcons({ root: btn });
        }
    };
}

function setupLicenseUpload() {
    const zone = document.getElementById('licenseUploadZone');
    const input = document.getElementById('td_license_file');
    const preview = document.getElementById('licensePreview');
    const placeholder = document.getElementById('uploadPlaceholder');
    const overlay = document.getElementById('licenseOverlay');
    const clearBtn = document.getElementById('clearLicenseBtn');

    if (!zone || !input) return;

    // När man klickar på zonen, rensa input-värdet FÖRST
    zone.onclick = () => {
        input.value = ''; 
        input.click();
    };

    // Hantera Rensa-knappen
    if (clearBtn) {
        clearBtn.onclick = (e) => {
            e.stopPropagation();
            input.value = '';
            document.getElementById('td_name').value = '';
            document.getElementById('td_pnr').value = '';
            if (preview) { preview.src = ''; preview.classList.add('hidden'); }
            if (overlay) overlay.classList.add('hidden');
            if (placeholder) placeholder.classList.remove('hidden');
            clearBtn.classList.add('hidden');
        };
    }

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);

                    // Visa bilden direkt
                    if (preview) { 
                        preview.src = compressedDataUrl; 
                        preview.classList.remove('hidden'); 
                    }
                    if (placeholder) placeholder.classList.add('hidden');
                    if (overlay) overlay.classList.remove('hidden');
                    if (clearBtn) clearBtn.classList.remove('hidden');

                    // ==========================================
                    // MAGI: STARTA OCR (TEXTIGENKÄNNING)
                    // ==========================================
                    if (window.Tesseract) {
                        const nameInput = document.getElementById('td_name');
                        const pnrInput = document.getElementById('td_pnr');
                        const overlayText = overlay.querySelector('span');
                        const originalOverlayHtml = overlayText ? overlayText.innerHTML : '';

                        // Visa laddningsindikator på bilden
                        if (overlayText) {
                            overlayText.innerHTML = '<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Läser av...';
                            if (window.lucide) window.lucide.createIcons({ root: overlayText });
                        }

                        // Läs av bilden
                        window.Tesseract.recognize(compressedDataUrl, 'swe')
                            .then(({ data: { text } }) => {
                                console.log("OCR Resultat:\n", text);
                                const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
                                
                                // 1. Hitta Personnummer (Letar efter mönstret ÅÅMMDD-XXXX)
                                const pnrMatch = text.match(/\b(19|20)?(\d{6})[-\s]?(\d{4})\b/);
                                if (pnrMatch) {
                                    pnrInput.value = pnrMatch[2] + "-" + pnrMatch[3];
                                    pnrInput.dispatchEvent(new Event('input')); // Formaterar snyggt automatiskt
                                }

                                // 2. Hitta Namn (Letar efter rad 1. och 2. på körkortet)
                                let lastName = "";
                                let firstName = "";
                                
                                lines.forEach((line, index) => {
                                    let cleanLine = line.replace(/^[^a-zA-Z0-9]+/, ''); // Ta bort skräp i början
                                    
                                    if (cleanLine.match(/^1[\.\s]/)) {
                                        lastName = cleanLine.replace(/^1[\.\s]/, '').trim();
                                        if (lastName.length < 2 && lines[index+1]) lastName = lines[index+1].trim();
                                    }
                                    if (cleanLine.match(/^2[\.\s]/)) {
                                        firstName = cleanLine.replace(/^2[\.\s]/, '').split(',')[0].trim();
                                        if (firstName.length < 2 && lines[index+1]) firstName = lines[index+1].split(',')[0].trim();
                                    }
                                });

                                if (lastName || firstName) {
                                    // NYTT: Rensa bort OCR-skräp (tillåter BARA bokstäver, bindestreck och mellanslag)
                                    const cleanStr = (str) => str.replace(/[^a-zA-ZåäöÅÄÖéÉüÜ\s-]/g, '').replace(/\s+/g, ' ').trim();
                                    
                                    firstName = cleanStr(firstName);
                                    lastName = cleanStr(lastName);

                                    // Formatera namnet snyggt med stor bokstav först
                                    const formatName = (str) => str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                                    nameInput.value = formatName(`${firstName} ${lastName}`.trim());
                                }

                                // Återställ knappens text
                                if (overlayText) {
                                    overlayText.innerHTML = originalOverlayHtml;
                                    if (window.lucide) window.lucide.createIcons({ root: overlayText });
                                }

                                // Ge feedback
                                if (pnrMatch) {
                                    showToast("Körkort avläst!", "success");
                                } else {
                                    showToast("Kunde inte läsa av kortet helt. Fyll i manuellt.", "warning");
                                }
                            })
                            .catch(err => {
                                console.error("OCR Fel:", err);
                                if (overlayText) overlayText.innerHTML = originalOverlayHtml;
                                showToast("Kunde inte läsa av bilden.", "error");
                            });
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };
}