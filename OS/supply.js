import React, { useMemo, useState } from 'react';

// FÖRBÄTTRING 1: Stöd för decimaler och lokala inställningar
const formatLitres = (val) => Number(val).toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' L';

const SupplyView = ({ jobs = [], supplies = [] }) => {
  const [lowStockThreshold] = useState(5); // FÖRBÄTTRING 2: Inställningsbar varningsgräns

  // 1. Hämta senaste oljeinköpet
  const latestOilPurchase = useMemo(() => {
    if (!Array.isArray(supplies)) return null;
    return [...supplies]
      .filter(s => (s.item === 'motorolja' || s.typ === 'olja'))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [supplies]);

  // 2. Beräkna status
  const oilStatus = useMemo(() => {
    if (!latestOilPurchase) return null;

    const purchaseDate = new Date(latestOilPurchase.date).getTime();
    const initialVolume = parseFloat(latestOilPurchase.mangd) || 0;

    // FÖRBÄTTRING 3: Detaljerad historiklogg för transparens
    const usageHistory = [];
    
    const totalUsed = jobs.reduce((acc, job) => {
      const jobDate = new Date(job.createdAt).getTime();

      if (jobDate >= purchaseDate) {
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        const oilInJob = jobUtgifter
          .filter(u => u.typ === 'olja')
          .reduce((sum, u) => sum + (parseFloat(u.mangd) || 0), 0);
        
        if (oilInJob > 0) {
          usageHistory.push({ 
            id: job.id, 
            customer: job.kund || 'Okänd kund', 
            amount: oilInJob,
            date: job.createdAt 
          });
        }
        return acc + oilInJob;
      }
      return acc;
    }, 0);

    const currentVolume = initialVolume - totalUsed;
    
    return {
      initialVolume,
      totalUsed,
      currentVolume,
      purchaseDate: latestOilPurchase.date,
      usageHistory,
      // FÖRBÄTTRING 4: Prognos - Hur många snittjobb till räcker oljan?
      avgPerJob: totalUsed / (usageHistory.length || 1),
      isLow: currentVolume <= lowStockThreshold
    };
  }, [jobs, latestOilPurchase, lowStockThreshold]);

  if (!oilStatus) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-xl text-gray-400">
        Ingen registrerad oljebehållare hittades efter 2025-11-22.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* FÖRBÄTTRING 5: Visuell varningsbanner vid lågt lager */}
      {oilStatus.isLow && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4 animate-pulse">
          <p className="text-red-700 font-bold">⚠️ VARNING: Lågt oljelager! Beställ ny olja omgående.</p>
        </div>
      )}

      {/* Huvudkort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* FÖRBÄTTRING 6: Infokort med "Kvar"-status som prioritet */}
        <div className={`p-6 rounded-2xl shadow-sm border ${oilStatus.isLow ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wider">Aktuellt Lager</h3>
          <p className={`text-4xl font-black mt-2 ${oilStatus.isLow ? 'text-red-600' : 'text-blue-900'}`}>
            {formatLitres(oilStatus.currentVolume)}
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Förbrukat</h3>
          <p className="text-2xl font-bold text-gray-700 mt-2">-{formatLitres(oilStatus.totalUsed)}</p>
          <p className="text-xs text-gray-400 mt-1">Sedan {oilStatus.purchaseDate}</p>
        </div>

        {/* FÖRBÄTTRING 7: Prognos-kort */}
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Estimerad räckvidd</h3>
          <p className="text-2xl font-bold text-gray-700 mt-2">
            ~{Math.floor(oilStatus.currentVolume / (oilStatus.avgPerJob || 1))} jobb
          </p>
          <p className="text-xs text-gray-400 mt-1">Baserat på snitt {formatLitres(oilStatus.avgPerJob)}/jobb</p>
        </div>
      </div>

      {/* FÖRBÄTTRING 8: Grafisk mätare (Progress Bar) */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between mb-2 items-end">
          <span className="text-sm font-medium text-gray-500">Behållare (Inköpt {oilStatus.initialVolume} L)</span>
          <span className="text-sm font-bold">{Math.round((oilStatus.currentVolume / oilStatus.initialVolume) * 100)}% kvar</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${oilStatus.isLow ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${Math.max(0, (oilStatus.currentVolume / oilStatus.initialVolume) * 100)}%` }}
          />
        </div>
      </div>

      {/* FÖRBÄTTRING 9: Specifik historiklista för oljeanvändning */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-bold text-gray-700">Senaste avdragen (Olja)</h3>
        </div>
        <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
          {oilStatus.usageHistory.reverse().map((entry) => (
            <div key={entry.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
              <div>
                <p className="font-medium text-gray-800">{entry.customer}</p>
                <p className="text-xs text-gray-400">{entry.date}</p>
              </div>
              <span className="font-mono font-bold text-red-500">-{formatLitres(entry.amount)}</span>
            </div>
          ))}
          {oilStatus.usageHistory.length === 0 && (
            <p className="p-8 text-center text-gray-400 italic">Inga jobb registrerade efter inköpsdatum.</p>
          )}
        </div>
      </div>

      {/* FÖRBÄTTRING 10: Snabbsaldo-footer */}
      <div className="text-center">
        <p className="text-[10px] text-gray-300 uppercase tracking-widest">
          System ID: OIL-TRACKER-2026-V2 | Decimal-Safe: Enabled
        </p>
      </div>
    </div>
  );
};

export default SupplyView;
