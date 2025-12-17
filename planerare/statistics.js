// statistics.js - Felsäker version

let revenueChart = null;
let currentJobsData = []; 
let currentFilter = 3; 

// --- 1. Öppna Vyn ---
export function openStatisticsView(allJobs) {
    console.log("Öppnar statistik...", allJobs); // Felsökning

    // Säkerställ att vi har en array
    currentJobsData = Array.isArray(allJobs) ? allJobs : [];
    
    // Dölj andra vyer
    const views = ['statBar', 'timelineView', 'calendarView', 'customersView', 'settingsModal'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if(el.classList.contains('modal-backdrop')) el.classList.remove('show');
            else el.style.display = 'none';
        }
    });

    // Visa statistikvyn
    const view = document.getElementById('statisticsView');
    if (view) view.style.display = 'block';

    // Rensa ev. dolda stilar från tidigare försök
    const content = document.getElementById('statsContent');
    const skeleton = document.getElementById('statsSkeleton');
    if(content) {
        content.style.opacity = '1'; 
        content.style.display = 'block';
    }
    if(skeleton) skeleton.style.display = 'none'; // Stäng av skeleton för att vara säker

    window.scrollTo(0, 0);

    // Ladda filter
    const saved = localStorage.getItem('statsFilter');
    currentFilter = saved ? (saved === 'all' ? 'all' : parseInt(saved)) : 3;
    
    // Uppdatera UI för knappen
    updateFilterUI(currentFilter);
    
    history.pushState({ uiState: 'statistics' }, null, window.location.href);

    // Kör renderingen direkt (ingen timeout/animation som kan strula)
    try {
        renderStats(currentFilter);
    } catch (e) {
        console.error("Fel vid rendering av statistik:", e);
        alert("Ett fel uppstod när statistiken skulle ritas ut. Kolla konsolen.");
    }
}

// --- 2. Filter-funktioner ---
window.toggleStatsFilterMenu = function() {
    const drawer = document.getElementById('statsFilterDrawer');
    if (drawer) {
        drawer.style.display = (drawer.style.display === 'none') ? 'block' : 'none';
    }
}

window.setStatsFilter = function(months, btn) {
    currentFilter = months;
    localStorage.setItem('statsFilter', months);
    
    document.getElementById('statsFilterDrawer').style.display = 'none';
    updateFilterUI(months);
    renderStats(months);
}

function updateFilterUI(val) {
    // Uppdatera texten på knappen
    const labelMap = { 1: '1 Mån', 3: '3 Mån', 6: '6 Mån', 12: '1 År', 'all': 'Allt' };
    const labelEl = document.getElementById('currentFilterLabel');
    if (labelEl) labelEl.textContent = labelMap[val] || '3 Mån';

    // Markera aktivt val i listan
    document.querySelectorAll('.filter-pill-large').forEach(btn => {
        btn.classList.remove('active');
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && (onclickAttr.includes(`(${val},`) || (val === 'all' && onclickAttr.includes("'all'")))) {
            btn.classList.add('active');
        }
    });
}

// --- 3. Rendering ---
function renderStats(months) {
    const now = new Date();
    let startDate = new Date();
    let prevStartDate = new Date();
    
    if (months === 'all') {
        startDate = new Date(2020, 0, 1);
        prevStartDate = new Date(2018, 0, 1);
    } else {
        startDate.setMonth(now.getMonth() - months);
        prevStartDate.setMonth(startDate.getMonth() - months);
    }

    // Datumtext
    const dOpt = { day: 'numeric', month: 'short' };
    const dateRangeEl = document.getElementById('statsDateRange');
    if(dateRangeEl) {
        dateRangeEl.textContent = months === 'all' ? "All tid" : `${startDate.toLocaleDateString('sv-SE', dOpt)} – Idag`;
    }

    const currData = getDataForPeriod(startDate, now);
    const prevData = getDataForPeriod(prevStartDate, startDate);

    // Uppdatera siffror
    safeSetText('statTotalRevenue', currData.total.toLocaleString() + ' kr');
    safeSetText('statCompletedJobs', currData.count);
    
    const currAvg = currData.count > 0 ? Math.round(currData.total / currData.count) : 0;
    const prevAvg = prevData.count > 0 ? Math.round(prevData.total / prevData.count) : 0;
    safeSetText('statAvgValue', currAvg.toLocaleString() + ' kr');

    renderTrend('trendRevenue', currData.total, prevData.total);
    renderTrend('trendAvg', currAvg, prevAvg);

    renderChart(currData.jobs, months);
    renderTopList(currData.customerSpend);
}

