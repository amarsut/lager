// Funktion för att hantera klick på "Mer" knappen (event propagation)
function handleMoreButtonClick(event) {
    event.stopPropagation();
    const dropdown = event.target.nextElementSibling;
    
    // Stäng alla andra öppna dropdowns
    document.querySelectorAll('.dropdown-menu.visible').forEach(openDropdown => {
        if (openDropdown !== dropdown) {
            openDropdown.classList.remove('visible');
        }
    });
    
    // Toggla den aktuella dropdownen
    dropdown.classList.toggle('visible');
}

// Funktion för att stänga alla dropdowns
function closeAllDropdowns(event) {
    if (!event.target.matches('.more-btn')) {
        document.querySelectorAll('.dropdown-menu.visible').forEach(dropdown => {
            dropdown.classList.remove('visible');
        });
    }
}

// Lägg till en global klicklyssnare för att stänga dropdowns
document.addEventListener('click', closeAllDropdowns);

// Importerar nödvändiga Firebase-moduler
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Din Firebase-konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyAC4SLwVEzP3CPO4lLfDeZ71iU0xdr49sw",
    authDomain: "lagerdata-a9b39.firebaseapp.com",
    projectId: "lagerdata-a9b39",
    storageBucket: "lagerdata-a9b39.firebasestorage.app",
    messagingSenderId: "615646392577",
    appId: "1:615646392577:web:fd816443728e88b218eb00"
};

// Initialiserar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const lagerCollection = collection(db, 'lager');

// Funktion för att ladda och visa lagerdata
async function loadLagerData() {
    const serviceArtiklarLista = document.getElementById('service-artiklar-lista');
    const motorChassiArtiklarLista = document.getElementById('motor-chassi-artiklar-lista');
    const andraMarkenArtiklarLista = document.getElementById('andra-marken-artiklar-lista');
    const slutILagerLista = document.getElementById('slut-i-lager-lista');
    const slutILagerSektion = document.getElementById('slut-i-lager-sektion');
    const syncStatus = document.getElementById('sync-status');

    // Nollställ listorna
    serviceArtiklarLista.innerHTML = '';
    motorChassiArtiklarLista.innerHTML = '';
    andraMarkenArtiklarLista.innerHTML = '';
    slutILagerLista.innerHTML = '';

    try {
        // Sätt upp realtidslyssnare
        onSnapshot(lagerCollection, (querySnapshot) => {
            const artiklar = [];
            querySnapshot.forEach((doc) => {
                artiklar.push({ id: doc.id, ...doc.data() });
            });

            // Rensa listorna innan de fylls på nytt
            serviceArtiklarLista.innerHTML = '';
            motorChassiArtiklarLista.innerHTML = '';
            andraMarkenArtiklarLista.innerHTML = '';
            slutILagerLista.innerHTML = '';

            // Sortera artiklarna, t.ex. efter namn
            artiklar.sort((a, b) => a.name.localeCompare(b.name));

            let slutILagerFinns = false;

            // Skapa och lägg till rad-element för varje artikel
            artiklar.forEach(artikel => {
                const artikelRad = createArtikelRad(artikel);

                if (artikel.quantity > 0) {
                    if (artikel.category === 'Service') {
                        serviceArtiklarLista.appendChild(artikelRad);
                    } else if (artikel.category === 'Motor/Chassi') {
                        motorChassiArtiklarLista.appendChild(artikelRad);
                    } else if (artikel.category === 'Andra Märken') {
                        andraMarkenArtiklarLista.appendChild(artikelRad);
                    } else {
                        // Fallback för odefinierad eller annan kategori
                        motorChassiArtiklarLista.appendChild(artikelRad);
                    }
                } else {
                    slutILagerLista.appendChild(artikelRad);
                    slutILagerFinns = true;
                }
            });

            // Visa eller dölj sektionen för "Slut i lager"
            slutILagerSektion.style.display = slutILagerFinns ? 'block' : 'none';

            // Uppdatera synk-status
            const now = new Date();
            syncStatus.textContent = `Synkroniserad ${now.toLocaleTimeString('sv-SE')}`;
            syncStatus.style.color = 'var(--success-color)';

        }, (error) => {
            console.error("Fel vid hämtning av data i realtid: ", error);
            syncStatus.textContent = 'Synk-fel';
            syncStatus.style.color = 'var(--danger-color)';
        });

    } catch (error) {
        console.error("Fel vid laddning av lagerdata: ", error);
        syncStatus.textContent = 'Laddningsfel';
        syncStatus.style.color = 'var(--danger-color)';
    }
}

