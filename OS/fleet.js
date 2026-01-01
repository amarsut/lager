// fleet.js
window.FleetView = () => {
    return (
        <div className="hud-panel p-8">
            <div className="flex items-center gap-2 mb-8 text-zinc-400 border-b border-gray-50 pb-4">
                <window.Icon name="truck" size={18} />
                <span className="text-[12px] font-black uppercase tracking-[0.2em]">Fordonsfleet // Matrix</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-zinc-100 p-4 bg-zinc-50 group hover:border-orange-500 transition-all">
                    <div className="font-mono font-black text-orange-600 text-lg">ABC 123</div>
                    <div className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Registrerad Enhet</div>
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-[8px] font-black uppercase px-2 py-1 bg-black text-white">In Stream</span>
                        <window.Icon name="chevron-right" size={14} className="text-zinc-300 group-hover:text-orange-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};
