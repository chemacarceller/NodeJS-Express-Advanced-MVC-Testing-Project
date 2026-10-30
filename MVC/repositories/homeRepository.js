const HomeModel = require('../models/homeModel'); 

class HomeRepository { 
    constructor() {
        this.homeModel = new HomeModel();
     }
};

module.exports = HomeRepository;