// Funktion för att skapa en artikelrad (HTML-element)
function createArtikelRad(artikel) {
    const artikelRad = document.createElement('div');
    artikelRad.classList.add('artikel-rad');
    artikelRad.setAttribute('data-id', artikel.id);

    // Formatera priset
    const formattedPrice = new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(artikel.price);

    // Status (I lager / Slut)
    const statusClass = artikel.quantity > 0 ? 'i-lager' : 'slut';
    const statusText = artikel.quantity > 0 ? 'I lager' : 'Slut';

    // Hantera anteckningar
    const notesText = artikel.notes || '';
    const notesDisplay = notesText.length > 20 ? notesText.substring(0, 20) + '...' : notesText;

    // Länk-knappar
    const trodoLink = `https://www.trodo.se/catalogsearch/result/?q=${artikel.service_filter}`;
    const bildelsbasenLink = `https://www.bildelsbasen.se/?link=search&searchmode=1&query=${artikel.service_filter}`;
    const aeroMLink = `https://www.aero-m.se/search/?search=${artikel.service_filter}`;
    const thansenLink = `https://www.thansen.se/search/?q=${artikel.service_filter}`;
    const egenLink = artikel.link; // Den länk som är sparad i databasen

    const linkButtons = `
        <div class="link-buttons">
            <a href="${trodoLink}" target="_blank" class="lank-knapp trodo-btn" onclick="event.stopPropagation()">Trodo</a>
            <div class="link-dropdown-container">
                <button class="lank-knapp more-btn" onclick="handleMoreButtonClick(event)">Mer</button>
                <div class="dropdown-menu">
                    <a href="${aeroMLink}" target="_blank" class="lank-knapp aero-m-btn" onclick="event.stopPropagation()">Aero M</a>
                    <a href="${thansenLink}" target="_blank" class="lank-knapp thansen-btn" onclick="event.stopPropagation()">Thansen</a>
                    ${egenLink ? `<a href="${egenLink}" target="_blank" class="lank-knapp egen-lank-btn" onclick="event.stopPropagation()">Egen Länk</a>` : ''}
                </div>
            </div>
        </div>
    `;

    artikelRad.innerHTML = `
        <span class="service-filter-cell">
            <button class="search-btn" onclick="window.open('${bildelsbasenLink}', '_blank'); event.stopPropagation();" title="Sök på Bildelsbasen">
                <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>
            </button>
            <button class="copy-btn" onclick="copyToClipboard('${artikel.service_filter}'); event.stopPropagation();" title="Kopiera Artikelnummer">&#x1F4CB;</button>
            <span class="service-filter-text">${artikel.service_filter}</span>
        </span>
        <span>${artikel.name}</span>
        <span>${formattedPrice}</span>
        <div class="quantity-cell">
            <button class="qty-btn" onclick="updateQuantity('${artikel.id}', ${artikel.quantity - 1}, event)">-</button>
            <span>${artikel.quantity}</span>
            <button class="qty-btn" onclick="updateQuantity('${artikel.id}', ${artikel.quantity + 1}, event)">+</button>
        </div>
        <span><span class="${statusClass}">${statusText}</span></span>
        <span class="notes-cell" title="${notesText}">${notesDisplay}</span>
        <span class="action-cell">${linkButtons}</span>
        <div class="action-buttons">
            <button class="edit-btn" onclick="openEditModal('${artikel.id}', event)">Ändra</button>
            <button class="delete-btn" onclick="deleteArtikel('${artikel.id}', event)">Ta bort</button>
        </div>
    `;
    return artikelRad;
}

// Funktion för att uppdatera antal
window.updateQuantity = async (id, newQuantity, event) => {
    event.stopPropagation(); // Förhindra att modalen öppnas
    if (newQuantity < 0) newQuantity = 0; // Förhindra negativt antal

    const artikelRef = doc(db, 'lager', id);
    try {
        await setDoc(artikelRef, { quantity: newQuantity }, { merge: true });
        // Datan uppdateras automatiskt av realtidslyssnaren
    } catch (error) {
        console.error("Fel vid uppdatering av antal: ", error);
    }
};

// Funktion för att kopiera till urklipp
window.copyToClipboard = (text) => {
    event.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
        // Visa en tillfällig bekräftelse (valfritt)
        const originalBtn = event.target;
        originalBtn.innerHTML = 'Kopierat!';
        setTimeout(() => {
            originalBtn.innerHTML = '&#x1F4CB;'; // Återställ ikonen
        }, 1500);
    }).catch(err => {
        console.error('Kunde inte kopiera text: ', err);
    });
};


