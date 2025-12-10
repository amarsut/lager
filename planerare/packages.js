// packages.js - Här ställer du in dina fasta priser och paket

const servicePaket = {
    'liten-service': {
        pris: 1995,
        kommentar: 'Byte av olja och filter ingår.',
        utgifter: [
            { namn: 'Motorolja 4L', kostnad: 400 },
            { namn: 'Oljefilter', kostnad: 150 }
        ]
    },
    'stor-service': {
        pris: 4495,
        kommentar: 'Full genomgång, tändstift, alla filter och oljebyte.',
        utgifter: [
            { namn: 'Motorolja 5L', kostnad: 600 },
            { namn: 'Luftfilter', kostnad: 200 },
            { namn: 'Kupéfilter', kostnad: 250 },
            { namn: 'Oljefilter', kostnad: 150 },
            { namn: 'Tändstift x4', kostnad: 800 }
        ]
    },
    'felsokning': {
        pris: 1500,
        kommentar: 'Grundläggande felsökning och diagnos.',
        utgifter: [] // Inga delar som standard
    }
};
