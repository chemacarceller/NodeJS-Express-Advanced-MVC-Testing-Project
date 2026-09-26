// We obtain the service object responsible for requesting data from the repository object.
// and implement the potential business logic
// The controller class simply manages data loading and view rendering.
const indexService = require('../services/indexService');

const start = async (req, res, next) => {

  try {

    // Renders the 'views/indexView.ejs' file and passes data to it
    res.render('indexView', { 
        title: 'Home - My Testing Web Site',
        message: 'Hello! EJS is configured correctly.' 
    });
    
  } catch (error) {
      next(error); 
  }
};

module.exports = { start };