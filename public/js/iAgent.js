export default class IAgent {

    constructor() {

    }

    async initializeAgent() {

        try {
    
            const answer = await fetch('http://localhost:4500/api/init-agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId : sessionStorage.getItem('speechAID'),
                    mode : 'NormalDB'
                })
            });

            const data = await answer.json();

        } catch (error) {      
            console.error('Error initializing:', error);
        }
    }


    async sendMessageToChat(id, text) {

        try {
    
            outputResponse.value = "Thinking...";

            btnSend.disabled = true; 

            inputMessage.disabled = true; 

            const response = await fetch('http://localhost:4500/api/send-message', {

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