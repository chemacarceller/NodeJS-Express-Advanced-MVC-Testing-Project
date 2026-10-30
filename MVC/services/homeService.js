const HomeRepository = require('../repositories/homeRepository');

class HomeService { 

    constructor() { 
        this.homeRepository = new HomeRepository();
    }
};

module.exports = HomeService;