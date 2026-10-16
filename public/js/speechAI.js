import  IAgent from './iAgent.js';
import  SpeechAgent from './speechAgent.js';

const iAgent = new IAgent();

async function init() {
  let speechAID = sessionStorage.getItem('speechAID');
  if (!speechAID) speechAID = await iAgent.initializeAgent(); 
  console.log("=> speechAI.js... speechAID = " + speechAID);
}

document.addEventListener('DOMContentLoaded', () => {

  init();

  const inputMessage = document.getElementById('inputMessage');
  const btnVoice = document.getElementById('btnVoice');
  const btnSend = document.getElementById('btnSend');
  const outputResponse = document.getElementById('outputResponse');
  const text2Voice = document.getElementById('Text2Voice');
  const eventInput = new Event('input', { bubbles: true });


  const speechAgent = new SpeechAgent();   

  // I click the submit button
  btnSend.addEventListener('click', async () => {

    speechAgent.stopHearing();

    outputResponse.value = '';
    outputResponse.dispatchEvent(eventInput);

    const message = inputMessage.value.trim();
  
    if (message === "") {
      inputMessage.placeholder = "Please write a message before sending.";
      return;
    }
  
    outputResponse.value = await iAgent.sendMessageToChat(sessionStorage.getItem('speechAID'), message);
    outputResponse.value += " ";
    outputResponse.dispatchEvent(eventInput);

  });


  // Text begins to appear in the response text box
  let lastReadPosition = 0;     
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

      if ((text2Voice.checked) && (newFragment.length > 0)) speechAgent.speak(newFragment);

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

});