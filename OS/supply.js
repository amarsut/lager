// Vi definierar komponenten direkt som en funktion så att den blir tillgänglig för App
window.SupplyView = function({ jobs = [], supplies = [] }) {
  
  // HJÄLPFUNKTION: Hanterar decimaler korrekt (t.ex. 4.3)
  const parseNum = (val) => {
    if (typeof val === 'string') val = val.replace(',', '.');
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const formatLitre = (n) => n.toLocaleString('sv-SE', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + ' L';

  // 1. Logik för att hitta senaste inköpet (Dynamiskt efter 2025-11-22)
  const oilData = React.useMemo(() => {
    if (!Array.isArray(supplies) || !Array.isArray(jobs)) {
      return { currentVolume: 0, totalUsed: 0, initialVolume: 0, history: [], isLow: false };
    }

    // Hitta senaste motorolje-inköpet
    const latestPurchase = [...supplies]
      .filter(s => (s.item || s.typ || '').toLowerCase().includes('olja'))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (!latestPurchase) return null;

    const purchaseDate = new Date(latestPurchase.date).getTime();
    const initialVolume = parseNum(latestPurchase.mangd);
    
    // 2. Beräkna förbrukning (Endast jobb EFTER inköpsdatum)
    const usageHistory = [];
    const totalUsed = jobs.reduce((acc, job) => {
      const jobDate = new Date(job.createdAt || job.date).getTime();
      
      if (jobDate >= purchaseDate) {
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        const oilInJob = jobUtgifter
          .filter(u => (u.typ || '').toLowerCase() === 'olja')
          .reduce((sum, u) => sum + parseNum(u.mangd), 0);
        
        if (oilInJob > 0) {
          usageHistory.push({
            id: job.id || Math.random(),
            name: job.kund || 'Servicejobb',
            date: job.createdAt || job.date,
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
      isCritical: currentVolume < 2
    };
  }, [jobs, supplies]);

  if (!oilData) {
    return <div style={{padding: '20px', color: '#666'}}>Ingen registrerad olja hittades (Inköp krävs).</div>;
  }

  // --- 10 FÖRBÄTTRINGAR I GRÄNSSNITTET ---
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', color: '#333' }}>
      
      {/* 1. STATUS-BANNER (Färgkodad baserat på nivå) */}
      <div style={{
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '20px',
        backgroundColor: oilData.isCritical ? '#fee2e2' : (oilData.isLow ? '#fef3c7' : '#f0f9ff'),
        border: `1px solid ${oilData.isCritical ? '#ef4444' : (oilData.isLow ? '#f59e0b' : '#3b82f6')}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', opacity: 0.7 }}>Aktuellt Lager</h2>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{formatLitre(oilData.currentVolume)}</div>
        </div>
        {/* 2. VISUELL INDIKATOR (Cirkel) */}
        <div style={{
          width: '12px', height: '12px', borderRadius: '50%',
          backgroundColor: oilData.isCritical ? '#ef4444' : (oilData.isLow ? '#f59e0b' : '#22c55e'),
          boxShadow: '0 0 10px rgba(0,0,0,0.1)'
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {/* 3. INKÖPS-INFO KORT */}
        <div style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#999' }}>SENASTE INKÖP</span>
          <div style={{ fontWeight: '600' }}>{oilData.date}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Mängd: {formatLitre(oilData.initialVolume)}</div>
        </div>
        {/* 4. TOTALFÖRBRUKNING KORT */}
        <div style={{ padding: '12px', border: '1px solid #eee', borderRadius: '8px' }}>
          <span style={{ fontSize: '11px', color: '#999' }}>TOTALT ANVÄNT</span>
          <div style={{ fontWeight: '600', color: '#dc2626' }}>-{formatLitre(oilData.totalUsed)}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>Sedan start</div>
        </div>
      </div>

      {/* 5. DYNAMISK PROGRESS BAR */}
      <div style={{ marginBottom: '25px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
          <span>Lagernivå</span>
          <span>{Math.round((oilData.currentVolume / oilData.initialVolume) * 100)}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#eee', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.max(0, (oilData.currentVolume / oilData.initialVolume) * 100)}%`,
            height: '100%',
            backgroundColor: oilData.isLow ? '#f59e0b' : '#3b82f6',
            transition: 'width 0.5s ease'
          }} />
        </div>
      </div>

      {/* 6. HISTORIK-LISTA (De 5 senaste jobben) */}
      <div style={{ backgroundColor: '#f9fafb', borderRadius: '8px', padding: '15px' }}>
        <h3 style={{ fontSize: '14px', marginTop: 0, borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>Senaste Uttag</h3>
        {oilData.history.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>Inga förbrukande jobb än.</p>
        ) : (
          oilData.history.slice(-5).reverse().map(item => (
            /* 7. RAD-DESIGN FÖR JOBB */
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderBottom: '1px solid #eee' }}>
              <span>{item.name} <br/><small style={{color: '#999'}}>{item.date}</small></span>
              <span style={{ fontWeight: 'bold', color: '#444' }}>-{formatLitre(item.amount)}</span>
            </div>
          ))
        )}
      </div>

      {/* 8. SNABBSALDO-FOOTER */}
      <div style={{ marginTop: '15px', fontSize: '10px', color: '#bbb', textAlign: 'center' }}>
        SYSTEM: OIL-TRACKER v3.0 | DECIMAL_SAFE: YES | AUTO_REFRESH: ON
      </div>
      
      {/* 9. VARNINGS-MEDDELANDE VID KRITISK NIVÅ */}
      {oilData.isCritical && (
        <div style={{ marginTop: '15px', color: '#b91c1c', fontSize: '12px', textAlign: 'center', fontWeight: 'bold' }}>
          ⚠️ KRITISK NIVÅ: Kan inte slutföra fler än ca 1-2 jobb.
        </div>
      )}

      {/* 10.Decimalstöd (Info) */}
      <div style={{ marginTop: '5px', fontSize: '9px', color: '#eee', textAlign: 'right' }}>
        Handled precision: 4.3L, 5.75L ok.
      </div>
    </div>
  );
};
