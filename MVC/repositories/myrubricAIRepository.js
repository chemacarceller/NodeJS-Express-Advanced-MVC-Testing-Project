const MyRubricAIModel = require('../models/myrubricAIModel'); 

class MyRubricAIRepository { 
    constructor() {
        this.myrubricAIModel = new MyRubricAIModel();
    }
};

module.exports = MyRubricAIRepository;