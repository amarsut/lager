// FinanceModal.js
const { useState } = React;

const FinanceModal = ({ financeCar, setFinanceCar }) => {
    const [calcDownPayment, setCalcDownPayment] = useState(20);
    const [calcMonths, setCalcMonths] = useState(72);

    // Hjälpfunktion för att städa priset
    const parseNumber = (val) => {
        try {
            if (!val) return 0;
            const match = String(val).replace(/\D/g, '');
            const num = parseInt(match, 10);
            return isNaN(num) ? 0 : num;
        } catch (e) {
            return 0;
        }
    };

    const price = parseNumber(financeCar.price);
    const downPaymentAmount = Math.round(price * (calcDownPayment / 100));
    const loanAmount = price - downPaymentAmount;
    
    // Förenklad ränteberäkning
    const monthlyInterest = 0.0795 / 12;
    const monthlyCost = Math.round((loanAmount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -calcMonths)));

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-brand-950/90 backdrop-blur-md" onClick={() => setFinanceCar(null)}></div>
            <div className="relative bg-brand-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-brand-950">
                    <h3 className="text-xl font-black text-white">Lånekalkylator</h3>
                    <button onClick={() => setFinanceCar(null)} className="text-slate-400 hover:text-white">
                        <window.Icon name="x" />
                    </button>
                </div>
                <div className="p-8 space-y-8">
                    <div>
                        <div className="text-brand-500 font-bold mb-1 uppercase text-xs">{financeCar.brand}</div>
                        <div className="text-2xl font-black text-white">{financeCar.model}</div>
                        <div className="text-slate-400">Pris: {financeCar.price}</div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold text-white">
                                <span>Kontantinsats ({calcDownPayment}%)</span>
                                <span className="text-brand-500">{downPaymentAmount.toLocaleString('sv-SE')} kr</span>
                            </div>
                            <input type="range" min="20" max="100" value={calcDownPayment} onChange={(e) => setCalcDownPayment(e.target.value)} className="w-full accent-brand-500 h-2 bg-brand-950 rounded-lg appearance-none cursor-pointer" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-bold text-white">
                                <span>Löptid</span>
                                <span className="text-brand-500">{calcMonths} månader</span>
                            </div>
                            <input type="range" min="12" max="84" step="12" value={calcMonths} onChange={(e) => setCalcMonths(e.target.value)} className="w-full accent-brand-500 h-2 bg-brand-950 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    </div>

                    <div className="bg-brand-950 p-6 rounded-xl border border-brand-500/20 text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Beräknad månadskostnad</div>
                        <div className="text-4xl font-black text-brand-500">
                            {monthlyCost.toLocaleString('sv-SE')} kr
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

window.FinanceModal = FinanceModal;
