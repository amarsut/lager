import React, { useMemo } from 'react';

const SupplyView = ({ jobs = [], supplies = [] }) => {
  
  // 1. Hitta det senaste inköpet av olja dynamiskt
  const latestOilPurchase = useMemo(() => {
    return supplies
      .filter(s => s.item === 'motorolja' || s.typ === 'olja')
      // Sortera så att det senaste datumet kommer först
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  }, [supplies]);

  // 2. Beräkna aktuell status baserat på jobb efter inköpsdatumet
  const oilStatus = useMemo(() => {
    // Om inget inköp hittas, returnera nollställda värden
    if (!latestOilPurchase) {
      return { currentVolume: 0, totalUsed: 0, initialVolume: 0 };
    }

    const purchaseDate = new Date(latestOilPurchase.date).getTime();
    const initialVolume = latestOilPurchase.mangd || 0;

    // Filtrera och beräkna förbrukning i ett svep
    const totalUsed = jobs.reduce((acc, job) => {
      const jobDate = new Date(job.createdAt).getTime();

      // Logik: Dra endast av om jobbet skapades efter (eller på) inköpsdagen
      if (jobDate >= purchaseDate) {
        // FELSÄKRING: Använd Optional Chaining och fallback till tom array
        // Detta löser felet "forEach is not a function"
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        
        const oilInJob = jobUtgifter
          .filter(u => u.typ === 'olja')
          .reduce((sum, u) => sum + (Number(u.mangd) || 0), 0);
        
        return acc + oilInJob;
      }
      return acc;
    }, 0);

    return {
      initialVolume,
      totalUsed,
      currentVolume: initialVolume - totalUsed,
      purchaseDate: latestOilPurchase.date
    };
  }, [jobs, latestOilPurchase]);

  // Om data fortfarande laddas eller saknas
  if (!latestOilPurchase) {
    return <div className="p-4">Ingen registrerad olja hittades i systemet.</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Oljestatus</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-500">Senaste inköp</p>
          <p className="text-lg font-semibold">{oilStatus.purchaseDate}</p>
        </div>
        
        <div className="p-4 border rounded">
          <p className="text-sm text-gray-500">Förbrukat (sedan inköp)</p>
          <p className="text-lg font-semibold text-red-600">-{oilStatus.totalUsed} L</p>
        </div>

        <div className="p-4 border rounded bg-blue-50">
          <p className="text-sm text-gray-500">Kvar i lager</p>
          <p className="text-2xl font-bold text-blue-700">{oilStatus.currentVolume} L</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-500" 
            style={{ width: `${Math.max(0, (oilStatus.currentVolume / oilStatus.initialVolume) * 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Baserat på {jobs.length} jobb totalt i systemet.
        </p>
      </div>
    </div>
  );
};

export default SupplyView;
