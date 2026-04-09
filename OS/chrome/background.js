// background.js - Hanterar meddelanden och injicerar script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Lyssna efter begäran att skrapa en specifik sida
    if (request.action === 'INJECT_SCRAPER') {
        const tabId = sender.tab ? sender.tab.id : request.tabId;
        
        if (tabId) {
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: [request.scriptFile] // T.ex. "scraper-ts.js" eller "scraper-carinfo.js"
            }).then(() => {
                console.log(`Injicerade ${request.scriptFile} i flik ${tabId}`);
            }).catch(err => console.error("Fel vid injicering:", err));
        }
    }
});
