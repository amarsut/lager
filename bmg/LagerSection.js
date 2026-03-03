const { useState, useEffect, useMemo } = React;

// --- KRASCHSÄKRA HJÄLPFUNKTIONER ---
const parseNumber = (val) => {
    try {
        if (val === null || val === undefined) return 0;
        const match = String(val).replace(/\D/g, '');
        const num = parseInt(match, 10);
        return isNaN(num) ? 0 : num;
    } catch (e) {
        return 0;
    }
};

const calculateMonthlyCost = (priceStr, downPaymentPercent = 0.2, interest = 0.0795, years = 6) => {
    const price = parseNumber(priceStr);
    if (price <= 0) return "0";

    const loanAmount = price * (1 - downPaymentPercent);
    const monthlyInterest = interest / 12;
    const numberOfPayments = years * 12;

    const monthlyPayment = (loanAmount * monthlyInterest) / (1 - Math.pow(1 + monthlyInterest, -numberOfPayments));

    return Math.round(monthlyPayment).toLocaleString('sv-SE');
};

const handleShare = (car) => {
    const shareData = {
        title: `Kolla in denna ${car.brand} ${car.model}!`,
        text: `Jag hittade denna snygga ${car.brand} ${car.model} (${car.year}, ${car.mil}) för ${car.price} hos BMG Motorgrupp.`,
        url: "https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp"
    };

    if (navigator.share) {
        navigator.share(shareData).catch((error) => console.log('Delning avbruten', error));
    } else {
        navigator.clipboard.writeText(`${shareData.text} Länk: ${shareData.url}`);
        alert("Länk och info har kopierats till urklipp. Klistra in för att skicka till en vän!");
    }
};