function getDataForPeriod(start, end) {
    const jobs = currentJobsData.filter(j => {
        if (j.deleted || !j.datum) return false;
        // Räkna bara klara/fakturerade
        if (j.status !== 'klar' && j.status !== 'faktureras') return false;
        const d = new Date(j.datum);
        return d >= start && d < end;
    });

    let total = 0;
    const customerSpend = {};
    jobs.forEach(j => {
        const p = parseInt(j.kundpris) || 0;
        total += p;
        const c = j.kundnamn || 'Okänd';
        customerSpend[c] = (customerSpend[c] || 0) + p;
    });

    return { jobs, total, count: jobs.length, customerSpend };
}

function safeSetText(id, text) {
    const el = document.getElementById(id);
    if(el) el.textContent = text;
}

function renderTrend(elId, curr, prev) {
    const el = document.getElementById(elId);
    if (!el) return;
    
    if (!prev || prev === 0) {
        el.innerHTML = '<span style="color:#cbd5e1">-</span>';
        return;
    }
    const diff = curr - prev;
    const pct = Math.round((diff / prev) * 100);
    
    if (diff >= 0) el.innerHTML = `<span style="color:#10b981">▲ ${pct}%</span>`;
    else el.innerHTML = `<span style="color:#ef4444">▼ ${Math.abs(pct)}%</span>`;
}

function renderChart(jobs, months) {
    const ctx = document.getElementById('revenueChartCanvas');
    if (!ctx) return;
    
    if (revenueChart) revenueChart.destroy();

    // Om inga jobb finns, visa tom graf
    if(jobs.length === 0) {
        // Skapa tom graf
        revenueChart = new Chart(ctx, { type: 'bar', data: {labels:[], datasets:[]} });
        return;
    }

    const grouped = {};
    jobs.forEach(j => {
        const d = new Date(j.datum);
        const p = parseInt(j.kundpris) || 0;
        let key, label;

        if (months === 1) {
            key = d.toISOString().split('T')[0];
            label = d.getDate(); 
        } else {
            key = `${d.getFullYear()}-${d.getMonth()}`;
            label = d.toLocaleDateString('sv-SE', { month: 'short' });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        if (!grouped[key]) grouped[key] = { label: label, val: 0, sort: d };
        grouped[key].val += p;
    });

    const dataArr = Object.values(grouped).sort((a,b) => a.sort - b.sort);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(1, '#93c5fd');

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataArr.map(d => d.label),
            datasets: [{
                data: dataArr.map(d => d.val),
                backgroundColor: gradient,
                borderRadius: 4,
                barThickness: 'flex',
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#64748b' } }
            }
        }
    });
}

function renderTopList(spendObj) {
    const el = document.getElementById('topCustomersList');
    if (!el) return;
    el.innerHTML = '';
    
    const sorted = Object.entries(spendObj).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    if (sorted.length === 0) {
        el.innerHTML = '<p style="text-align:center; color:#cbd5e1; font-size:0.8rem; padding:10px;">Ingen data</p>';
        return;
    }

    sorted.forEach(([name, amount], i) => {
        const initials = name.slice(0,2).toUpperCase();
        const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];
        const bg = colors[name.length % colors.length];
        
        el.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f8fafc;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:50%; background:${bg}20; color:${bg}; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">${initials}</div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:0.9rem; font-weight:600; color:#334155;">${name}</span>
                    <span style="font-size:0.7rem; color:#94a3b8;">#${i+1} Bästa kund</span>
                </div>
            </div>
            <span style="font-size:0.9rem; font-weight:700; color:#1e293b;">${amount.toLocaleString()} kr</span>
        </div>`;
    });
}

window.downloadStatsChart = function() {
    const canvas = document.getElementById('revenueChartCanvas');
    if(canvas) {
        const link = document.createElement('a');
        link.download = 'graf.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}

// --- 4. NAVIGERING (FIX FÖR BAKÅTKNAPP) ---

window.goToOverviewFromStats = function() {
    // 1. Dölj statistikvyn
    document.getElementById('statisticsView').style.display = 'none';
    
    // 2. Visa startsidan (Dashboard) igen
    const statBar = document.getElementById('statBar');
    const timeline = document.getElementById('timelineView');
    
    if (statBar) statBar.style.display = ''; // Återställ till flex/grid (tom sträng tar bort 'none')
    if (timeline) timeline.style.display = 'block';
    
    // 3. Hantera webbläsarhistoriken (så man inte fastnar om man trycker Back i webbläsaren sen)
    if (history.state && history.state.uiState === 'statistics') {
        history.back();
    }
}
