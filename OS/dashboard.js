// dashboard.js

// 1. SMART DATUMFORMATERARE
const formatDate = (dateStr) => {
    if (!dateStr) return null;
    
    const targetDate = new Date(dateStr);
    const today = new Date();
    
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "IDAG";
    if (diffDays === 1) return "IMORGON";
    if (diffDays === -1) return "IGÅR";
    
    if (diffDays >= 2 && diffDays <= 7) {
        const weekDays = ['SÖNDAG', 'MÅNDAG', 'TISDAG', 'ONSDAG', 'TORSDAG', 'FREDAG', 'LÖRDAG'];
        return weekDays[targetDate.getDay()];
    }
    
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAJ', 'JUN', 'JUL', 'AUG', 'SEP', 'OKT', 'NOV', 'DEC'];
    return `${targetDate.getDate()} ${months[targetDate.getMonth()]}`;
};

// 2. STATUS BADGE (Uppfräschad design)
window.Badge = React.memo(({ status }) => {
    const s = (status || 'BOKAD').toUpperCase();
    
    // Färger och "dot"-färger
    const config = {
        'BOKAD':      { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200/60', dot: 'bg-orange-500' },
        'OFFERERAD':  { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200/60',   dot: 'bg-blue-500' },
        'KLAR':       { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200/60',dot: 'bg-emerald-500' },
        'FAKTURERAS': { bg: 'bg-zinc-100',  text: 'text-zinc-600',   border: 'border-zinc-200',      dot: 'bg-zinc-400' },
    };

    const style = config[s] || config['BOKAD'];

    return (
        <span className={`pl-1.5 pr-2 py-1 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
            {s}
        </span>
    );
});

// 3. MOBILKORTET (Flyttad UTANFÖR DashboardView för att fixa menubuggen)
window.MobileJobCard = React.memo(({ job, setView }) => {
    const [menuOpen, setMenuOpen] = React.useState(false);

    const isWaiting = !job.datum;
    const dateString = formatDate(job.datum);
    const isUrgentDate = ['IDAG', 'IMORGON', 'IGÅR'].includes(dateString);
    const vehicleDisplay = job.regnr || job.bilmodell || '-';
});

// 4. HUVUDVY
window.DashboardView = React.memo(({ 
    filteredJobs, setEditingJob, setView, 
    activeFilter, setActiveFilter, statusCounts,
    globalSearch, setGlobalSearch 
}) => {
    const [searchOpen, setSearchOpen] = React.useState(false);
    const filters = ['BOKAD', 'OFFERERAD', 'FAKTURERAS', 'KLAR', 'ALLA'];
    
    // --- SWIPE LOGIC ---
    const touchStart = React.useRef(null);
    const touchStartY = React.useRef(null);

    const onTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
        touchStartY.current = e.targetTouches[0].clientY;
    };

    const onTouchEnd = (e) => {
        if (touchStart.current === null || touchStartY.current === null) return;

        const touchEnd = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const xDistance = touchStart.current - touchEnd;
        const yDistance = touchStartY.current - touchEndY;

        touchStart.current = null;
        touchStartY.current = null;

        if (Math.abs(yDistance) >= Math.abs(xDistance)) return; 
        if (Math.abs(xDistance) < 40) return;

        const isLeftSwipe = xDistance > 0;
        const currentIndex = filters.indexOf(activeFilter);
        let nextIndex = currentIndex;

        if (isLeftSwipe) {
            if (currentIndex < filters.length - 1) nextIndex = currentIndex + 1;
        } else {
            if (currentIndex > 0) nextIndex = currentIndex - 1;
        }

        if (nextIndex !== currentIndex) {
            setActiveFilter(filters[nextIndex]);
            const btn = document.getElementById(`filter-btn-${filters[nextIndex]}`);
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    };

    const FilterChip = ({ label }) => {
        const isActive = activeFilter === label;
        return (
            <button 
                id={`filter-btn-${label}`}
                onClick={() => setActiveFilter(label)} 
                className={`
                    flex items-center gap-2 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shrink-0 transition-all rounded-[2px] border snap-start scroll-ml-4
                    ${isActive 
                        ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' 
                        : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'}
                `}
            >
                {label} 
                {statusCounts[label] > 0 && (
                    <span className={`text-[8px] h-[14px] min-w-[14px] px-1 rounded-[2px] font-mono flex items-center justify-center leading-none ${isActive ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-500'}`}>
                        {statusCounts[label]}
                    </span>
                )}
            </button>
        );
    };

    
});
