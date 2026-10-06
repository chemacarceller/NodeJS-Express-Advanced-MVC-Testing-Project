const tipoNavegacion = performance.getEntriesByType("navigation")[0]?.type;
if (tipoNavegacion === 'reload') sessionStorage.removeItem('LayoutID');

if (sessionStorage.getItem('LayoutID') == undefined) sessionStorage.setItem('LayoutID', Math.floor(Math.random() * 1000000000));

console.log(" => layout.js... LayoutID = " + sessionStorage.getItem('LayoutID') );