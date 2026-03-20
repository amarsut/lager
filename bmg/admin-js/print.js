import { AppState } from './core.js'; 

export function initPrintSheets() {
    const carSelector = document.getElementById('printCarSelector');
    
    window.populatePrintCars = function() {
        if(!carSelector) return;
        carSelector.innerHTML = '<option value="">-- Klicka här för att välja bil i lagret --</option>';
        if (!AppState.inventory || AppState.inventory.length === 0) return;

        const money = new Intl.NumberFormat('sv-SE');
        AppState.inventory.forEach(car => {
            const option = document.createElement('option');
            option.value = car.id;
            const priceStr = car.price?.value ? `${money.format(car.price.value)} kr` : 'Pris saknas';
            option.textContent = `${car.regNo || 'OKÄND'} - ${car.make} ${car.model} (${priceStr})`;
            carSelector.appendChild(option);
        });
    };

    carSelector?.addEventListener('change', (e) => {
        const car = AppState.inventory.find(c => c.id === e.target.value);
        if(car) {
            const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };
            
            let tillv = car.additionalVehicleData?.manufacturingMonth || car.modelYear?.toString() || '';
            if (tillv.length === 6) tillv = tillv.substring(0, 4) + '-' + tillv.substring(4, 6);
            setVal('vd_tillv', tillv);

            setVal('vd_firstreg', car.regDate ? car.regDate.split('T')[0] : '');
            setVal('vd_kw', car.additionalVehicleData?.engineEffectKw || car.enginePower || '');
            setVal('vd_hkr', car.additionalVehicleData?.engineEffectHp || '');
            setVal('vd_co2', car.co2Emissions || car.additionalVehicleData?.fuels?.[0]?.co2Emissions || '');
            setVal('vd_euro', car.additionalVehicleData?.enviromentClass || 'Euro 6');
            
            const carColor = car.freetextColor || car.color || car.colorGroup || 'Se bil';
            const cColor = document.getElementById('print_color');
            if(cColor) cColor.textContent = carColor;
        }
    });

    const btnPrintPrice = document.getElementById('btnPrintPrice');
    const btnPrintVD = document.getElementById('btnPrintVD');

    btnPrintPrice?.addEventListener('click', () => {
        if (!carSelector.value) return alert("Välj en bil i listan först!");
        triggerPrintPriceTag(carSelector.value);
    });

    btnPrintVD?.addEventListener('click', async () => {
        if (!carSelector.value) return alert("Välj en bil i listan först!");
        const car = AppState.inventory.find(c => c.id === carSelector.value);
        
        const originalText = btnPrintVD.innerHTML;
        btnPrintVD.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 mr-2 animate-spin"></i> Skapar PDF...';
        btnPrintVD.disabled = true;
        
        try {
            await generatePerfectPDF(car);
        } finally {
            btnPrintVD.innerHTML = originalText;
            btnPrintVD.disabled = false;
        }
    });
}

// HÄR ÄR FUNKTIONEN SOM INVENTORY LETAR EFTER
export function triggerPrintPriceTag(carId) {
    updateHiddenTemplates(carId);
    window.print();
}

function updateHiddenTemplates(overrideCarId) {
    const carId = overrideCarId || document.getElementById('printCarSelector')?.value;
    if (!carId) return;

    const car = AppState.inventory.find(c => c.id === carId);
    if(!car) return;

    const formatter = new Intl.NumberFormat('sv-SE');
    const fuel = car.fuels?.[0]?.name || car.fuel || '-';
    const gear = car.gearBox || '-';
    const price = car.price?.value || 0;
    const fullModel = `${car.make || ''} ${car.model || ''}`;
    const carColor = car.freetextColor || car.color || car.colorGroup || 'Se bil';

    const setTxt = (id, text) => { const el = document.getElementById(id); if(el) el.textContent = text; };
    const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
    const getNum = (id, def) => { const val = getVal(id); return val !== '' ? Number(val) : def; };

    const downpayPercent = getNum('p_downpay', 20);
    const interest = getNum('p_interest', 4.95);
    const months = getNum('p_months', 72);
    const residualPercent = getNum('p_residual', 0);

    const monthlyInterest = (interest / 100) / 12;
    const loanAmount = price - (price * (downpayPercent / 100));
    const residualAmount = price * (residualPercent / 100);
    
    let monthlyCost = 0;
    if (monthlyInterest === 0) {
        monthlyCost = (loanAmount - residualAmount) / months;
    } else {
        const pvFactor = Math.pow(1 + monthlyInterest, -months);
        monthlyCost = (loanAmount - (residualAmount * pvFactor)) * (monthlyInterest / (1 - pvFactor));
    }

    setTxt('print_model', fullModel);
    setTxt('print_make', car.make || '-');
    setTxt('print_year', car.modelYear || '-');
    setTxt('print_reg', car.regNo || '-');
    setTxt('print_milage', car.milage ? `${formatter.format(car.milage)} mil` : '-');
    setTxt('print_gear', gear);
    setTxt('print_fuel', fuel);
    setTxt('print_color', carColor);
    setTxt('print_body', car.bodyType || 'Se bil');

    const eqList = document.getElementById('print_equipment');
    if(eqList) {
        if (car.equipment && car.equipment.length > 0) {
            eqList.innerHTML = car.equipment.slice(0, 24).map(eq => `<li>${eq}</li>`).join('');
        } else {
            eqList.innerHTML = '<li>Se specifikation på nätet</li>';
        }
    }

    setTxt('print_downpay', `${downpayPercent}%`);
    setTxt('print_interest', `${interest}%`);
    setTxt('print_months', `${months} mån`);
    setTxt('print_residual', `${residualPercent}%`);
    setTxt('print_price', `${formatter.format(price)} kr`);
    setTxt('print_monthly', `${formatter.format(Math.round(monthlyCost))} kr`);
}

