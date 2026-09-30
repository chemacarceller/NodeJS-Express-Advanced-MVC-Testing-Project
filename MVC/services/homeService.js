// The service class uses the repository class to access data and implements business logic.
const HomeRepository = require('../repositories/homeRepository');

class HomeService { 

    constructor() {
        this.homeRepository = new HomeRepository();
    }
};

module.exports = HomeService;