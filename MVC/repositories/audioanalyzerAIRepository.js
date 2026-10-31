const AudioAnalyzerAIModel = require('../models/audioanalyzerAIModel'); 

class AudioAnalyzerAIRepository { 
    constructor() {
        this.audioanalyzerAIModel = new AudioAnalyzerAIModel();
    }
};

module.exports = AudioAnalyzerAIRepository;