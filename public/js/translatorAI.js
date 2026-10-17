import  IAgent from './iAgent.js';

const iAgent = new IAgent();

async function init() {
  let translatorAID = sessionStorage.getItem('translatorAID');
  if (!translatorAID) translatorAID = await iAgent.initializeAgent('translatorAID', 'SimpleDB'); 
  console.log("=> translatorAI.js... translatorAID = " + translatorAID);
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});