const servicePaket = {
    'liten-service': {
        pris: 1995,
        kommentar: 'Byte av olja och filter ingår.',
        utgifter: [
            // HÄR ÄR ÄNDRINGEN: Vi anger ett literpris istället för fast kostnad
            { 
                typ: 'olja',       // Signal till appen att fråga
                namn: 'Motorolja', // Grundnamnet
                prisPerLiter: 200  // Priset per liter
            },
            { namn: 'Oljefilter', kostnad: 150 } // Vanlig fast utgift
        ]
    },
    'stor-service': {
        pris: 4495,
        kommentar: 'Full genomgång, tändstift, alla filter och oljebyte.',
        utgifter: [
            // Samma ändring här
            { 
                typ: 'olja', 
                namn: 'Motorolja', 
                prisPerLiter: 200 
            },
            { namn: 'Luftfilter', kostnad: 200 },
            { namn: 'Kupéfilter', kostnad: 250 },
            { namn: 'Oljefilter', kostnad: 150 },
            { namn: 'Tändstift x4', kostnad: 800 }
        ]
    },
    'felsokning': {
        pris: 1500,
        kommentar: 'Grundläggande felsökning och diagnos.',
        utgifter: []
    }
};
