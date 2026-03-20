import { doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { db, AppState } from "./core.js";
import { triggerPrintPriceTag } from "./print.js";

export function initInventory() {
    initDashboard();
}

async function initDashboard() {
    try {
        // 1. Hämta live-lagret (Aktiva)
        const docSnap = await getDoc(doc(db, "system", "inventory"));
        let activeCars = [];
        let lastUpdated = '';
        if (docSnap.exists()) {
            activeCars = docSnap.data().cars || [];
            activeCars.forEach(c => c.dbStatus = 'active'); // Tagga som aktiv
            lastUpdated = docSnap.data().lastUpdated?.toDate().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) || '';
        }

        // 2. Hämta skuggbokföringen (Sålda bilar)
        const trackedSnap = await getDocs(collection(db, "tracked_cars"));
        const soldCars = [];
        trackedSnap.forEach(d => {
            const data = d.data();
            if (data.status === 'sold') {
                // Konvertera historik-datan så den ser ut som en vanlig bil i listan
                soldCars.push({
                    id: data.carId || d.id,
                    make: data.brand || 'Okänt',
                    model: data.model || '',
                    regNo: data.regNo || '',
                    price: { value: parseInt(data.price) || 0 }, 
                    publishedDate: data.date_added?.toDate()?.toISOString() || new Date().toISOString(),
                    soldDate: data.date_removed?.toDate()?.toISOString() || null,
                    dbStatus: 'sold',
                    images: [] // Oftast raderade från API:et
                });
            }
        });

        // 3. Hämta statistik (views)
        const statsSnap = await getDocs(collection(db, "car_stats"));
        const stats = {};
        statsSnap.forEach(d => stats[d.id] = d.data().views || 0);

        // 4. Spara och kör
        AppState.inventory = activeCars; // Behåll bara aktiva för kalender etc.
        const allCars = [...activeCars, ...soldCars]; // Slå ihop listan för tabellen

        if (allCars.length) {
            window.processDashboard(allCars, stats);
            if (window.populateTestDriveCars) window.populateTestDriveCars();
            if (window.populatePrintCars) window.populatePrintCars();
        }

        const lastUpdatedEl = document.getElementById('lastUpdated');
        if (lastUpdatedEl && lastUpdated) lastUpdatedEl.textContent = `SYNKAT ${lastUpdated}`;

        const dot = document.getElementById('statusDot');
        if (dot) {
            dot.classList.replace('bg-slate-300', 'bg-emerald-500');
            dot.classList.replace('dark:bg-slate-600', 'bg-emerald-500');
        }
    } catch (err) {
        console.error("Fel vid laddning av lager:", err);
    }
}

