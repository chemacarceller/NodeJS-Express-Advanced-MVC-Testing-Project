const AudioAnalyzerAIRepository = require('../repositories/audioanalyzerAIRepository');

class AudioAnalyzerAIService { 
    constructor() {
        this.audioanalyzerAIRepository = new AudioAnalyzerAIRepository();
    }
};

module.exports = AudioAnalyzerAIService;