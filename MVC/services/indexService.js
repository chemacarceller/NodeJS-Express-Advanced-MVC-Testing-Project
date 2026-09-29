// The service class uses the repository class to access data and implements business logic.
const IndexRepository = require('../repositories/indexRepository');

class IndexService { 

    constructor() {
        this.indexRepository = new IndexRepository();
    }
};

module.exports = IndexService;