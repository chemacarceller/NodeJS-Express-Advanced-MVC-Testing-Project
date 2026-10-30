const AudioAnalyzerAIModel = require('../models/audioanalyzerAIModel'); 

class AudioAnalyzerAIRepository { 
    constructor() {
        this.audioanalyzerAIMepository = new AudioAnalyzerAIModel();
    }
};

module.exports = AudioAnalyzerAIRepository;