// Funktion för att öppna redigeringsmodalen
window.openEditModal = async (id, event) => {
    event.stopPropagation();
    const modal = document.getElementById('editModal');
    const form = document.getElementById('edit-article-form');

    // Hämta aktuell data för artikeln
    try {
        const artikelRef = doc(db, 'lager', id);
        const docSnap = await getDoc(artikelRef); // Importera getDoc

        if (docSnap.exists()) {
            const artikel = docSnap.data();
            // Fyll i formuläret
            form.querySelector('#edit-id').value = id;
            form.querySelector('#edit-service_filter').value = artikel.service_filter;
            form.querySelector('#edit-name').value = artikel.name;
            form.querySelector('#edit-price').value = artikel.price;
            form.querySelector('#edit-quantity').value = artikel.quantity;
            form.querySelector('#edit-category').value = artikel.category;
            form.querySelector('#edit-notes').value = artikel.notes || '';
            form.querySelector('#edit-link').value = artikel.link || '';
        } else {
            console.error("Artikeln finns inte!");
            return;
        }
    } catch (error) {
        console.error("Fel vid hämtning av artikel för redigering: ", error);
        return;
    }

    modal.style.display = 'flex';
};

// Funktion för att stänga modalen
function closeModal() {
    document.getElementById('editModal').style.display = 'none';
    document.getElementById('confirmationModal').style.display = 'none';
}

// Funktion för att ta bort en artikel
window.deleteArtikel = (id, event) => {
    event.stopPropagation();
    
    const confirmModal = document.getElementById('confirmationModal');
    const confirmMessage = document.getElementById('confirmationMessage');
    const confirmYesBtn = document.getElementById('confirmYes');
    
    confirmMessage.textContent = 'Är du säker på att du vill ta bort denna artikel?';
    confirmModal.style.display = 'flex';

    // Ta bort tidigare lyssnare för att undvika dubbla anrop
    const newConfirmYesBtn = confirmYesBtn.cloneNode(true);
    confirmYesBtn.parentNode.replaceChild(newConfirmYesBtn, confirmYesBtn);
    
    newConfirmYesBtn.onclick = async () => {
        try {
            await deleteDoc(doc(db, 'lager', id));
            // Datan uppdateras automatiskt av realtidslyssnaren
            closeModal();
        } catch (error) {
            console.error("Fel vid borttagning av artikel: ", error);
            closeModal();
        }
    };
};

// Lyssnare för att hantera formulär-submit (Lägg till ny)
document.getElementById('add-article-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Sparar...';

    try {
        await addDoc(lagerCollection, {
            service_filter: form.service_filter.value.toUpperCase(),
            name: form.name.value,
            price: parseFloat(form.price.value),
            quantity: parseInt(form.quantity.value),
            category: form.category.value,
            notes: form.notes.value,
            link: form.link.value
        });
        
        form.reset(); // Återställ formuläret
        // Datan uppdateras automatiskt av realtidslyssnaren
        
        // Stäng "Lägg till" formuläret efter lyckad tilläggning
        const addFormWrapper = document.getElementById('add-form-wrapper');
        const toggleBtn = document.getElementById('toggle-add-form-btn');
        addFormWrapper.classList.remove('open');
        toggleBtn.classList.remove('open');
        localStorage.setItem('add_form_open_state', 'closed');

    } catch (error) {
        console.error("Fel vid tillägg av ny artikel: ", error);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Spara Artikel';
    }
});

// Lyssnare för att hantera formulär-submit (Redigera)
document.getElementById('edit-article-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const form = e.target;
    const id = form.querySelector('#edit-id').value;
    const artikelRef = doc(db, 'lager', id);

    try {
        await setDoc(artikelRef, {
            service_filter: form.querySelector('#edit-service_filter').value.toUpperCase(),
            name: form.querySelector('#edit-name').value,
            price: parseFloat(form.querySelector('#edit-price').value),
            quantity: parseInt(form.querySelector('#edit-quantity').value),
            category: form.querySelector('#edit-category').value,
            notes: form.querySelector('#edit-notes').value,
            link: form.querySelector('#edit-link').value
        }, { merge: true }); // Använd merge: true för att inte skriva över andra fält om de inte finns i formuläret

        closeModal();
        // Datan uppdateras automatiskt av realtidslyssnaren
    } catch (error) {
        console.error("Fel vid uppdatering av artikel: ", error);
    }
});