window.processDashboard = function (allCars = [], stats = {}) {
    const tableData = [];
    let metrics = { total: 0, count: 0, risk: 0, discount: 0 };
    let ageZones = { '0-30': 0, '31-90': 0, '90+': 0 };
    let brands = {};

    allCars.forEach(car => {
        const pubDate = car.publishedDate ? new Date(car.publishedDate) : new Date();
        const diffDays = car.publishedDate ? Math.max(0, Math.ceil((new Date() - pubDate) / (1000 * 60 * 60 * 24))) : 0;
        const pubDateStr = pubDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
        const price = car.price?.value || 0;
        const prevPrice = car.price?.previousValue || null;
        const discount = (prevPrice && prevPrice > price) ? prevPrice - price : 0;
        const make = car.make || 'Okänt';

        // Räkna ENDAST med aktiva bilar i KPI-kort och diagram!
        if (car.dbStatus === 'active') {
            metrics.count++;
            metrics.total += price; 
            metrics.discount += discount;
            if (diffDays <= 30) ageZones['0-30']++;
            else if (diffDays <= 90) ageZones['31-90']++;
            else { ageZones['90+']++; metrics.risk += price; }

            if (!brands[make]) brands[make] = { days: 0, count: 0 };
            brands[make].days += diffDays; brands[make].count++;
        }

        // Lägg in alla bilar (både aktiva och sålda) i tabellen
        tableData.push({ 
            id: car.id, 
            make, 
            model: car.model, 
            reg: car.regNo, 
            price, 
            discount, 
            milage: car.milage, 
            year: car.modelYear, 
            diffDays, 
            pubDateStr, 
            img: car.images?.[0]?.imageFormats?.[0]?.url || 'https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=100&q=80', 
            views: stats[car.id] || car.views || 0,
            status: car.dbStatus,
            soldDate: car.soldDate ? new Date(car.soldDate).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' }) : null
        });
    });

    const money = new Intl.NumberFormat('sv-SE');
    if (document.getElementById('kpiValue')) document.getElementById('kpiValue').textContent = `${money.format(metrics.total)} kr`;
    if (document.getElementById('kpiCount')) document.getElementById('kpiCount').textContent = metrics.count;
    if (document.getElementById('kpiRisk')) document.getElementById('kpiRisk').textContent = `${money.format(metrics.risk)} kr`;
    if (document.getElementById('kpiDiscount')) document.getElementById('kpiDiscount').textContent = `-${money.format(metrics.discount)} kr`;

    // Spara datan globalt så filtrering fungerar live
    window.currentTableData = tableData;

    // Hämta aktuella värden för filter och rendera
    const sorterEl = document.getElementById('tableSorter');
    const sortMode = sorterEl ? sorterEl.value : 'oldest';
    const statusEl = document.getElementById('inventoryStatusFilter');
    const statusMode = statusEl ? statusEl.value : 'active';

    renderTable(window.currentTableData, sortMode, statusMode);

    // KOPPLA LIVE-LYSSNARE (Filter)
    if (sorterEl) {
        const newSorter = sorterEl.cloneNode(true);
        sorterEl.parentNode.replaceChild(newSorter, sorterEl);
        newSorter.addEventListener('change', e => renderTable(window.currentTableData, e.target.value, document.getElementById('inventoryStatusFilter')?.value || 'active'));
    }

    if (statusEl) {
        const newStatus = statusEl.cloneNode(true);
        statusEl.parentNode.replaceChild(newStatus, statusEl);
        newStatus.addEventListener('change', e => renderTable(window.currentTableData, document.getElementById('tableSorter')?.value || 'oldest', e.target.value));
    }

    // KOPPLA LIVE-LYSSNARE (Sök)
    const searchEl = document.getElementById('inventorySearch');
    if (searchEl) {
        const newSearch = searchEl.cloneNode(true);
        searchEl.parentNode.replaceChild(newSearch, searchEl);
        newSearch.addEventListener('input', () => {
            renderTable(window.currentTableData, document.getElementById('tableSorter')?.value || 'oldest', document.getElementById('inventoryStatusFilter')?.value || 'active');
        });
    }

    renderCharts(brands, ageZones);
    renderTopCars(tableData.filter(c => c.status === 'active')); // Bara aktiva i topplistan
}

