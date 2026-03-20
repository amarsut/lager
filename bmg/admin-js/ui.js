export function initUI() {
    setupTheme();
    setupMenuAndTabs();
}

function setupTheme() {
    const htmlEl = document.documentElement;
    if (localStorage.getItem('theme') === 'light' || (!('theme' in localStorage) && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlEl.classList.remove('dark');
    } else {
        htmlEl.classList.add('dark');
    }

    document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
        htmlEl.classList.toggle('dark');
        localStorage.setItem('theme', htmlEl.classList.contains('dark') ? 'dark' : 'light');
        if(window.processDashboard && window.AppState?.inventory?.length) window.processDashboard(window.AppState.inventory);
    });
}

function setupMenuAndTabs() {
    // Mobilmeny (Slide-in Drawer)
    const sidebar = document.getElementById('sidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    
    const toggleMenu = () => {
        const isOpen = !sidebar.classList.contains('-translate-x-full');
        if (isOpen) {
            sidebar.classList.add('-translate-x-full');
            backdrop.classList.add('opacity-0');
            setTimeout(() => backdrop.classList.add('hidden'), 300);
        } else {
            backdrop.classList.remove('hidden');
            void backdrop.offsetWidth; 
            sidebar.classList.remove('-translate-x-full');
            backdrop.classList.remove('opacity-0');
        }
    };

    document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMenu);
    backdrop?.addEventListener('click', toggleMenu);

    // NYTT: Fäll ihop menyn på Dator
    const desktopToggle = document.getElementById('desktopMenuToggle');
    
    desktopToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        // Byt ikon beroende på om den är öppen eller stängd
        if(sidebar.classList.contains('collapsed')) {
            desktopToggle.innerHTML = '<i data-lucide="panel-left-open" class="w-5 h-5"></i>';
        } else {
            desktopToggle.innerHTML = '<i data-lucide="panel-left-close" class="w-5 h-5"></i>';
        }
        if(window.lucide) window.lucide.createIcons();
        
        // Tvinga graferna att rita om sig så de anpassar sig till den nya ytan
        setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 300);
    });

    // Flikar
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            if(!target) return;
            
            if(window.innerWidth < 1024) toggleMenu();
            
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${target}`).classList.add('active');

            // Viktigt för provkörningens rityta
            if(target === 'testdrive' && window.initSignatureCanvas) {
                setTimeout(window.initSignatureCanvas, 150);
            }
        });
    });

    // Stäng Modaler med Escape & Klick utanför
    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape') window.closeAllModals(); 
    });
    
    document.querySelectorAll('.fixed.inset-0:not(#sidebarBackdrop)').forEach(modal => {
        modal.addEventListener('click', e => { 
            if (e.target === modal) window.closeModal(modal.id); 
        });
    });
    
    document.querySelectorAll('.closeModalBtn').forEach(btn => {
        btn.addEventListener('click', e => window.closeModal(e.target.closest('.fixed.inset-0').id));
    });

    document.getElementById('btnCopyPhone')?.addEventListener('click', () => window.copyToClipboard('modalLeadPhone', 'Telefonnummer kopierat!'));
    document.getElementById('btnCopyEmail')?.addEventListener('click', () => window.copyToClipboard('modalLeadEmail', 'E-post kopierad!'));
    
    // Save-knappar för CMS
    document.querySelectorAll('.saveSettingsBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            if(window.saveSettings) window.saveSettings();
        });
    });
}