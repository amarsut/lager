// statistics.js - Final med Prognos & Heatmap

let revenueChart = null;
let currentJobsData = []; 
let currentFilter = 3; 
let currentViewMode = 'revenue';

// --- 1. ÖPPNA VYN ---
export function openStatisticsView(allJobs) {
    currentJobsData = Array.isArray(allJobs) ? allJobs : [];
    
    // UI Setup
    ['statBar', 'timelineView', 'calendarView', 'customersView', 'settingsModal'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if(el.classList.contains('modal-backdrop')) el.classList.remove('show');
            else el.style.display = 'none';
        }
    });

    const view = document.getElementById('statisticsView');
    const content = document.getElementById('statsContent');
    const skeleton = document.getElementById('statsSkeleton');

    if (view) view.style.display = 'block';
    if (content) { content.style.opacity = '1'; content.style.display = 'block'; }
    if (skeleton) skeleton.style.display = 'none';

    window.scrollTo(0, 0);
    closeDrillDown();

    const saved = localStorage.getItem('statsFilter');
    currentFilter = saved ? (saved === 'all' ? 'all' : parseInt(saved)) : 3;
    
    updateFilterUI(currentFilter);
    history.pushState({ uiState: 'statistics' }, null, window.location.href);

    renderStats(currentFilter);
}

// --- 2. NAVIGERING & INTERAKTION ---
window.goToOverviewFromStats = function() {
    document.getElementById('statisticsView').style.display = 'none';
    const statBar = document.getElementById('statBar');
    const timeline = document.getElementById('timelineView');
    if (statBar) statBar.style.display = ''; 
    if (timeline) timeline.style.display = 'block';
    if (history.state && history.state.uiState === 'statistics') history.back();
}

window.toggleChartMode = function(mode, btn) {
    currentViewMode = mode;
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if(navigator.vibrate) navigator.vibrate(5);
    renderStats(currentFilter);
    closeDrillDown();
}

window.toggleStatsFilterMenu = function() {
    const drawer = document.getElementById('statsFilterDrawer');
    if (drawer) drawer.style.display = (drawer.style.display === 'none') ? 'block' : 'none';
}

window.setStatsFilter = function(months, btn) {
    currentFilter = months;
    localStorage.setItem('statsFilter', months);
    document.getElementById('statsFilterDrawer').style.display = 'none';
    updateFilterUI(months);
    renderStats(months);
    closeDrillDown();
}

window.closeDrillDown = function() {
    const el = document.getElementById('drillDownContainer');
    if(el) el.style.display = 'none';
}

function updateFilterUI(val) {
    const labelMap = { 1: '1 Mån', 3: '3 Mån', 6: '6 Mån', 12: '1 År', 'all': 'Allt' };
    const lbl = document.getElementById('currentFilterLabel');
    if(lbl) lbl.textContent = labelMap[val] || '3 Mån';
    document.querySelectorAll('.filter-pill-large').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick').includes(`(${val},`) || (val==='all' && btn.innerText.includes('All'))) {
            btn.classList.add('active');
        }
    });
}

// --- 3. CORE LOGIC ---
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

    // 1. Datumtext
    const dOpt = { day: 'numeric', month: 'short' };
    const dateEl = document.getElementById('statsDateRange');
    if(dateEl) dateEl.textContent = months === 'all' ? "All tid" : `${startDate.toLocaleDateString('sv-SE', dOpt)} – Idag`;

    // 2. Data för KPI:er
    const currData = getDataForPeriod(startDate, now);
    const prevData = getDataForPeriod(prevStartDate, startDate);

    // 3. Uppdatera KPI-korten
    animateNumber('statTotalRevenue', currData.totalRevenue);
    renderTrend('trendRevenue', currData.totalRevenue, prevData.totalRevenue);

    const jobsEl = document.getElementById('statCompletedJobs');
    if(jobsEl) jobsEl.textContent = currData.count;

    const avg = currData.count > 0 ? Math.round(currData.totalRevenue / currData.count) : 0;
    const prevAvg = prevData.count > 0 ? Math.round(prevData.totalRevenue / prevData.count) : 0;
    animateNumber('statAvgValue', avg);
    renderTrend('trendAvg', avg, prevAvg);

    // 4. MÅNADSMÅL (Låst till nuvarande månad)
    renderMonthlyGoal();

    // 5. PROGNOS (Bokade jobb framåt/nu)
    renderForecast();

    // 6. HEATMAP (Beläggning per veckodag för vald period)
    renderHeatmap(currData.jobs);

    // 7. GRAF & LISTOR
    renderChart(currData.jobs, months, currentViewMode);
    renderTopList(currData.customerSpend);
}