async function generatePerfectPDF(car) {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;

    try {
        const url = 'varudeklaration.pdf'; 
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        const colorBlack = rgb(0, 0, 0);
        
        const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        firstPage.drawText('BMG', { x: 45, y: 775, size: 38, font: fontItalic, color: colorBlack });
        firstPage.drawText('M O T O R G R U P P', { x: 47, y: 760, size: 10, font: fontBold, color: colorBlack });

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };
        const getCheckHTML = (id) => { const el = document.getElementById(id); return el ? el.checked : false; };

        const setTxt = (pdfName, value) => {
            try { if(value && value !== '-') form.getTextField(pdfName).setText(value.toString()); } catch(e) {}
        };
        const setChk = (pdfName, condition) => {
            try { if(condition) form.getCheckBox(pdfName).check(); } catch(e) {}
        };

        const fullModel = `${car.make || ''} ${car.model || ''}`;
        const milageText = car.milage ? `${car.milage} mil` : '';
        const fuel = (car.fuels?.[0]?.name || car.fuel || '').toLowerCase();
        const gear = (car.gearBox || '').toLowerCase();

        setTxt('Fabrikattyp', fullModel);
        setTxt('Regnr', car.regNo);
        setTxt('Matarstallning_km', milageText); 
        setTxt('Tillverkningsar_och_manad', getVal('vd_tillv'));
        setTxt('modellar', car.modelYear);
        setTxt('Forsta_reg_datum_i_Sverige', getVal('vd_firstreg'));
        setTxt('motoreffekt_kW', getVal('vd_kw'));
        setTxt('hKr', getVal('vd_hkr'));
        setTxt('koldioxidutslapp', getVal('vd_co2'));
        setTxt('MiljoklassEuroklassning', getVal('vd_euro'));

        setChk('Registrerad_utanför_Sverige', getCheckHTML('vd_imported'));
        setChk('Checkruta_reg_utanför_sverige', getCheckHTML('vd_imported'));

        setChk('bensin', fuel.includes('bensin') && !fuel.includes('hybrid'));
        setChk('diesel', fuel.includes('diesel'));
        setChk('etanol', fuel.includes('etanol'));
        setChk('el', fuel === 'el' || fuel.includes(' el ')); 
        setChk('hybrid', fuel.includes('hybrid') && !fuel.includes('ladd'));
        setChk('laddhybrid', fuel.includes('ladd'));
        setChk('gas', fuel.includes('gas'));

        setChk('automat', gear.includes('auto'));
        setChk('manuell', gear.includes('man'));

        const kamrem = getVal('vd_kamrem');
        setChk('ja_senast_vid', kamrem === 'Ja'); 
        setChk('nej', kamrem === 'Nej');
        setChk('vet_ej', kamrem === 'Vet ej');
        setChk('finns_ej', kamrem === 'Finns ej');
        setTxt('Kamrem_km', getVal('vd_kamrem_km'));
        setTxt('Datum', getVal('vd_kamrem_date')); 

        const service = getVal('vd_servicebok');
        setChk('ja_senaste_vid_2', service === 'Ja'); 
        setChk('nej_2', service === 'Nej');
        setTxt('Servicebok_km', getVal('vd_service_km'));
        setTxt('Servicebok_datum', getVal('vd_service_date'));

        setTxt('Datum_2', getVal('vd_inspection'));
        setTxt('Matarstallning', getVal('vd_inspection_milage'));
        setTxt('Arlig_fordonsskatt', getVal('vd_tax'));

        const nybilDatum = getVal('vd_nybil_garanti');
        const nybilKm = getVal('vd_nybil_km');
        const mrfManader = getVal('vd_mrf_manader');
        const mrfKm = getVal('vd_mrf_km');
        const vagnskadaDatum = getVal('vd_vagnskada_datum');
        const trafikManader = getVal('vd_trafik_manader');
        const trafikKm = getVal('vd_trafik_km');
        
        setTxt('nybilsgaranti_datum', nybilDatum);
        setTxt('nybilsgaranti_km', nybilKm); 
        setTxt('MRF_antal_manader', mrfManader);
        setTxt('MRF_eller_max_km', mrfKm);
        setTxt('vagnskadegaranti_datum', vagnskadaDatum);
        setTxt('trafiksakerhet_manader', trafikManader);
        setTxt('Trafiksakerhet_eller_max_km', trafikKm);

        setChk('ja', nybilDatum || nybilKm); 
        setChk('nej_3', !(nybilDatum || nybilKm));
        setChk('ja_2', mrfManader || mrfKm);
        setChk('nej_4', !(mrfManader || mrfKm));
        setChk('ja_4', vagnskadaDatum);
        setChk('nej_6', !vagnskadaDatum);
        setChk('ja_5', trafikManader || trafikKm);
        setChk('nej_7', !(trafikManader || trafikKm));

        setTxt('Bedömning_1', getVal('i_cond_a') || 'N');
        setTxt('Bedömning_2', getVal('i_cond_b') || 'N');
        setTxt('C_Slutvaxel_drivaxlar_drivknutar', getVal('i_cond_c') || 'N');
        setTxt('Bedomning_1_2', getVal('i_cond_d') || 'N');
        setTxt('Bedomning_2_2', getVal('i_cond_e') || 'N');
        setTxt('Bedomning_3', getVal('i_cond_f') || 'N');
        setTxt('Bedomning_4', getVal('i_cond_g') || 'N');
        setTxt('D_Varme_varmeflakt_varmesits_1', getVal('i_cond_h') || 'N');
        setTxt('D_Varme_varmeflakt_varmesits_2', getVal('i_cond_i') || 'N');
        setTxt('D_Varme_varmeflakt_varmesits_3', getVal('i_cond_j') || 'N');
        setTxt('D_Varme_varmeflakt_varmesits_4', getVal('i_cond_k') || 'N');
        setTxt('L_Lack_kaross_interior_1', getVal('i_cond_l') || 'N');
        setTxt('L_Lack_kaross_interior_2', getVal('i_cond_m') || 'N');
        setTxt('N_Fonsterhissar_speglar', getVal('i_cond_n') || 'N');
        setTxt('Bedomning', getVal('i_cond_o') || 'N');
        setTxt('P_Manaverdisplay_sakerhetssystem_1', getVal('i_cond_p') || 'N');
        setTxt('P_Manaverdisplay_sakerhetssystem_2', getVal('i_cond_q') || 'N');
        setTxt('P_Manaverdisplay_sakerhetssystem_3', getVal('i_cond_r') || '-');

        setChk('STOMME', getCheckHTML('i_sec_1'));
        setChk('HJULSYSTEM', getCheckHTML('i_sec_2'));
        setChk('DRIVSYSTEM', getCheckHTML('i_sec_3'));
        setChk('BROMSSYSTEM', getCheckHTML('i_sec_4'));
        setChk('STYRSYSTEM', getCheckHTML('i_sec_5'));
        setChk('KAROSSERI', getCheckHTML('i_sec_6'));
        setChk('KOMMUNIKATION', getCheckHTML('i_sec_7'));
        setChk('INSTRUMENTERING', getCheckHTML('i_sec_8'));
        setChk('OVR_ANORDNINGAR', getCheckHTML('i_sec_9'));
        setChk('MILJOKONTROLL', getCheckHTML('i_sec_10'));
        setChk('Bilens_sakerhet_overrensstammer_med_resultatet_i_bifogat', getCheckHTML('i_sec_12'));

        const vf = getVal('i_tire_vf');
        const hf = getVal('i_tire_hf');
        const vb = getVal('i_tire_vb');
        const hb = getVal('i_tire_hb');
        setTxt('Sommardack_VF', vf);
        setTxt('Sommardack_HF', hf);
        setTxt('Sommardack_VB', vb);
        setTxt('Sommardack_HB', hb);

        const v_vf = getVal('i_tire_v_vf');
        const v_hf = getVal('i_tire_v_hf');
        const v_vb = getVal('i_tire_v_vb');
        const v_hb = getVal('i_tire_v_hb');
        setTxt('Vinterdack_VF', v_vf); setTxt('Vinterdack_1', v_vf);
        setTxt('Vinterdack_HF', v_hf); setTxt('Vinterdack_2', v_hf);
        setTxt('Vinterdack_VB', v_vb);
        setTxt('Vinterdack_HB', v_hb);

        if(vf || hf || vb || hb || v_vf || v_hf || v_vb || v_hb) {
            setChk('DACK_MONSTERDJUP_MM', true);
        }

        setTxt('NOTERINGAR_OCH_OVRIGA_UPPLYSNINGAR_1', getVal('vd_notes'));

        const isRepObj = getCheckHTML('vd_reparation');
        setChk('BILEN_SALJS_SOM_REPARATIONS', isRepObj);
        
        const repNotes = getVal('vd_reparation_notes');
        setTxt('Orsaker_till_att_bilen_saljs_som_reparations', repNotes);
        setTxt('renoveringsobjekt_1', repNotes); 

        setChk('Bilen_bedoms_som_trafikfarlig_och_far', getCheckHTML('vd_trafikfarlig'));

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');

    } catch (error) {
        console.error("Kunde inte generera PDF:", error);
        alert("Ett fel uppstod när PDF:en skulle skapas. Kontrollera att filen heter varudeklaration.pdf");
    }
}