// --- LIGHTBOX GALLERI (Lyfts ut ur sidan via Portal) ---
const Lightbox = ({ images, initialIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    const nextImg = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevImg = (e) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImg();
            if (e.key === 'ArrowLeft') prevImg();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images]);

    return (
        <div className="fixed inset-0 z-[9999] bg-brand-950/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300" onClick={onClose}>
            <div className="absolute top-4 left-4 z-[100] text-white/80 font-bold tracking-widest text-sm bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                {currentIndex + 1} / {images.length}
            </div>
            
            <button onClick={onClose} className="absolute top-4 right-4 z-[100] w-12 h-12 bg-white/10 hover:bg-brand-500 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md border border-white/10">
                <window.Icon name="x" size={24} />
            </button>

            <div className="flex-1 flex items-center justify-center relative px-4 md:px-16" onClick={(e) => e.stopPropagation()}>
                <button onClick={prevImg} className="absolute left-4 md:left-8 w-12 h-12 md:w-14 md:h-14 bg-black/50 hover:bg-brand-500 border border-white/10 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md z-[100]">
                    <window.Icon name="chevron-left" size={32} />
                </button>
                
                <img 
                    src={images[currentIndex]} 
                    alt="Bilstudie" 
                    className="max-h-[75vh] max-w-full object-contain drop-shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                    key={currentIndex} 
                />

                <button onClick={nextImg} className="absolute right-4 md:right-8 w-12 h-12 md:w-14 md:h-14 bg-black/50 hover:bg-brand-500 border border-white/10 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md z-[100]">
                    <window.Icon name="chevron-right" size={32} />
                </button>
            </div>

            <div className="h-24 md:h-32 bg-black/50 border-t border-white/10 flex items-center px-4 overflow-x-auto gap-2 no-scrollbar" onClick={(e) => e.stopPropagation()}>
                <div className="flex gap-2 mx-auto">
                    {images.map((img, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-16 w-24 md:h-20 md:w-32 rounded-lg overflow-hidden shrink-0 transition-all border border-white/10 ${currentIndex === idx ? 'ring-2 ring-brand-500 opacity-100 scale-105' : 'opacity-40 hover:opacity-100'}`}
                        >
                            <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const CarSkeleton = () => (
    <div className="bg-brand-900/50 rounded-2xl overflow-hidden border border-white/5 shadow-xl animate-pulse">
        <div className="h-64 bg-white/5"></div>
        <div className="p-8">
            <div className="h-4 bg-white/10 rounded w-1/4 mb-3"></div>
            <div className="h-6 bg-white/10 rounded w-3/4 mb-8"></div>
            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded"></div>
            </div>
            <div className="h-12 bg-white/10 rounded w-full mt-4"></div>
        </div>
    </div>
);

const CarCard = ({ car, handleShare, setFinanceCar, calculateMonthlyCost, onOpenGallery }) => {
    const [currentImg, setCurrentImg] = useState(0);
    const [showDesc, setShowDesc] = useState(false);

    const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg((prev) => (prev === car.images.length - 1 ? 0 : prev + 1)); };
    const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setCurrentImg((prev) => (prev === 0 ? car.images.length - 1 : prev - 1)); };

    return (
        <article className="bg-gradient-to-b from-brand-900 to-brand-950 rounded-2xl overflow-hidden border border-white/10 hover:border-brand-500/50 transition-all duration-500 group shadow-2xl hover:shadow-brand-500/10 flex flex-col relative translate-y-0 hover:-translate-y-2">
            
            <div 
                className="h-64 overflow-hidden relative bg-black flex items-center justify-center shrink-0 group/slider cursor-pointer"
                onClick={() => onOpenGallery(car.images, currentImg)}
            >
                <img
                    src={car.images[currentImg]}
                    alt={`${car.brand} ${car.model}`}
                    loading="lazy"
                    className="w-full h-full object-cover opacity-90 group-hover/slider:opacity-100 group-hover/slider:scale-105 transition-all duration-700 ease-out"
                    onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80" }}
                />

                <div className="absolute inset-0 bg-brand-950/20 opacity-0 group-hover/slider:opacity-100 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
                    <div className="bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover/slider:translate-y-0 transition-all duration-300">
                        <window.Icon name="maximize-2" size={16} /> Visa bilder
                    </div>
                </div>

                {car.images.length > 1 && (
                    <>
                        <button onClick={prevImg} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-brand-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-20 hover:scale-110">
                            <window.Icon name="chevron-left" size={20} />
                        </button>
                        <button onClick={nextImg} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-brand-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all duration-300 z-20 hover:scale-110">
                            <window.Icon name="chevron-right" size={20} />
                        </button>
                    </>
                )}

                <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
                    {car.isEco && (
                        <div className="bg-green-500/90 backdrop-blur-sm border border-green-400/50 text-white text-[10px] font-black px-2.5 py-1.5 rounded shadow-lg uppercase tracking-widest w-fit flex items-center gap-1.5">
                            <window.Icon name="leaf" size={12} /> Miljöbil
                        </div>
                    )}
                    {car.hasWarranty && (
                        <div className="bg-blue-500/90 backdrop-blur-sm border border-blue-400/50 text-white text-[10px] font-black px-2.5 py-1.5 rounded shadow-lg uppercase tracking-widest w-fit flex items-center gap-1.5">
                            <window.Icon name="shield-check" size={12} /> Garanti
                        </div>
                    )}
                </div>

                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(car); }} className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-brand-500 border border-white/10 text-white rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:scale-110" title="Tipsa en vän">
                    <window.Icon name="share-2" size={16} />
                </button>
            </div>

            <div className="p-8 flex flex-col flex-grow">
                <div className="flex justify-between items-center mb-2">
                    <div className="text-brand-500 text-sm font-bold uppercase tracking-wider">
                        {car.brand}
                    </div>

                    <div className="flex items-center gap-2">
                        {car.regNo && (
                            <div className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 border border-white/10 rounded shadow-sm uppercase tracking-widest">
                                {car.regNo}
                            </div>
                        )}
                        {car.carfaxUrl && (
                            <a href={car.carfaxUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                <window.Icon name="file-text" size={12} /> CARFAX
                            </a>
                        )}
                    </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-5 line-clamp-2 leading-snug" title={car.model}>{car.model}</h3>

                <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-6 text-sm text-slate-300">
                    <div className="flex items-center gap-2.5"><window.Icon name="calendar" size={16} className="text-slate-500" /> {car.year}</div>
                    <div className="flex items-center gap-2.5"><window.Icon name="gauge" size={16} className="text-slate-500" /> {car.mil}</div>
                    <div className="flex items-center gap-2.5"><window.Icon name="settings-2" size={16} className="text-slate-500" /> {car.gear}</div>
                    <div className="flex items-center gap-2.5"><window.Icon name="fuel" size={16} className="text-slate-500" /> {car.fuel}</div>
                    {car.hp && <div className="flex items-center gap-2.5"><window.Icon name="zap" size={16} className="text-slate-500" /> {car.hp} hk</div>}
                    {car.passengers && <div className="flex items-center gap-2.5"><window.Icon name="users" size={16} className="text-slate-500" /> {car.passengers} sits</div>}
                </div>

                {car.equipment.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {car.equipment.slice(0, 3).map((item, i) => (
                            <span key={i} className="text-[10px] bg-white/5 text-slate-400 border border-white/10 px-2.5 py-1 rounded truncate max-w-[120px]" title={item}>{item}</span>
                        ))}
                    </div>
                )}

                {car.description && (
                    <div className="mb-6">
                        <button
                            onClick={() => setShowDesc(!showDesc)}
                            className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1 font-semibold transition-colors"
                        >
                            <window.Icon name={showDesc ? "chevron-up" : "chevron-down"} size={14} />
                            {showDesc ? "Dölj annonstext" : "Läs annonstext"}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ${showDesc ? 'max-h-96 mt-3 opacity-100 overflow-y-auto pr-2 no-scrollbar' : 'max-h-0 opacity-0'}`}>
                            <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed border-l-2 border-brand-500/30 pl-3">
                                {car.description}
                            </p>
                        </div>
                    </div>
                )}

                <div className="border-t border-white/10 pt-6 mt-auto">
                    <div className="flex flex-wrap sm:flex-nowrap justify-between items-end gap-4 mb-6">
                        <div>
                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                Kontantpris
                                {car.showVat && <span className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0.5 rounded border border-green-500/30">MOMS</span>}
                            </div>
                            {car.discountAmount > 0 && (
                                <div className="text-xs text-red-400 line-through mb-0.5 decoration-red-400/50">
                                    {(car.priceValue + car.discountAmount).toLocaleString('sv-SE')} kr
                                </div>
                            )}
                            <div className="text-2xl font-black text-white flex items-center gap-2 whitespace-nowrap">
                                {car.price}
                                {car.discountAmount > 0 && (
                                    <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full animate-pulse">
                                        -{car.discountAmount.toLocaleString('sv-SE')} kr
                                    </span>
                                )}
                            </div>
                            {car.exVatPrice && <div className="text-[10px] text-slate-400 mt-1">{car.exVatPrice}</div>}
                        </div>
                        <button onClick={(e) => { e.preventDefault(); setFinanceCar(car); }} className="text-left sm:text-right hover:opacity-80 transition-opacity whitespace-nowrap">
                            <div className="text-[11px] font-bold text-brand-500 uppercase tracking-widest mb-1 flex items-center sm:justify-end gap-1">
                                Finansiering <window.Icon name="calculator" size={10} />
                            </div>
                            <div className="text-base font-bold text-white whitespace-nowrap">Från {calculateMonthlyCost(car.price)} kr/mån</div>
                        </button>
                    </div>
                    <a href={car.link} target="_blank" rel="noopener noreferrer" className="w-full bg-white/5 hover:bg-brand-500 text-white py-3.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2">
                        Se annons på Blocket <window.Icon name="external-link" size={18} />
                    </a>
                </div>
            </div>
        </article>
    );
};