// Lyssnare för att stänga modalen (via X-knapp eller utanför)
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('close-btn')) {
            closeModal();
        }
    });
});
document.getElementById('confirmNo').addEventListener('click', closeModal);


// Lyssnare för att växla "Lägg till ny artikel"
document.getElementById('toggle-add-form-btn').addEventListener('click', () => {
    const addFormWrapper = document.getElementById('add-form-wrapper');
    const toggleBtn = document.getElementById('toggle-add-form-btn');
    const isOpen = addFormWrapper.classList.toggle('open');
    toggleBtn.classList.toggle('open');
    
    // Spara status i localStorage
    localStorage.setItem('add_form_open_state', isOpen ? 'open' : 'closed');
});

// Funktion för att återställa formulärets tillstånd vid sidladdning
function initializeAddFormState() {
    const addFormWrapper = document.getElementById('add-form-wrapper');
    const toggleBtn = document.getElementById('toggle-add-form-btn');
    const storedState = localStorage.getItem('add_form_open_state');
    
    if (storedState === 'open') {
        addFormWrapper.classList.add('open');
        toggleBtn.classList.add('open');
    } else {
        addFormWrapper.classList.remove('open');
        toggleBtn.classList.remove('open');
    }
}

// Lyssnare för att växla kategorier (collapsible)
document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
        const wrapperId = header.id.replace('-titel', '-wrapper');
        const wrapper = document.getElementById(wrapperId);
        const state = header.getAttribute('data-state');
        
        if (state === 'open') {
            header.setAttribute('data-state', 'closed');
            wrapper.classList.add('collapsed');
            localStorage.setItem(header.id, 'closed');
        } else {
            header.setAttribute('data-state', 'open');
            wrapper.classList.remove('collapsed');
            localStorage.setItem(header.id, 'open');
        }
    });
});

// Funktion för att återställa kategoriernas tillstånd vid sidladdning
function initializeCollapseState() {
    document.querySelectorAll('.collapsible-header').forEach(header => {
        const savedState = localStorage.getItem(header.id);
        if (savedState === 'closed') {
            header.setAttribute('data-state', 'closed');
            const wrapperId = header.id.replace('-titel', '-wrapper');
            document.getElementById(wrapperId).classList.add('collapsed');
        }
    });
}

// Sökfunktion
document.getElementById('search-input').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const clearBtn = document.getElementById('clear-search-btn');

    // Visa eller dölj rensa-knappen
    clearBtn.style.display = searchTerm.length > 0 ? 'block' : 'none';

    document.querySelectorAll('.artikel-rad').forEach(rad => {
        const artNr = rad.querySelector('.service-filter-text')?.textContent.toLowerCase() || '';
        const namn = rad.querySelector('span:nth-child(2)')?.textContent.toLowerCase() || '';
        const notes = rad.querySelector('.notes-cell')?.title.toLowerCase() || '';

        if (artNr.includes(searchTerm) || namn.includes(searchTerm) || notes.includes(searchTerm)) {
            rad.style.display = 'grid';
        } else {
            rad.style.display = 'none';
        }
    });
});

// Rensa sökfältet
document.getElementById('clear-search-btn').addEventListener('click', () => {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input')); // Trigga input-eventet för att uppdatera listan
    searchInput.focus();
});


// JSON Export
document.getElementById('download-json-btn').addEventListener('click', async () => {
    const querySnapshot = await getDocs(lagerCollection);
    const artiklar = [];
    querySnapshot.forEach((doc) => {
        // Exkludera 'id' från det exporterade objektet
        const data = doc.data();
        artiklar.push(data);
    });
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artiklar, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lager_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
});

