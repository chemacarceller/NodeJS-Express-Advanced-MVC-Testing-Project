import  IAgent from './iAgent.js';
import  SpeechAgent from './speechAgent.js';

// Intelligence agent and speech agent objects
const iAgent = new IAgent();
const speechAgent = new SpeechAgent();   

// DOM page elements
const inputMessage = document.getElementById('inputMessage');
const btnVoice = document.getElementById('btnVoice');
const btnSend = document.getElementById('btnSend');
const outputResponse = document.getElementById('outputResponse');
const text2Voice = document.getElementById('Text2Voice');

// definition of an input event
const inputEvent = new Event('input', { bubbles: true });

// The init function is triggered when the page loads
async function init() {

  // We get the conversation ID
  let speechAID = sessionStorage.getItem('speechAID');

  // If we haven't obtained the conversation ID, it means this is the first time we've entered the session.
  // We obtain it by calling the initializeAgent() method.
  if (!speechAID) speechAID = await iAgent.initializeAgent('speechAID','NormalDB'); 

  // We display the conversation ID in the console
  console.log("=> speechAI.js... speechAID = " + speechAID);
}

document.addEventListener('DOMContentLoaded', () => {

  // When the page loads, we execute init()
  init();

  // Event capture ...
  // I click the submit button
  btnSend.addEventListener('click', async () => {

    // We stop listening
    speechAgent.stopHearing();

    // Indicate that we are thinking, disable the button to prevent it from being pressed again,
    // and disable the input text box to prevent any further text from being added.
    outputResponse.value = "Thinking...";
    btnSend.disabled = true; 
    inputMessage.disabled = true; 

  // Get the message to be sent
    const message = inputMessage.value.trim();
  
    if (message === "") {
      inputMessage.placeholder = "Please write a message before sending.";
      return;
    }
  
    // We make the request by sending the message, receive the response, and add a space to it 
    // so that it can be played back up to the very last word, and trigger the input event on that text box
    outputResponse.value = await iAgent.sendMessageToChat(sessionStorage.getItem('speechAID'), message);
    outputResponse.value += " ";
    outputResponse.dispatchEvent(inputEvent);

    // We enable the button and the input message box, having cleared the latter.
    btnSend.disabled = false;
    inputMessage.disabled = false;  
    inputMessage.value = "";

  });


  // Capture the input event
  // Text begins to appear in the response text box   
  outputResponse.addEventListener('input', (e) => {

    let lastReadPosition = 0;  
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

      // We reproduce the text
      if ((text2Voice.checked) && (newFragment.length > 0)) speechAgent.speak(newFragment);

      // Updates the pointer to track how far we have read
      lastReadPosition = fullText.length;
    }
  });

  // If the user deletes text manually, we reset the read pointer.
  outputResponse.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') setTimeout(() => { lastReadPosition = outputResponse.value.length; }, 10);
  });

  // We launch the microphone listener
  btnVoice.addEventListener('click', () => speechAgent.hear(onReturnText, onStateChange, onFinish));

  // Methods to pass to the `hear` function of the microphone listener, in order to keep the code decoupled (callback functions)
  const onReturnText = text => {
    inputMessage.value = text;
    inputMessage.scrollTop = inputMessage.scrollHeight;
  }

  const onStateChange = hearing => {
    if (!btnVoice) return; 
    if (hearing) {
      btnVoice.textContent = "Stop Dictation";
      btnVoice.classList.add('hearing');
    } else {
      btnVoice.textContent = "Start Dictation";
      btnVoice.classList.remove('hearing');    
    }
  }

  const onFinish = () => btnSend.click();

});