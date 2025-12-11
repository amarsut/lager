const servicePaket = {
    'oljebyte': {
        // Grundpris för arbete (som alltid är 500 kr för oljebyte enligt din beskrivning)
        arbetskostnad: 500, 
        
        // Beskrivning som syns
        kommentar: 'Oljebyte ',
        
        // Lista på material som ingår
        material: [
            { 
                id: 'motorolja',
                typ: 'flytande',       // Signalerar att vi ska fråga om liter
                namn: 'Motorolja', 
                prisKundPerLiter: 200, // Vad kunden betalar (200 kr/l)
                prisInkopPerLiter: 65  // Vad du betalar (65 kr/l)
            },
            { 
                id: 'oljefilter',
                typ: 'fast',           // Fast pris
                namn: 'Oljefilter', 
                prisKund: 200,         // Vad kunden betalar
                prisInkop: 80          // Gissat inköpspris (du kan ändra detta)
            }
        ]
    },
    'hjulskifte': {
        arbetskostnad: 200, // Fast pris för arbetet
        kommentar: 'Hjulskifte.',
        material: [] // Inga delar behövs
    },
    'felsokning': {
        arbetskostnad: 500,
        kommentar: 'Felsökning.',
        material: []
    }
};
