const HomeService = require('../services/homeService');


class HomeController {

  constructor() {
    this.homeService = new HomeService();
    this.start = this.start.bind(this);
  }

  async start(req, res, next) {
    
    try {

      // No data to retrieve on this home page
    
      // Renders the 'views/homeView.ejs' file and passes data to it
      res.render('homeView', { 
        title: 'Home - My Testing Web Site',
        message: 'Hello! EJS is configured correctly.' 
      });
    
    } catch (error) {
      // The next function is a built-in Express tool. 
      // By passing the error parameter to it, Express halts the normal execution of the current route 
      // and jumps directly to the error-handling middleware configured at the end of app.js.
      next(error); 
    }
  }
}

module.exports = HomeController;