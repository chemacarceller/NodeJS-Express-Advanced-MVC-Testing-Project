const HOST_IAGENT = process.env.HOST_IAGENT || '127.0.0.1';
const PORT_IAGENT = process.env.PORT_IAGENT || '4500';
const PRIVATE_AGENT_URL = `http://${HOST_IAGENT}:${PORT_IAGENT}/api`; 

// Controller class that handles all AJAX requests
class ApiIAgentController {

    constructor() {
    }

    async initAgent(req, res) {
    
        try {

            const { mode } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/init-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mode: mode || 'NormalDB'
                })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));
    
            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Intelligence Agent sucessfully initialized',
                sessionId: data.sessionId,
                status: response.status 
            });            

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to intialize the agent';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }


    async createCustomModel(req, res) {
        
        try {

            const { sessionId, modelName, from, system, parameters } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/create-custom-model`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, modelName, from, system, parameters })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model created successfully',
                status: response.status 
            });

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to create custom model';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }


    async fixModelSystem(req, res) {

        try {

            const { sessionId, system, parameters } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/fix-model-system`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, system, parameters })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Model fixed successfully',
                status: response.status 
            });

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to fix the model';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }


    async sendMessage(req, res) {

        try {

            const { sessionId, message, type, promptWrapper, model } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/send-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, message, type, promptWrapper, model })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                message: 'Message sent successfully',
                answer: data.answer,
                status: response.status 
            });            

        } catch (error) {

            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to send the message';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }

    async expiredSessionConsult(req, res) {

        try {

            const { sessionId } = req.body;

            // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/expired-session-consult`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            });

            const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));

            // Respond to the HTTP client to close the request
            return res.status(200).json({ 
                success: true, 
                msg: data.msg,
                status: data.status 
            });

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to consult the expired session';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }

    async closureCancel(req, res) {

        try {

            const { activeSessionIds } = req.body;

            console.log("REQUEST TO CANCEL SESSIONS : " + activeSessionIds);

            // // We make the request to the intelligence agent service
            // const response = await fetch(`${PRIVATE_AGENT_URL}/closure-notify`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ sessionId })
            // });

            // const data = await response.json();

            // // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            // if (!response.ok) throw new Error(JSON.stringify(data));

            return res.sendStatus(204); 

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to cancel the closure';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }

    async closureNotify(req, res) {

        try {

            const { activeSessionIds } = req.body;

            console.log("REQUEST TO SUBMIT SESSIONS FOR CLOSING : " + activeSessionIds);

            // // We make the request to the intelligence agent service
            const response = await fetch(`${PRIVATE_AGENT_URL}/closure-notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ activeSessionIds })
            });

             const data = await response.json();

            // If an error has occurred in the Intelligence Agent module, we forward it to the catch block
            if (!response.ok) throw new Error(JSON.stringify(data));

            return res.sendStatus(204); 

        } catch (error) {


            const realDetail = error.cause ? error.cause.message : error.message;

            let errorTarget = 'Error in the Agent API Controller Module Failed to notify the closure';
            let detailsTarget = realDetail;

            if (this.#isJsonValid(realDetail)) {
                const parsedJson = JSON.parse(realDetail);
                errorTarget = parsedJson.error || errorTarget;
                detailsTarget = parsedJson.details || parsedJson;
            }

            return res.status(500).json({
                success: false,
                error: errorTarget,
                details: detailsTarget
            });        
        }
    }   
    
    #isJsonValid(str) {
        if (typeof str !== 'string') return false;
        try {
            const result = JSON.parse(str);
            return (typeof result === 'object' && result !== null);
        } catch (e) {
            return false;
        }
    }
}

module.exports = ApiIAgentController;