function renderTable(data, sortMode, statusMode) {
    const tbody = document.getElementById('inventoryTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    // 1. Filtrera på Status (Aktiv/Såld/Alla)
    let filtered = data;
    if (statusMode === 'active') filtered = data.filter(c => c.status === 'active');
    if (statusMode === 'sold') filtered = data.filter(c => c.status === 'sold');

    // 2. Filtrera på Fritext-sök
    const searchVal = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    if (searchVal) {
        filtered = filtered.filter(c => 
            c.make.toLowerCase().includes(searchVal) || 
            c.model.toLowerCase().includes(searchVal) || 
            (c.reg && c.reg.toLowerCase().includes(searchVal))
        );
    }

    // 3. Sortera listan
    if (sortMode === 'oldest') filtered.sort((a, b) => b.diffDays - a.diffDays);
    if (sortMode === 'newest') filtered.sort((a, b) => a.diffDays - b.diffDays);
    if (sortMode === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sortMode === 'discount') filtered.sort((a, b) => b.discount - a.discount);

    const money = new Intl.NumberFormat('sv-SE');
    filtered.forEach(car => {
        let statusHtml = '';
        
        // Ritar olika märke beroende på om den är såld eller i lager
        if (car.status === 'sold') {
            statusHtml = `<div class="text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded border border-red-200 dark:border-red-500/20 text-[9px] font-black uppercase tracking-widest inline-flex items-center gap-1"><i data-lucide="check-circle" class="w-3 h-3"></i> Såld</div>
                          <div class="text-[9px] text-slate-500 mt-1">${car.soldDate}</div>`;
        } else {
            const isOld = car.diffDays > 90; 
            const isNew = car.diffDays <= 14;
            statusHtml = isOld ? `<div class="text-amber-500 bg-amber-50 dark:bg-amber-500/10 w-8 h-8 rounded flex items-center justify-center border border-amber-200 dark:border-amber-500/20 mx-auto" title="Lång ståtid"><i data-lucide="alert-triangle" class="w-4 h-4"></i></div>` :
                isNew ? `<div class="text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 w-8 h-8 rounded flex items-center justify-center border border-emerald-200 dark:border-emerald-500/20 mx-auto" title="Nyinkommen"><i data-lucide="flame" class="w-4 h-4"></i></div>` :
                    `<div class="text-blue-500 bg-blue-50 dark:bg-blue-500/10 w-8 h-8 rounded flex items-center justify-center border border-blue-200 dark:border-blue-500/20 mx-auto" title="I Lager"><i data-lucide="check" class="w-4 h-4"></i></div>`;
        }

        // Tona ner sålda bilar så de blir lätt grå/halvgenomskinliga
        const rowClass = car.status === 'sold' ? "opacity-60 grayscale-[50%]" : "";

        tbody.innerHTML += `
            <tr class="border-b border-slate-200 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-[#1e293b]/60 transition-colors group ${rowClass}">
                <td class="p-4 align-middle"><div class="w-20 h-12 rounded bg-slate-200 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 overflow-hidden"><img src="${car.img}" class="w-full h-full object-cover"></div></td>
                <td class="p-4 align-middle">
                    <div class="font-extrabold text-slate-900 dark:text-white uppercase text-sm tracking-tight">${car.make} <span class="font-medium text-slate-500 dark:text-slate-400">${car.model}</span></div>
                    <div class="text-[12px] text-slate-500 dark:text-slate-400 mt-1"><span class="font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0f172a] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 tracking-wider shadow-sm">${car.reg || 'OKÄND'}</span> • ${car.year || '-'} • ${car.milage ? money.format(car.milage) : 0} mil</div>
                </td>
                <td class="p-4 align-middle">
                    <div class="font-bold text-sm text-slate-700 dark:text-slate-200">${car.diffDays} <span class="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">dgr</span></div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i> ${car.pubDateStr}</div>
                </td>
                <td class="p-4 align-middle text-center text-slate-500 dark:text-slate-400 text-xs font-bold"><i data-lucide="eye" class="w-3.5 h-3.5 inline"></i> ${car.views}</td>
                <td class="p-4 align-middle text-center">${statusHtml}</td>
                <td class="p-4 align-middle text-right font-black text-slate-900 dark:text-white text-base">${money.format(car.price)} kr</td>
                <td class="p-4 align-middle text-right">${car.discount > 0 ? `<span class="text-brand-500 font-black text-base">-${money.format(car.discount)}</span>` : '<span class="text-slate-400 dark:text-slate-600 font-medium opacity-50">-</span>'}</td>
                <td class="p-4 align-middle text-right"><button onclick="window.printCarPriceTag('${car.id}')" class="w-8 h-8 rounded flex items-center justify-center ml-auto opacity-0 group-hover:opacity-100 text-slate-400 hover:text-brand-500 bg-[#FAFAFA] dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700/50 hover:border-brand-500 transition-all outline-none shadow-sm" ${car.status === 'sold' ? 'disabled' : ''}><i data-lucide="printer" class="w-4 h-4"></i></button></td>
            </tr>
        `;
    });
    if (window.lucide) window.lucide.createIcons();
}

function renderTopCars(data) {
    const list = document.getElementById('topCarsList');
    if (!list) return;
    list.innerHTML = '';
    const top5 = [...data].sort((a, b) => b.views - a.views).slice(0, 5);
    const money = new Intl.NumberFormat('sv-SE');

    top5.forEach((car, index) => {
        list.innerHTML += `
            <tr class="border-b border-slate-200 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-[#1e293b]/40 transition-colors">
                <td class="p-3 w-8"><span class="font-black text-slate-300 dark:text-slate-600 text-lg">#${index + 1}</span></td>
                <td class="p-3">
                    <div class="font-bold text-slate-900 dark:text-white text-sm">${car.make} <span class="font-medium text-slate-500">${car.model}</span></div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5"><span class="font-mono bg-slate-50 dark:bg-[#0f172a] px-1 rounded border border-slate-200 dark:border-slate-700/50">${car.reg}</span> • ${money.format(car.price)} kr</div>
                </td>
                <td class="p-3 text-right"><div class="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded border border-orange-100 dark:border-orange-500/20 font-bold text-xs"><i data-lucide="eye" class="w-3.5 h-3.5"></i> ${car.views}</div></td>
            </tr>`;
    });
    if (window.lucide) window.lucide.createIcons();
}

function renderCharts(brands, ages) {
    const brandCanvas = document.getElementById('brandChart');
    const turnoverCanvas = document.getElementById('turnoverChart');

    if (!brandCanvas && !turnoverCanvas) return;

    const isDark = document.documentElement.classList.contains('dark');
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

    // Data för tårtdiagrammet (Antal bilar per märke)
    const brandLabels = Object.keys(brands).sort((a, b) => brands[b].count - brands[a].count).slice(0, 5); // Topp 5 märken
    const brandData = brandLabels.map(m => brands[m].count);
    const brandColors = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

    if (brandCanvas) {
        if (window.Chart.getChart("brandChart")) window.Chart.getChart("brandChart").destroy();
        new window.Chart(brandCanvas, {
            type: 'doughnut',
            data: {
                labels: brandLabels,
                datasets: [{ data: brandData, backgroundColor: brandColors, borderWidth: 0, cutout: '70%' }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: textColor, font: { family: 'Inter', size: 10 }, padding: 15 } } 
                }
            }
        });
    }

    // Data för stapeldiagrammet (Snittdagar i lager per märke)
    if (turnoverCanvas) {
        const tData = Object.keys(brands)
            .map(m => ({ make: m, avg: Math.round(brands[m].days / brands[m].count) }))
            .sort((a, b) => b.avg - a.avg)
            .slice(0, 6); // Visar de 6 märken vi haft längst

        if (window.Chart.getChart("turnoverChart")) window.Chart.getChart("turnoverChart").destroy();
        new window.Chart(turnoverCanvas, {
            type: 'bar',
            data: { 
                labels: tData.map(d => d.make), 
                datasets: [{ 
                    label: 'Dagar i snitt',
                    data: tData.map(d => d.avg), 
                    backgroundColor: '#3b82f6', 
                    borderRadius: 4,
                    barPercentage: 0.6
                }] 
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: textColor, font: { size: 10 } } },
                    y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 10 } } }
                }
            }
        });
    }
}

