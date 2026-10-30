// Accessing environment variables
let config = {};
try {
    const response = await fetch('/api/config');
    config = await response.json();
} catch (error) {
  console.error("Could not load the constants from the .env file: ", error);
}

// When the page loads, we detect whether it’s a reload
const [navigationEntry] = performance.getEntriesByType('navigation');
const isReloading = navigationEntry && navigationEntry.type === 'reload';

// Storing the active session ids
let activeSessionIds = []

// Tells us whether we have already been notified of the session closure
let alreadyNotify = false;

// Detects whether we arrived via internal site navigation
let isInternalNavidation = false;

// Function that fills the activeSessionIds
const fillActiveSessionIds = () => {

    activeSessionIds = [];

    let speechAID = sessionStorage.getItem('speechAID');
    let translatorAID = sessionStorage.getItem('translatorAID');
    if (speechAID) activeSessionIds.push(speechAID);
    if (translatorAID) activeSessionIds.push(translatorAID);
}
fillActiveSessionIds();

// If we are arriving from a page reload and have open sessions, 
// we trigger a potential cancellation of the closure process is F5_CLOSE_SESSION === false
// The idea is that if it is configured to prevent session termination upon an F5 refresh, any requested session termination should be cancelled.
// This is not yet implemented; as it stands, the session would be terminated, but the sessionStorage would not be cleared, which would eventually lead to errors.
if (isReloading && activeSessionIds.length > 0) {
    if (config && config.F5_CLOSE_SESSION === 'false') { 
        fetch('/api/client/closure-cancel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeSessionIds })
        }).catch(() => {});
    }
}

// We detect whether we arrived via a click, which means we are navigating internally
document.addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (link && link.href && link.host === window.location.host) {
        isInternalNavidation = true; 
    }
});

// Used in desktop environments to notify when a tab or browser is being closed.
window.addEventListener('beforeunload', (event) => { 
    
    // If we are arriving from internal navigation
    if (isInternalNavidation) return;

    // We ask whether we really want to leave the page
    // Non-configurable message; it uses the browser's default one
    event.preventDefault();
    event.returnValue = ''; 

    // If we continue, we proceed to pagehide...
});

window.addEventListener('pagehide', () => {

    // If we are arriving from internal navigation
    if (isInternalNavidation) return;

    // Since the user has already agreed to reload/exit in the previous step, 
    // we can now safely send the notification to Node.js
    fillActiveSessionIds();

    // Provided that there are open sessions and no prior notification has been given
    // This is because there is some browser-side code that would cause the request to be sent twice when on desktop.
    if (activeSessionIds.length > 0 && !alreadyNotify) { 
        alreadyNotify = true;
        const url = '/api/client/closure-notify';
        const data = JSON.stringify({ event: 'browser_exit', activeSessionIds });
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
    }
});





// This code is not necessary for desktop browsers.
// It is only required for mobile browsers when the browser is closed, as 'beforeunload' does not function in a mobile environment.
// Unfortunately, this only works for closing the browser itself; closing a tab on mobile must be handled by the server via an automatic closure process.
document.addEventListener('visibilitychange', () => {

    if (isInternalNavidation) return;

    if (document.visibilityState === 'hidden'  && activeSessionIds.length > 0) {

        fillActiveSessionIds();

        const url = '/api/client/closure-notify';
        const data = JSON.stringify({ event: 'browser_exit', activeSessionIds });
        
        // We use a Blob so that Express detects it as legitimate JSON
        const blob = new Blob([data], { type: 'application/json' });
        
        // sendBeacon hands control over to the browser's operating system, ensuring the data is sent
        if (!alreadyNotify) { 
            alreadyNotify = true;
            navigator.sendBeacon(url, blob);
        }
    }
});