const LagerSection = ({ setFinanceCar }) => {

    const { useState, useMemo } = React;

    const [cars, setCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(true);
    const [apiError, setApiError] = useState(false);
    
    // NYTT STATE FÖR LIGHTBOX
    const [lightboxData, setLightboxData] = useState(null); 

    useEffect(() => {
        const fetchCars = async () => {
            setLoadingCars(true);
            setApiError(false);
            try {
                let data; 
                try {
                    const response = await fetch("https://bmgmotorgrupp.netlify.app/.netlify/functions/getCars");
                    if (!response.ok) throw new Error("Netlify error");
                    data = await response.json();
                } catch (netlifyError) {
                    const fallbackResponse = await fetch("./bilar.json");
                    if (!fallbackResponse.ok) throw new Error("Local JSON error");
                    data = await fallbackResponse.json();
                }

                const formattedCars = data.map(car => {
                    let imageUrls = ["https://images.unsplash.com/photo-1555353540-64fd8b01a757?w=800&q=80"];
                    if (car.images && car.images.length > 0) {
                        imageUrls = car.images.map(img => img.imageFormats?.[0]?.url).filter(Boolean);
                    }
                    let fuelName = car.fuels?.[0]?.name || car.fuel || "Okänd";

                    return {
                        id: car.id || Math.random(),
                        brand: car.make || "Okänt märke",
                        model: car.modelRaw || car.model || "Modell saknas",
                        year: car.modelYear || "-",
                        mil: car.milage ? `${car.milage.toLocaleString('sv-SE')} mil` : "0 mil",
                        gear: car.gearBox || "Okänd",
                        price: (car.price && car.price.value) ? `${car.price.value.toLocaleString('sv-SE')} kr` : "Ring för pris",
                        fuel: fuelName,
                        images: imageUrls,
                        regNo: car.regNoHidden ? "*** ***" : (car.regNo || ""),
                        equipment: car.equipment || [],
                        hp: car.additionalVehicleData?.engineEffectHp || null,
                        isAWD: !!car.additionalVehicleData?.fourWheelDrive,
                        carfaxUrl: car.carfaxReport?.clickUrl || null,
                        description: car.description || "",
                        isEco: car.isEco || false,
                        hasWarranty: car.inWarrantyProgram || false,
                        passengers: car.noPassangers || null,
                        link: "https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" 
                    };
                });
                setCars(formattedCars);
            } catch (error) {
                console.error("API-fel:", error);
                setApiError(true);
            } finally {
                setLoadingCars(false);
            }
        };
        fetchCars();
    }, []);

    const [filterBrand, setFilterBrand] = useState("Alla");
    const [filterFuel, setFilterFuel] = useState("Alla");
    const [filterGear, setFilterGear] = useState("Alla");
    const [filterDrive, setFilterDrive] = useState("Alla");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minMil, setMinMil] = useState("");
    const [maxMil, setMaxMil] = useState("");
    const [minYear, setMinYear] = useState("");
    const [maxYear, setMaxYear] = useState("");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [equipmentFilters, setEquipmentFilters] = useState({
        dragkrok: false, backkamera: false, farthallare: false, motorvarmare: false, panoramatak: false, gps: false
    });

    const resetFilters = () => {
        setSearchTerm(""); setFilterBrand("Alla"); setFilterFuel("Alla"); setFilterGear("Alla"); setFilterDrive("Alla");
        setMinPrice(""); setMaxPrice(""); setMinMil(""); setMaxMil(""); setMinYear(""); setMaxYear("");
        setEquipmentFilters({ dragkrok: false, backkamera: false, farthallare: false, motorvarmare: false, panoramatak: false, gps: false });
    };

    const uniqueBrands = ["Alla", ...new Set(cars.map(c => c.brand).filter(Boolean))].sort();
    const uniqueFuels = ["Alla", ...new Set(cars.map(c => c.fuel).filter(Boolean))].sort();
    const uniqueGears = ["Alla", ...new Set(cars.map(c => c.gear).filter(Boolean))].sort();

    const filteredCars = useMemo(() => {
        try {
            let result = [...cars];
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                result = result.filter(c => c.brand.toLowerCase().includes(term) || c.model.toLowerCase().includes(term) || c.regNo.toLowerCase().includes(term));
            }
            if (filterBrand !== "Alla") result = result.filter(c => c.brand === filterBrand);
            if (filterFuel !== "Alla") result = result.filter(c => c.fuel === filterFuel);
            if (filterGear !== "Alla") result = result.filter(c => c.gear === filterGear);
            if (filterDrive === "4WD") result = result.filter(c => c.isAWD);
            if (filterDrive === "2WD") result = result.filter(c => !c.isAWD);
            if (minPrice) result = result.filter(c => parseNumber(c.price) >= parseInt(minPrice));
            if (maxPrice) result = result.filter(c => parseNumber(c.price) <= parseInt(maxPrice));
            if (minMil) result = result.filter(c => parseNumber(c.mil) >= parseInt(minMil));
            if (maxMil) result = result.filter(c => parseNumber(c.mil) <= parseInt(maxMil));
            if (minYear) result = result.filter(c => parseNumber(c.year) >= parseInt(minYear));
            if (maxYear) result = result.filter(c => parseNumber(c.year) <= parseInt(maxYear));

            if (equipmentFilters.dragkrok) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("dragkrok")));
            if (equipmentFilters.backkamera) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("backkamera") || e.toLowerCase().includes("360")));
            if (equipmentFilters.farthallare) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("farthållare")));
            if (equipmentFilters.motorvarmare) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("värmare")));
            if (equipmentFilters.panoramatak) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("panorama") || e.toLowerCase().includes("glastak")));
            if (equipmentFilters.gps) result = result.filter(c => c.equipment.some(e => e.toLowerCase().includes("gps") || e.toLowerCase().includes("navigation")));

            return result;
        } catch (error) { return []; }
    }, [cars, searchTerm, filterBrand, filterFuel, filterGear, filterDrive, minPrice, maxPrice, minMil, maxMil, minYear, maxYear, equipmentFilters, parseNumber]);

    return (
        <section id="lager" className="py-24 bg-brand-950 relative z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-950 via-brand-900/20 to-brand-950 pointer-events-none"></div>

            <div className="max-w-[1400px] mx-auto px-6 relative z-10">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4">Exklusivt urval.</h2>
                        <p className="text-slate-400 text-lg md:text-xl max-w-2xl">Utforska vårt noggrant testade utbud av premiumfordon, redo för omedelbar leverans.</p>
                    </div>
                    <div className="text-brand-500 font-bold bg-brand-500/10 px-6 py-3 rounded-full border border-brand-500/20 flex items-center gap-2">
                        <window.Icon name="car" size={18} /> {filteredCars.length} fordon i lager
                    </div>
                </div>

                {cars.length > 0 && !loadingCars && !apiError && (
                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2rem] p-6 md:p-8 mb-16 shadow-2xl relative overflow-hidden transition-all">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
                            <div className="flex items-center gap-3 text-white font-black text-2xl tracking-tight">
                                <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                                    <window.Icon name="search" size={20} />
                                </div>
                                Hitta din bil
                            </div>
                            <button onClick={resetFilters} className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/5">
                                <window.Icon name="rotate-ccw" size={16} /> Nollställ filter
                            </button>
                        </div>

                        <div className="relative mb-8 z-10 group">
                            <input
                                type="text"
                                placeholder="Sök på modell, märke, regnr eller utrustning..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 pl-6 pr-6 text-white text-lg placeholder:text-slate-500 focus:bg-black/60 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500 transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10 mb-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Märke</label>
                                <div className="relative group">
                                    <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white rounded-xl pl-4 pr-10 py-4 text-sm md:text-base focus:outline-none focus:border-brand-500 appearance-none font-semibold cursor-pointer transition-colors hover:border-white/20">
                                        <option value="Alla" className="bg-brand-900 text-white">Alla märken</option>
                                        {uniqueBrands.filter(b => b !== "Alla").map(brand => (
                                            <option key={brand} value={brand} className="bg-brand-900 text-white">{brand}</option>
                                        ))}
                                    </select>
                                    <window.Icon name="chevron-down" size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Pris</label>
                                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors focus-within:border-brand-500">
                                    <div className="relative flex-1 border-r border-white/10">
                                        <select value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-4 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                            <option value="" className="bg-brand-900 text-white">Från</option>
                                            <option value="50000" className="bg-brand-900 text-white">50 000 kr</option>
                                            <option value="100000" className="bg-brand-900 text-white">100 000 kr</option>
                                            <option value="200000" className="bg-brand-900 text-white">200 000 kr</option>
                                            <option value="300000" className="bg-brand-900 text-white">300 000 kr</option>
                                            <option value="500000" className="bg-brand-900 text-white">500 000 kr</option>
                                        </select>
                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-4 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                            <option value="" className="bg-brand-900 text-white">Till</option>
                                            <option value="100000" className="bg-brand-900 text-white">100 000 kr</option>
                                            <option value="300000" className="bg-brand-900 text-white">300 000 kr</option>
                                            <option value="500000" className="bg-brand-900 text-white">500 000 kr</option>
                                            <option value="1000000" className="bg-brand-900 text-white">1 000 000 kr</option>
                                        </select>
                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Miltal</label>
                                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors focus-within:border-brand-500">
                                    <div className="relative flex-1 border-r border-white/10">
                                        <select value={minMil} onChange={(e) => setMinMil(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-4 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                            <option value="" className="bg-brand-900 text-white">Från</option>
                                            <option value="0" className="bg-brand-900 text-white">0 mil</option>
                                            <option value="5000" className="bg-brand-900 text-white">5 000 mil</option>
                                            <option value="10000" className="bg-brand-900 text-white">10 000 mil</option>
                                        </select>
                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <select value={maxMil} onChange={(e) => setMaxMil(e.target.value)} className="w-full bg-transparent text-white pl-4 pr-8 py-4 text-sm md:text-base focus:outline-none appearance-none font-semibold cursor-pointer">
                                            <option value="" className="bg-brand-900 text-white">Till</option>
                                            <option value="5000" className="bg-brand-900 text-white">5 000 mil</option>
                                            <option value="15000" className="bg-brand-900 text-white">15 000 mil</option>
                                            <option value="30000" className="bg-brand-900 text-white">30 000 mil</option>
                                        </select>
                                        <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center relative z-10 pt-4">
                            <button
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="text-sm font-bold text-white transition-all flex items-center gap-2 bg-white/5 hover:bg-brand-500 px-6 py-3 rounded-full border border-white/10 hover:border-brand-500 group"
                            >
                                <window.Icon name="settings-2" size={16} className="text-brand-500 group-hover:text-white transition-colors" />
                                {showAdvancedFilters ? "Dölj avancerade val" : "Fler inställningar & Utrustning"}
                                <window.Icon name={showAdvancedFilters ? "chevron-up" : "chevron-down"} size={16} className="text-slate-500 group-hover:text-white/80" />
                            </button>
                        </div>

                        <div className={`transition-all duration-500 ease-in-out relative z-10 overflow-hidden ${showAdvancedFilters ? 'max-h-[1000px] opacity-100 mt-8' : 'max-h-0 opacity-0'}`}>
                            <div className="p-6 md:p-8 bg-black/40 rounded-2xl border border-white/5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Årsmodell</label>
                                        <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-brand-500">
                                            <div className="relative flex-1 border-r border-white/10">
                                                <select value={minYear} onChange={(e) => setMinYear(e.target.value)} className="w-full bg-transparent text-slate-300 pl-4 pr-8 py-3 text-sm focus:outline-none appearance-none font-semibold">
                                                    <option value="" className="bg-brand-900 text-white">Från</option>
                                                    {[2010, 2012, 2015, 2018, 2020, 2022, 2024].map(y => <option key={y} value={y} className="bg-brand-900 text-white">{y}</option>)}
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                            <div className="relative flex-1">
                                                <select value={maxYear} onChange={(e) => setMaxYear(e.target.value)} className="w-full bg-transparent text-slate-300 pl-4 pr-8 py-3 text-sm focus:outline-none appearance-none font-semibold">
                                                    <option value="" className="bg-brand-900 text-white">Till</option>
                                                    {[2015, 2018, 2020, 2022, 2024, 2025].map(y => <option key={y} value={y} className="bg-brand-900 text-white">{y}</option>)}
                                                </select>
                                                <window.Icon name="chevron-down" size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Bränsle</label>
                                        <div className="relative">
                                            <select value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)} className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                {uniqueFuels.map(f => <option key={f} value={f} className="bg-brand-900 text-white">{f === "Alla" ? "Alla drivmedel" : f}</option>)}
                                            </select>
                                            <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Växellåda</label>
                                        <div className="relative">
                                            <select value={filterGear} onChange={(e) => setFilterGear(e.target.value)} className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                <option value="Alla" className="bg-brand-900 text-white">Alla växellådor</option>
                                                {uniqueGears.filter(g => g !== "Alla").map(g => <option key={g} value={g} className="bg-brand-900 text-white">{g}</option>)}
                                            </select>
                                            <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block pl-1">Drivhjul</label>
                                        <div className="relative">
                                            <select value={filterDrive} onChange={(e) => setFilterDrive(e.target.value)} className="w-full bg-white/5 border border-white/10 text-slate-300 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-brand-500 appearance-none font-semibold">
                                                <option value="Alla" className="bg-brand-900 text-white">All drivning</option>
                                                <option value="4WD" className="bg-brand-900 text-white">Fyrhjulsdrift (AWD)</option>
                                                <option value="2WD" className="bg-brand-900 text-white">Tvåhjulsdrift (2WD)</option>
                                            </select>
                                            <window.Icon name="chevron-down" size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 pl-1">
                                        <window.Icon name="check-square" size={14} /> Viktig utrustning
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {Object.keys(equipmentFilters).map(key => {
                                            const labels = { dragkrok: "Dragkrok", backkamera: "Backkamera", farthallare: "Farthållare", motorvarmare: "Värmare", panoramatak: "Panoramatak", gps: "GPS" };
                                            const isActive = equipmentFilters[key];
                                            return (
                                                <button
                                                    key={key}
                                                    onClick={() => setEquipmentFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 flex items-center gap-2 ${isActive
                                                        ? 'bg-brand-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] scale-105'
                                                        : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/20 hover:text-white hover:bg-white/10'
                                                        }`}
                                                >
                                                    {isActive && <window.Icon name="check" size={14} />}
                                                    {labels[key]}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {loadingCars ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => <CarSkeleton key={i} />)}
                    </div>
                ) : apiError ? (
                    <div className="text-center py-16 bg-brand-900/30 rounded-3xl border border-red-500/20">
                        <window.Icon name="alert-circle" className="text-red-500 mx-auto mb-4" size={48} />
                        <h3 className="text-2xl font-black text-white mb-2">Vi uppdaterar lagret!</h3>
                        <p className="text-slate-400 mb-8 max-w-lg mx-auto">Just nu kan vi inte hämta bilarna hit till hemsidan, men du hittar hela vårt utbud direkt på Blocket.</p>
                        <a href="https://www.blocket.se/mobility/dealer/5854854/bmg-motorgrupp" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-brand-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-brand-600 transition-all hover:scale-105">
                            Gå till Blocket-butiken <window.Icon name="external-link" size={18} />
                        </a>
                    </div>
                ) : filteredCars.length === 0 ? (
                    <div className="text-center py-20 bg-brand-900/30 rounded-3xl border border-white/5">
                        <window.Icon key="no-search-results" name="search" className="text-slate-500 mx-auto mb-6" size={56} />
                        <h3 className="text-2xl font-black text-white mb-3">Inga fordon hittades</h3>
                        <p className="text-slate-400 mb-8 max-w-md mx-auto">Vi hittade tyvärr inga bilar som matchar dina sökval. Testa att ta bort några filter.</p>
                        <button onClick={resetFilters} className="text-brand-500 font-bold hover:text-white transition-colors underline underline-offset-4">
                            Återställ alla filter
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCars.map(car => (
                            <CarCard
                                key={car.id}
                                car={car}
                                handleShare={handleShare}
                                setFinanceCar={setFinanceCar}
                                calculateMonthlyCost={calculateMonthlyCost}
                                onOpenGallery={(images, index) => setLightboxData({ images, index })}
                            />
                        ))}
                    </div>
                )}
            </div>

            {lightboxData && ReactDOM.createPortal(
                <Lightbox 
                    images={lightboxData.images} 
                    initialIndex={lightboxData.index} 
                    onClose={() => setLightboxData(null)} 
                />,
                document.body
            )}
        </section>
    );
};

window.LagerSection = LagerSection;
