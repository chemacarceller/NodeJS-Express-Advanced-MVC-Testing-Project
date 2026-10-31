const ManequinManAIService = require('../services/manequinmanAIService');

// The controller class simply manages data loading and view rendering.
class ManequinManAIController {

  constructor() {
    this.manequinmanAIService = new ManequinManAIService();
    this.start = this.start.bind(this);
  }

  async start(req, res, next) {
    
    try {

      // No data to retrieve on this home page
    
      // Renders the 'views/manequinmanAIView.ejs' file and passes data to it
      res.render('manequinmanAIView', { 
        title: 'Manequin Man Animations AI - My Testing Web Site',
      });
    
    } catch (error) {
      // The next function is a built-in Express tool. 
      // By passing the error parameter to it, Express halts the normal execution of the current route 
      // and jumps directly to the error-handling middleware configured at the end of app.js.
      next(error); 
    }
  }
}

module.exports = ManequinManAIController;