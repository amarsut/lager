window.SupplyView = function({ jobs = [], supplies = [] }) {
  
  // --- KONFIGURATION (Om databasen är tom) ---
  const MANUAL_PURCHASE = {
    date: '2025-11-22',
    amount: 20.0 // Ändra till mängden du köpte (t.ex. 20 eller 20.5)
  };

  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'string') val = val.replace(',', '.');
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const formatLitre = (n) => n.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' L';

  const oilData = React.useMemo(() => {
    // 1. Försök hitta olja i supplies, annars använd MANUAL_PURCHASE
    let latestPurchase = Array.isArray(supplies) && supplies.length > 0 
      ? supplies.find(s => JSON.stringify(s).toLowerCase().includes('olja'))
      : null;

    // Om inget hittas i supplies, använd våra fasta värden
    if (!latestPurchase) {
      latestPurchase = { 
        date: MANUAL_PURCHASE.date, 
        mangd: MANUAL_PURCHASE.amount,
        isManual: true 
      };
    }

    const purchaseDate = new Date(latestPurchase.date || latestPurchase.datum).getTime();
    const initialVolume = parseNum(latestPurchase.mangd || latestPurchase.volym);
    
    // 2. Beräkna förbrukning (Hanterar 4.3 L osv)
    const usageHistory = [];
    const totalUsed = (Array.isArray(jobs) ? jobs : []).reduce((acc, job) => {
      const jobDate = new Date(job.createdAt || job.date || job.datum).getTime();
      
      // LOGIK: Endast jobb EFTER inköpsdatum
      if (jobDate >= purchaseDate) {
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        const oilInJob = jobUtgifter
          .filter(u => JSON.stringify(u).toLowerCase().includes('olja'))
          .reduce((sum, u) => sum + parseNum(u.mangd || u.volym), 0);
        
        if (oilInJob > 0) {
          usageHistory.push({
            id: job.id || Math.random(),
            name: job.kund || 'Servicejobb',
            date: job.createdAt || job.date || 'Datum saknas',
            amount: oilInJob
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
      date: latestPurchase.date,
      history: usageHistory,
      isLow: currentVolume < 5,
      isManual: latestPurchase.isManual,
      avgPerJob: totalUsed / (usageHistory.length || 1)
    };
  }, [jobs, supplies]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '500px', margin: '0 auto', background: '#fcfcfc', padding: '15px', borderRadius: '20px' }}>
      
      {/* 1. STATUSKORT (Visar 4.3 L precision) */}
      <div style={{
        background: oilData.isLow ? '#fffaf0' : '#ebf8ff',
        padding: '30px 20px', borderRadius: '18px', border: `2px solid ${oilData.isLow ? '#fbd38d' : '#90cdf4'}`,
        textAlign: 'center', marginBottom: '15px'
      }}>
        <div style={{ fontSize: '12px', color: '#4a5568', fontWeight: 'bold', letterSpacing: '1px' }}>Lagerstatus (Motorolja)</div>
        <div style={{ fontSize: '50px', fontWeight: '900', color: '#2a4365', margin: '10px 0' }}>
          {formatLitre(oilData.currentVolume)}
        </div>
        {/* 2. PROGRESS BAR */}
        <div style={{ width: '100%', height: '10px', background: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${(oilData.currentVolume / oilData.initialVolume) * 100}%`, height: '100%', background: oilData.isLow ? '#ed8936' : '#4299e1', transition: 'width 1s' }} />
        </div>
      </div>

      {/* 3. INFO-RADER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: '10px', color: '#a0aec0' }}>INKÖPT {oilData.date}</div>
          <div style={{ fontWeight: 'bold' }}>{formatLitre(oilData.initialVolume)}</div>
        </div>
        <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: '10px', color: '#a0aec0' }}>SNITT / JOBB</div>
          <div style={{ fontWeight: 'bold' }}>{formatLitre(oilData.avgPerJob)}</div>
        </div>
      </div>

      {/* 4. VARNING VID MANUELL DATA */}
      {oilData.isManual && (
        <div style={{ fontSize: '11px', color: '#718096', textAlign: 'center', marginBottom: '10px', fontStyle: 'italic' }}>
          Obs: Visar reservdata då inget inköp hittades i databasen.
        </div>
      )}

      {/* 5. LOGG ÖVER FÖRBRUKNING */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ padding: '10px 15px', background: '#f7fafc', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #edf2f7' }}>
          Uttag registrerade efter inköp
        </div>
        <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
          {oilData.history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#cbd5e0', fontSize: '12px' }}>Inga jobb hittade efter {oilData.date}</div>
          ) : (
            oilData.history.slice().reverse().map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', borderBottom: '1px solid #f7fafc' }}>
                <span style={{ fontSize: '13px' }}>{item.name}</span>
                <span style={{ fontWeight: 'bold', color: '#e53e3e', fontSize: '13px' }}>-{formatLitre(item.amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 10 FÖRBÄTTRINGAR: 
          1. Hanterar 4.3 L (decimaler)
          2. Datumfiltrering (start 22 nov)
          3. Manuell reservplan om databasen är tom
          4. Färgkodat gränssnitt
          5. Progress bar
          6. Snittförbrukning per jobb
          7. Uttagslogg med kundnamn
          8. Ingen krasch vid tom data (white screen fix)
          9. Mobilvänlig design
          10. Automatisk konvertering av komma till punkt (4,3 -> 4.3)
      */}
    </div>
  );
};
