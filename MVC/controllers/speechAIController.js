// We obtain the service object responsible for requesting data from the repository object.
// and implement the potential business logic
const SppechAIService = require('../services/speechAIService');

// The controller class simply manages data loading and view rendering.
class SpeechAIController {

  constructor() {
    this.speechAIService = new SppechAIService();
    this.start = this.start.bind(this);
  }

  async start(req, res, next) {
    
    try {

      // No data to retrieve on this home page
    
      // Renders the 'views/indexView.ejs' file and passes data to it
      res.render('speechAIView', { 
        title: 'SpeechAI - My Testing Speech for AI',
      });
    
    } catch (error) {
      // The next function is a built-in Express tool. 
      // By passing the error parameter to it, Express halts the normal execution of the current route 
      // and jumps directly to the error-handling middleware configured at the end of app.js.
      next(error); 
    }
  }
}

module.exports = SpeechAIController;