const tipoNavegacion = performance.getEntriesByType("navigation")[0]?.type;
if (tipoNavegacion === 'reload') sessionStorage.removeItem('LayoutID');

if (sessionStorage.getItem('LayoutID') == undefined) sessionStorage.setItem('LayoutID', crypto.randomUUID());

console.log(" => layout.js... LayoutID = " + sessionStorage.getItem('LayoutID') );