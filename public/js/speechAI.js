import  IAgent from './iAgent.js';
import  SpeechAgent from './speechAgent.js';

console.log("Testing speechAI.js..." + Math.floor(Math.random() * 100000));
console.log("=> speechAI.js... speechAID = " + sessionStorage.getItem('speechAID'));

const inputMessage = document.getElementById('inputMessage');
const btnVoice = document.getElementById('btnVoice');
const btnSend = document.getElementById('btnSend');
const outputResponse = document.getElementById('outputResponse');

const iAgent = new IAgent();
const eventoInput = new Event('input', { bubbles: true });

btnSend.addEventListener('click', async () => {

  outputResponse.value = '';
  outputResponse.dispatchEvent(eventoInput);

  const message = inputMessage.value.trim();
  
  if (message === "") {
    inputMessage.placeholder = "Please write a message before sending.";
    return;
  }
  
  outputResponse.value = await iAgent.sendMessageToChat(sessionStorage.getItem('speechAID'), message);
  outputResponse.value += " ";
  outputResponse.dispatchEvent(eventoInput);

});

iAgent.initializeAgent();




let lastReadPosition = 0;

const speechAgent = new SpeechAgent();        
outputResponse.addEventListener('input', (e) => {

  const fullText = outputResponse.value;

  lastReadPosition = fullText.length > lastReadPosition ? lastReadPosition : fullText.length;

  if (fullText.length < lastReadPosition) {
    lastReadPosition = fullText.length;
    return;
  }

  // Detects whether the last entered character is a read trigger (space, period, comma, line break)
  const lastCharacter = fullText.slice(-1);

  if ([' ', '.', ',', '\n'].includes(lastCharacter)) {
    
    const newFragment = fullText.substring(lastReadPosition).trim();

    if (newFragment.length > 0) speechAgent.speak(newFragment);

    // Updates the pointer to track how far we have read
    lastReadPosition = fullText.length;

  }
});

// If the user deletes text manually, we reset the read pointer.
outputResponse.addEventListener('keydown', (e) => {
  if (e.key === 'Backspace' || e.key === 'Delete') setTimeout(() => { lastReadPosition = outputResponse.value.length; }, 10);
});

btnVoice.addEventListener('click', () => {
  speechAgent.hear();
});