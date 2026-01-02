window.SupplyView = function({ jobs = [], supplies = [] }) {
  
  // --- TEMAFÄRGER (Matchar din dashboard) ---
  const COLORS = {
    orange: '#FF6600',
    dark: '#0D0D0D',
    bg: '#F5F5F5',
    border: '#E2E8F0',
    textGray: '#718096'
  };

  const parseNum = (val) => {
    if (!val) return 0;
    if (typeof val === 'string') val = val.replace(',', '.');
    return parseFloat(val) || 0;
  };

  // --- LOGIK: DETEKTERA DATA ---
  const oilData = React.useMemo(() => {
    // 1. Inköpsdatum (22 nov 2025)
    const purchaseDateStr = '2025-11-22';
    const purchaseDate = new Date(purchaseDateStr).getTime();
    const initialVolume = 230.0; // Ändra till din faktiska inköpsmängd

    // 2. Filtrera jobb (Letar specifikt efter deploymentDate från din bild)
    const usageHistory = [];
    const totalUsed = (jobs || []).reduce((acc, job) => {
      // Vi prioriterar DEPLOYMENT_DATE som syns i din UI-bild
      const rawDate = job.deploymentDate || job.date || job.createdAt;
      const jobDate = new Date(rawDate).getTime();
      
      if (jobDate >= purchaseDate) {
        const jobUtgifter = Array.isArray(job.utgifter) ? job.utgifter : [];
        const oilInJob = jobUtgifter
          .filter(u => JSON.stringify(u).toLowerCase().includes('olja'))
          .reduce((sum, u) => sum + parseNum(u.mangd || u.volym || u.amount), 0);
        
        if (oilInJob > 0) {
          usageHistory.push({
            id: job.id || Math.random(),
            customer: job.customer_name || job.kund || 'SYSTEM_MISSION',
            date: rawDate,
            amount: oilInJob
          });
        }
        return acc + oilInJob;
      }
      return acc;
    }, 0);

    return {
      initialVolume,
      totalUsed,
      currentVolume: initialVolume - totalUsed,
      history: usageHistory,
      purchaseDate: purchaseDateStr,
      avg: totalUsed / (usageHistory.length || 1)
    };
  }, [jobs, supplies]);

  // --- UI KOMPONENTEN ---
  return (
    <div style={{ padding: '20px', backgroundColor: '#FFF', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER (Matchar din svarta box-stil) */}
      <div style={{ 
        backgroundColor: COLORS.dark, 
        color: '#FFF', 
        padding: '15px 25px', 
        borderRadius: '4px', 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '25px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          backgroundColor: COLORS.orange, 
          width: '35px', 
          height: '35px', 
          borderRadius: '4px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          marginRight: '15px'
        }}>
          <span style={{ fontWeight: 'bold' }}>+</span>
        </div>
        <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '2px', fontWeight: '800' }}>
          RESOURCE_LOGISTICS // MOTOR_OIL
        </h2>
      </div>

      {/* STATS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        
        {/* Huvudkort: Lager */}
        <div style={{ border: `1px solid ${COLORS.border}`, padding: '20px', borderRadius: '4px', position: 'relative' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.orange, letterSpacing: '1px' }}>
            <span style={{ marginRight: '5px' }}>👤</span> CURRENT_STOCK_LEVEL
          </label>
          <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '10px' }}>
            {oilData.currentVolume.toFixed(1)} <span style={{ fontSize: '16px', color: COLORS.textGray }}>LITRE</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: '#EEE', marginTop: '15px' }}>
            <div style={{ width: `${(oilData.currentVolume / oilData.initialVolume) * 100}%`, height: '100%', background: COLORS.orange }} />
          </div>
        </div>

        {/* Kort: Förbrukning */}
        <div style={{ border: `1px solid ${COLORS.border}`, padding: '20px', borderRadius: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.textGray, letterSpacing: '1px' }}>
            <span style={{ marginRight: '5px' }}>⛽</span> TOTAL_CONSUMPTION
          </label>
          <div style={{ fontSize: '32px', fontWeight: '800', marginTop: '10px', color: '#E53E3E' }}>
            -{oilData.totalUsed.toFixed(1)} <span style={{ fontSize: '16px', color: COLORS.textGray }}>L</span>
          </div>
        </div>

        {/* Kort: Inköp */}
        <div style={{ border: `1px solid ${COLORS.border}`, padding: '20px', borderRadius: '4px' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.textGray, letterSpacing: '1px' }}>
            <span style={{ marginRight: '5px' }}>📅</span> DEPLOYMENT_DATE
          </label>
          <div style={{ fontSize: '24px', fontWeight: '800', marginTop: '10px' }}>
            {oilData.purchaseDate}
          </div>
          <div style={{ fontSize: '11px', color: COLORS.textGray, marginTop: '5px' }}>REGISTERED_BASE: {oilData.initialVolume} L</div>
        </div>
      </div>

      {/* LOGG: Uttag (Samma stil som din Resource Expenses) */}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: '4px' }}>
        <div style={{ padding: '15px 20px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '11px', fontWeight: 'bold', color: COLORS.textGray, letterSpacing: '1px' }}>
            INTERNAL_MISSION_LOGS
          </label>
          <span style={{ color: COLORS.orange, fontSize: '11px', fontWeight: 'bold' }}>+ LÄGG TILL</span>
        </div>
        
        <div style={{ minHeight: '150px' }}>
          {oilData.history.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#A0AEC0', fontSize: '13px', fontStyle: 'italic' }}>
              NO_LOGS_FOUND_AFTER_{oilData.purchaseDate.replace(/-/g, '_')}
            </div>
          ) : (
            oilData.history.reverse().map((entry, idx) => (
              <div key={idx} style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 100px', 
                padding: '15px 20px', 
                borderBottom: `1px solid ${COLORS.bg}`,
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{entry.customer.toUpperCase()}</div>
                <div style={{ fontSize: '12px', color: COLORS.textGray }}>{entry.date}</div>
                <div style={{ textAlign: 'right', fontWeight: 'bold', color: COLORS.orange }}>-{entry.amount.toFixed(1)} L</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: '30px', borderTop: `1px solid ${COLORS.border}`, paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ fontSize: '10px', color: '#BBB', fontWeight: 'bold' }}>PLANERARE // OS // OLJE-LOGISTIK</div>
        <div style={{ fontSize: '10px', color: COLORS.orange, fontWeight: 'bold' }}>STATUS: ENCRYPTED_LINK_ACTIVE</div>
      </div>

    </div>
  );
};
