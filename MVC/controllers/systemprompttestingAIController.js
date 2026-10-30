const SystemPromptTestingAIService = require('../services/systemprompttestingAIService');

// The controller class simply manages data loading and view rendering.
class SystemPromptTestingAIController {

  constructor() {
    this.systemprompttestingAIService = new SystemPromptTestingAIService();
    this.start = this.start.bind(this);
  }

  async start(req, res, next) {
    
    try {

      // No data to retrieve on this home page
    
      // Renders the 'views/systemprompttestingAIView.ejs' file and passes data to it
      res.render('systemprompttestingAIView', { 
        title: 'System Prompt Testing AI - My Testing Web Site',
      });
    
    } catch (error) {
      // The next function is a built-in Express tool. 
      // By passing the error parameter to it, Express halts the normal execution of the current route 
      // and jumps directly to the error-handling middleware configured at the end of app.js.
      next(error); 
    }
  }
}

module.exports = SystemPromptTestingAIController;