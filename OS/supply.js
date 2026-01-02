window.SupplyView = function({ jobs = [], supplies = [] }) {
  
  // HJÄLPFUNKTION: Hanterar 4.3, 4,3 och textsträngar
  const parseNum = (val) => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'string') val = val.replace(',', '.');
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const formatLitre = (n) => n.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' L';

  // 1. DETEKTIV-LOGIK: Hitta oljan oavsett vad fälten heter
  const oilData = React.useMemo(() => {
    if (!Array.isArray(supplies)) return null;

    // Vi letar efter objekt som innehåller "olja" i något fält
    const allOilPurchases = supplies.filter(s => {
      const searchString = JSON.stringify(s).toLowerCase();
      return searchString.includes('olja');
    });

    if (allOilPurchases.length === 0) return null;

    // Sortera för att få det senaste inköpet
    const latestPurchase = allOilPurchases.sort((a, b) => {
      const dateA = new Date(a.date || a.datum || a.createdAt || 0);
      const dateB = new Date(b.date || b.datum || b.createdAt || 0);
      return dateB - dateA;
    })[0];

    const purchaseDate = new Date(latestPurchase.date || latestPurchase.datum || latestPurchase.createdAt).getTime();
    
    // Gissa vilket fält som är mängden (mangd, volym, quantity etc)
    const initialVolume = parseNum(latestPurchase.mangd || latestPurchase.volym || latestPurchase.amount || latestPurchase.quantity);
    
    // 2. BERÄKNA FÖRBRUKNING (Efter inköpsdatum)
    const usageHistory = [];
    const totalUsed = jobs.reduce((acc, job) => {
      const jobDate = new Date(job.createdAt || job.date || job.datum).getTime();
      
      if (jobDate >= purchaseDate) {
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        const oilInJob = jobUtgifter
          .filter(u => JSON.stringify(u).toLowerCase().includes('olja'))
          .reduce((sum, u) => sum + parseNum(u.mangd || u.volym || u.amount), 0);
        
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
      date: latestPurchase.date || latestPurchase.datum || 'Okänt datum',
      history: usageHistory,
      isLow: currentVolume < 5,
      isCritical: currentVolume < 2,
      avgPerJob: totalUsed / (usageHistory.length || 1)
    };
  }, [jobs, supplies]);

  // DIAGNOS-VY: Om ingen olja hittas, visa vad som faktiskt finns i supplies
  if (!oilData) {
    return (
      <div style={{padding: '20px', border: '2px dashed #ccc', borderRadius: '10px', background: '#f9f9f9'}}>
        <h3 style={{color: '#d32f2f'}}>Ingen olja hittades i datan</h3>
        <p style={{fontSize: '13px'}}>Systemet letade i <strong>{supplies.length}</strong> st artiklar.</p>
        <p style={{fontSize: '12px', color: '#666'}}>Kontrollera att ordet "olja" finns med i namnet/typen när du registrerar inköpet.</p>
        <details style={{marginTop: '10px', fontSize: '10px'}}>
          <summary>Visa teknisk data (för felsökning)</summary>
          <pre>{JSON.stringify(supplies, null, 2)}</pre>
        </details>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '500px', margin: '0 auto' }}>
      
      {/* 1. Huvudmätare (Kvar i lager) */}
      <div style={{
        background: oilData.isCritical ? '#fff5f5' : '#f0f7ff',
        padding: '25px', borderRadius: '20px', border: `2px solid ${oilData.isCritical ? '#feb2b2' : '#bee3f8'}`,
        textAlign: 'center', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
      }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#63b3ed', uppercase: 'true', letterSpacing: '1px' }}>AKTUELL VOLYM</span>
        <div style={{ fontSize: '48px', fontWeight: '900', color: oilData.isCritical ? '#e53e3e' : '#2c5282', margin: '10px 0' }}>
          {formatLitre(oilData.currentVolume)}
        </div>
        {/* 2. Progress bar */}
        <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', marginTop: '15px' }}>
          <div style={{ 
            width: `${Math.max(5, (oilData.currentVolume / oilData.initialVolume) * 100)}%`, 
            height: '100%', background: oilData.isLow ? '#f6ad55' : '#4299e1', transition: 'width 1s ease-out' 
          }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        {/* 3. Inköpsdetaljer */}
        <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: '10px', color: '#a0aec0' }}>SENASTE INKÖP</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{oilData.date}</div>
          <div style={{ fontSize: '12px', color: '#718096' }}>Basmängd: {formatLitre(oilData.initialVolume)}</div>
        </div>
        {/* 4. Prognos */}
        <div style={{ background: '#fff', padding: '15px', borderRadius: '15px', border: '1px solid #edf2f7' }}>
          <div style={{ fontSize: '10px', color: '#a0aec0' }}>RÄCKER TILL CA</div>
          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{Math.floor(oilData.currentVolume / (oilData.avgPerJob || 1))} jobb</div>
          <div style={{ fontSize: '12px', color: '#718096' }}>Snitt: {formatLitre(oilData.avgPerJob)}</div>
        </div>
      </div>

      {/* 5. Historik-lista */}
      <div style={{ background: '#fff', borderRadius: '15px', border: '1px solid #edf2f7', overflow: 'hidden' }}>
        <div style={{ padding: '12px 15px', background: '#f7fafc', borderBottom: '1px solid #edf2f7', fontSize: '12px', fontWeight: 'bold' }}>
          FÖRBRUKNINGSLOGG (Decimal-stöd aktivt)
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {oilData.history.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#a0aec0', fontSize: '12px' }}>Inga avdrag gjorda efter {oilData.date}</div>
          ) : (
            oilData.history.reverse().map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', borderBottom: '1px solid #f7fafc' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '500' }}>{item.name}</div>
                  <div style={{ fontSize: '10px', color: '#a0aec0' }}>{item.date}</div>
                </div>
                <div style={{ fontWeight: 'bold', color: '#e53e3e', fontSize: '13px' }}>-{formatLitre(item.amount)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 10 Förbättringar i korthet:
          1. Decimal-hantering (4.3 L)
          2. Auto-detektering av fältnamn
          3. Diagnos-läge vid fel
          4. Progress bar med färgskala
          5. Prognos (hur många jobb kvar)
          6. Mobilanpassad design
          7. Snittförbrukning per jobb
          8. Kritiskt lågnivå-larm
          9. Sök-detektiv (hittar 'Olja' i alla fält)
          10. Scrollbar historik för bättre överblick
      */}
    </div>
  );
};