// --- NY FUNKTION: Månadsmål ---
function renderMonthlyGoal() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filtrera fram klara/fakturerade jobb för DENNA månad
    const monthJobs = currentJobsData.filter(j => {
        if (j.deleted || !j.datum) return false;
        if (j.status !== 'klar' && j.status !== 'faktureras') return false;
        const d = new Date(j.datum);
        return d >= startOfMonth && d <= endOfMonth;
    });

    const monthRevenue = monthJobs.reduce((sum, j) => sum + (parseInt(j.kundpris) || 0), 0);
    const goal = 10000; // Ditt mål
    let percent = Math.round((monthRevenue / goal) * 100);
    
    // UI Update
    const bar = document.getElementById('goalBar');
    const txt = document.getElementById('goalPercent');
    const label = document.getElementById('goalLabel');

    if(label) {
        const monthName = now.toLocaleDateString('sv-SE', {month:'long'});
        label.textContent = `Månadsmål (${monthName.charAt(0).toUpperCase() + monthName.slice(1)})`;
    }

    if (bar && txt) {
        setTimeout(() => { bar.style.width = Math.min(percent, 100) + '%'; }, 100);
        txt.textContent = percent + '%';
        if (percent >= 100) {
            bar.className = 'progress-fill success';
            txt.innerHTML = '🎉 Mål nått!';
            txt.style.color = '#d97706';
        } else {
            bar.className = 'progress-fill';
            txt.style.color = '#0f172a';
        }
    }
}

// --- NY FUNKTION: Prognos ---
function renderForecast() {
    // Hitta alla 'bokade' (ej klara)
    const bookedJobs = currentJobsData.filter(j => 
        !j.deleted && j.status === 'bokad'
    );
    
    const totalValue = bookedJobs.reduce((sum, j) => sum + (parseInt(j.kundpris) || 0), 0);
    
    animateNumber('forecastValue', totalValue);
    
    const countEl = document.getElementById('forecastCount');
    if(countEl) countEl.textContent = `${bookedJobs.length} jobb väntar`;
}

// --- NY FUNKTION: Heatmap ---
function renderHeatmap(jobs) {
    const container = document.getElementById('heatmapContainer');
    if(!container) return;
    container.innerHTML = '';

    const dayCounts = [0,0,0,0,0]; // Mån-Fre (Index 0=Mån)
    
    jobs.forEach(j => {
        const d = new Date(j.datum);
        let day = d.getDay(); // 0=Sön, 1=Mån...
        if(day >= 1 && day <= 5) {
            dayCounts[day-1]++;
        }
    });

    const max = Math.max(...dayCounts, 1); // För att räkna höjd %
    const days = ['M', 'T', 'O', 'T', 'F'];

    days.forEach((d, i) => {
        const count = dayCounts[i];
        const height = Math.round((count / max) * 100);
        const isHigh = height === 100 && count > 0;
        
        container.innerHTML += `
        <div class="hm-col">
            <div class="hm-bar ${isHigh ? 'high' : ''}" style="height:${height}%" title="${count} jobb"></div>
            <span class="hm-day">${d}</span>
        </div>`;
    });
}

function getDataForPeriod(start, end) {
    const jobs = currentJobsData.filter(j => {
        if (j.deleted || !j.datum) return false;
        if (j.status !== 'klar' && j.status !== 'faktureras') return false;
        const d = new Date(j.datum);
        return d >= start && d < end;
    });

    let totalRevenue = 0;
    let totalProfit = 0;
    const customerSpend = {};

    jobs.forEach(j => {
        const rev = parseInt(j.kundpris) || 0;
        const profit = calculateJobProfit(j);
        totalRevenue += rev;
        totalProfit += profit;
        const c = j.kundnamn || 'Okänd';
        customerSpend[c] = (customerSpend[c] || 0) + rev;
    });

    return { jobs, totalRevenue, totalProfit, count: jobs.length, customerSpend };
}

function calculateJobProfit(job) {
    const intakt = parseInt(job.kundpris) || 0;
    let utgiftSumma = 0;
    if (job.utgifter && Array.isArray(job.utgifter)) {
        utgiftSumma = job.utgifter.reduce((sum, item) => sum + (parseInt(item.pris) || 0), 0);
    } else if (job.utgifterTotal) {
        utgiftSumma = parseInt(job.utgifterTotal) || 0;
    }
    return intakt - utgiftSumma;
}

