const URL_PROXY = `${window.location.origin}/api/client`;

export default class IAgent {

    constructor() {
    }

    async initializeAgent() {

        try {
    
            const answer = await fetch(`${URL_PROXY}/init-agent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({mode : 'NormalDB'})
            });

            const data = await answer.json();

            sessionStorage.setItem('speechAID', data.sessionId);
        
            return data.sessionId;

        } catch (error) {      
            console.error('Error initializing:', error);
        }
    }


    async sendMessageToChat(id, text) {

        try {
    
            outputResponse.value = "Thinking...";

            btnSend.disabled = true; 

            inputMessage.disabled = true; 

            const response = await fetch(`${URL_PROXY}/send-message`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: id,
                    message: text
                })
            });

            const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'Unknown server error');
        return data.answer;

        } catch (error) { return "Error: " + error.message;
        } finally {

            btnSend.disabled = false;
            inputMessage.disabled = false;  
            inputMessage.value = "";
        }
    }
}