window.printCarPriceTag = function (id) {
    triggerPrintPriceTag(id);
};

// ==========================================
// LIFE & INFO WIDGETS (Väder & Nyheter)
// ==========================================

// Körs automatiskt när dashboarden laddas
setTimeout(initLifeWidgets, 1000);

async function initLifeWidgets() {
    fetchWeather();
    
    // Notis om Google Reviews
    // Att hämta Live-reviews från Google kräver en betald API-nyckel. 
    // Tills vidare är CSAT-kortet snyggt hårdkodat i din HTML. 
    // När du har en Google Places API-nyckel kan vi koppla in den här!
}

async function fetchWeather() {
    // Eslövs koordinater
    const lat = 55.8394;
    const lon = 13.3033;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=Europe%2FBerlin`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        // Uppdatera Dagens väder
        const currentTemp = Math.round(data.current.temperature_2m);
        const currentCode = data.current.weather_code;
        document.getElementById('weatherTempToday').textContent = `${currentTemp}°`;
        
        // Uppdatera Morgondagens väder
        const tomorrowTemp = Math.round(data.daily.temperature_2m_max[1]);
        const tomorrowCode = data.daily.weather_code[1];
        const tomorrowSpan = document.getElementById('weatherTomorrow');
        if (tomorrowSpan) {
            tomorrowSpan.innerHTML = `${getWeatherIconHtml(tomorrowCode, 'w-3.5 h-3.5')} <span>${tomorrowTemp}°</span>`;
        }
        
        // Sätt beskrivning och Ikon idag
        document.getElementById('weatherDesc').textContent = getWeatherDesc(currentCode);
        const iconToday = document.getElementById('weatherIconToday');
        if (iconToday) {
            iconToday.outerHTML = getWeatherIconHtml(currentCode, 'w-12 h-12 relative z-10');
        }

        if (window.lucide) window.lucide.createIcons();

    } catch (err) {
        console.error("Kunde inte hämta väder", err);
        document.getElementById('weatherDesc').textContent = "Väder offline";
    }
}

// Hjälpfunktion för att översätta Vädermetrologi-koder till snygga Ikoner/Text
function getWeatherDesc(code) {
    if (code <= 3) return "Klart / Halvklart";
    if (code <= 48) return "Dimmigt";
    if (code <= 67) return "Regnigt";
    if (code <= 77) return "Snöfall";
    if (code <= 82) return "Skurar";
    return "Oväder";
}

function getWeatherIconHtml(code, classes) {
    let icon = "sun";
    if (code === 1 || code === 2) icon = "cloud-sun";
    else if (code === 3) icon = "cloud";
    else if (code <= 48) icon = "cloud-fog";
    else if (code <= 67) icon = "cloud-rain";
    else if (code <= 77) icon = "snowflake";
    else if (code <= 82) icon = "cloud-drizzle";
    else icon = "cloud-lightning";
    return `<i data-lucide="${icon}" class="${classes}"></i>`;
}