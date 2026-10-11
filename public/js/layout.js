const tipoNavegacion = performance.getEntriesByType("navigation")[0]?.type;
if (tipoNavegacion === 'reload') { 
    sessionStorage.removeItem('speechAID');
    sessionStorage.removeItem('translatorAID');
}

if (sessionStorage.getItem('speechAID') == undefined) sessionStorage.setItem('speechAID', crypto.randomUUID());
if (sessionStorage.getItem('translatorAID') == undefined) sessionStorage.setItem('translatorAID', crypto.randomUUID());

console.log(" => layout.js... speechAID = " + sessionStorage.getItem('speechAID') );
console.log(" => layout.js... translatorAID = " + sessionStorage.getItem('translatorAID') );