function renderChart(jobs, months, mode) {
    const ctx = document.getElementById('revenueChartCanvas');
    if (!ctx) return;
    if (revenueChart) revenueChart.destroy();

    // Hantera tomt
    if(jobs.length === 0) {
        revenueChart = new Chart(ctx, {type:'bar', data:{labels:[], datasets:[]}});
        return;
    }

    const grouped = {};
    jobs.forEach(j => {
        const d = new Date(j.datum);
        const val = mode === 'profit' ? calculateJobProfit(j) : (parseInt(j.kundpris) || 0);
        let key, label;

        if (months === 1) {
            key = d.toISOString().split('T')[0];
            label = d.getDate(); 
        } else {
            key = `${d.getFullYear()}-${d.getMonth()}`;
            label = d.toLocaleDateString('sv-SE', { month: 'short' });
            label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        if (!grouped[key]) grouped[key] = { label: label, val: 0, sort: d, jobs: [] };
        grouped[key].val += val;
        grouped[key].jobs.push(j);
    });

    const dataArr = Object.values(grouped).sort((a,b) => a.sort - b.sort);
    const colorTop = mode === 'profit' ? '#10b981' : '#3b82f6';
    
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, colorTop);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dataArr.map(d => d.label),
            datasets: [{
                label: mode === 'profit' ? 'Vinst' : 'Omsättning',
                data: dataArr.map(d => d.val),
                backgroundColor: gradient,
                borderRadius: 4,
                barThickness: 'flex',
                maxBarThickness: 45
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { display: false },
                x: { grid: { display: false }, ticks: { font: { weight: '600' }, color: '#64748b' } }
            },
            onClick: (e) => {
                const points = revenueChart.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
                if (points.length) {
                    const idx = points[0].index;
                    const item = dataArr[idx];
                    showDrillDown(item.jobs, item.label);
                }
            }
        }
    });
}

function showDrillDown(jobs, label) {
    const container = document.getElementById('drillDownContainer');
    const list = document.getElementById('drillDownList');
    const title = document.getElementById('drillDownTitle');
    
    if(container && list) {
        // 1. Visa containern och sätt innehåll
        container.style.display = 'block';
        title.textContent = `Detaljer för ${label}`;
        list.innerHTML = '';

        // 2. Sortera och rendera listan
        const sorted = jobs.sort((a,b) => (parseInt(b.kundpris)||0) - (parseInt(a.kundpris)||0));
        sorted.forEach(j => {
            const val = currentViewMode === 'profit' ? calculateJobProfit(j) : (parseInt(j.kundpris)||0);
            const colorClass = currentViewMode === 'profit' ? 'text-green' : 'text-blue';
            
            // Kolla om openEditModal finns innan vi lägger till onclick
            const clickAction = (typeof window.openEditModal === 'function') 
                ? `onclick="openEditModal('${j.id}')"` 
                : '';

            list.innerHTML += `
            <div class="drill-item" ${clickAction}>
                <div class="drill-left">
                    <span class="drill-reg">${j.regnr || 'Inget Reg'}</span>
                    <span class="drill-desc">${j.kundnamn} • ${j.paket || 'Service'}</span>
                </div>
                <span class="drill-price ${colorClass}">${val.toLocaleString()} kr</span>
            </div>`;
        });

        // 3. SMART SCROLL (FIXEN)
        // Vi letar upp graf-kortet istället för listan
        const chartCard = document.querySelector('.chart-card-compact');
        
        if (chartCard) {
            // Räkna ut var kortet är i förhållande till sidans topp
            const rect = chartCard.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Justera för din sticky header (ca 70-80px höjd)
            const headerOffset = 80; 
            
            const finalPosition = rect.top + scrollTop - headerOffset;

            window.scrollTo({
                top: finalPosition,
                behavior: 'smooth'
            });
        }
    }
}

function renderTopList(spendObj) {
    const el = document.getElementById('topCustomersList');
    if(!el) return;
    el.innerHTML = '';
    const sorted = Object.entries(spendObj).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    if(sorted.length === 0) { el.innerHTML = '<p style="color:#cbd5e1; text-align:center; padding:10px;">Ingen data</p>'; return; }

    sorted.forEach(([name, amount], i) => {
        const clean = name.replace(/[^a-zA-ZåäöÅÄÖ ]/g, "").trim() || "?";
        const initials = clean.substring(0,2).toUpperCase();
        const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444'];
        const bg = colors[name.length % colors.length];
        
        el.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f8fafc;">
            <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:36px; height:36px; border-radius:50%; background:${bg}20; color:${bg}; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700;">${initials}</div>
                <div style="display:flex; flex-direction:column;">
                    <span style="font-size:0.9rem; font-weight:600; color:#334155;">${name}</span>
                    <span style="font-size:0.7rem; color:#94a3b8;">#${i+1}</span>
                </div>
            </div>
            <span style="font-size:0.9rem; font-weight:700; color:#1e293b;">${amount.toLocaleString()} kr</span>
        </div>`;
    });
}

function animateNumber(id, end) {
    const el = document.getElementById(id);
    if(el) el.innerText = (end || 0).toLocaleString() + ' kr';
}

function renderTrend(elId, curr, prev) {
    const el = document.getElementById(elId);
    if(!el) return;
    if(!prev || prev === 0) { el.innerHTML = '<span style="color:#cbd5e1">-</span>'; return; }
    const pct = Math.round(((curr - prev)/prev)*100);
    el.innerHTML = pct >= 0 ? `<span style="color:#10b981">▲ ${pct}%</span>` : `<span style="color:#ef4444">▼ ${Math.abs(pct)}%</span>`;
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
