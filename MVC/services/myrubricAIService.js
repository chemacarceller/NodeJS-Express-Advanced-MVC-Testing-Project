const MyRubricAIRepository = require('../repositories/myrubricAIRepository');

class MyRubricAIService { 
    constructor() {
        this.myrubricAIRepository = new MyRubricAIRepository();
    }
};

module.exports = MyRubricAIService;