// JSON Import
document.getElementById('upload-json-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const artiklar = JSON.parse(e.target.result);
                if (Array.isArray(artiklar)) {
                    // Visa en bekräftelsedialog
                    const confirmModal = document.getElementById('confirmationModal');
                    const confirmMessage = document.getElementById('confirmationMessage');
                    const confirmYesBtn = document.getElementById('confirmYes');
                    
                    confirmMessage.innerHTML = `Är du säker på att du vill importera ${artiklar.length} artiklar? <br><strong>Detta kan inte ångras och kommer att skriva över matchande artikelnummer.</strong>`;
                    confirmModal.style.display = 'flex';

                    // Klon-fix för bekräftelseknappen
                    const newConfirmYesBtn = confirmYesBtn.cloneNode(true);
                    confirmYesBtn.parentNode.replaceChild(newConfirmYesBtn, confirmYesBtn);

                    newConfirmYesBtn.onclick = async () => {
                        closeModal();
                        let count = 0;
                        // Gå igenom varje artikel från JSON
                        for (const artikel of artiklar) {
                            // Vi måste skapa ett unikt ID, men Firestore gör det automatiskt om vi använder addDoc.
                            // Om vi vill skriva över baserat på t.ex. service_filter, behöver vi en mer avancerad logik.
                            // För nu, lägger vi bara till dem som nya.
                            
                            // För att undvika dubbletter (enkel kontroll):
                            // const q = query(lagerCollection, where("service_filter", "==", artikel.service_filter));
                            // const existing = await getDocs(q);
                            
                            // if (existing.empty) {
                            //     await addDoc(lagerCollection, artikel);
                            //     count++;
                            // } else {
                            //     // Uppdatera befintlig?
                            //     const docId = existing.docs[0].id;
                            //     await setDoc(doc(db, 'lager', docId), artikel, { merge: true });
                            //     count++;
                            // }

                            // Enkel import: Lägg bara till alla som nya.
                            await addDoc(lagerCollection, artikel);
                            count++;
                        }
                        alert(`${count} artiklar importerades framgångsrikt!`);
                        // Realtidslyssnaren uppdaterar listan
                    };

                } else {
                    alert("Fel: JSON-filen är inte en giltig lista (array).");
                }
            } catch (err) {
                alert("Fel vid läsning av JSON-fil: " + err.message);
            }
        };
        reader.readAsText(file);
    }
    // Återställ inputfältet så att man kan ladda upp samma fil igen
    event.target.value = null;
});


// ---- Global Sökfunktion (Jämför Priser) ----

// Lyssnare för "Jämför" knappen
document.getElementById('global-search-btn').addEventListener('click', () => {
    const articleNumber = document.getElementById('global-search-input').value;
    handleGlobalSearch(articleNumber);
});

// Lyssnare för Enter-tryckning i sökfältet
document.getElementById('global-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const articleNumber = e.target.value;
        handleGlobalSearch(articleNumber);
    }
});

/**
 * KORRIGERAD FUNKTION:
 * Skapar och visar länk-knappar i sökresultatcontainern.
 * Inkluderar nu 'X'-knappen och den flexibla behållaren.
 */
function handleGlobalSearch(articleNumber) {
    const resultsContainer = document.getElementById('global-search-results');
    const globalSearchInput = document.getElementById('global-search-input');
    
    if (articleNumber.trim() === '') {
        resultsContainer.style.display = 'none';
        return;
    }

    // Samla alla länkknappar i en separat variabel
    const linkButtonsHTML = `
        <a href="https://www.trodo.se/catalogsearch/result/?q=${articleNumber}" target="_blank" class="lank-knapp trodo-btn">Trodo</a>
        <a href="https://www.bildelsbasen.se/?link=search&searchmode=1&query=${articleNumber}" target="_blank" class="lank-knapp">Sök på Bildelsbasen<span class="orange-asterisk">*</span></a>
        <a href="https://www.aero-m.se/search/?search=${articleNumber}" target="_blank" class="lank-knapp aero-m-btn">Aero M</a>
        <a href="https://www.thansen.se/search/?q=${articleNumber}" target="_blank" class="lank-knapp thansen-btn">Thansen</a>
        <a href="https://www.google.com/search?q=${articleNumber}" target="_blank" class="lank-knapp egen-lank-btn">Egen Sökning</a>
    `;

    // Bygg den slutliga HTML-strukturen med stängningsknapp och flex-behållare
    resultsContainer.innerHTML = `
        <button id="global-search-close-btn">&times;</button>
        <div class="global-search-results-links">${linkButtonsHTML}</div>
    `;

    resultsContainer.style.display = 'block';

    // Lägg till eventlyssnare för den nya stängningsknappen för att stänga rutan och rensa sökningen
    document.getElementById('global-search-close-btn').addEventListener('click', () => {
        resultsContainer.style.display = 'none';
        globalSearchInput.value = '';
    });
}


// ---- Initiering vid sidladdning ----

// Kör funktionerna när DOM är laddad
document.addEventListener('DOMContentLoaded', () => {
    initializeAddFormState();
    initializeCollapseState();
    loadLagerData();
});
