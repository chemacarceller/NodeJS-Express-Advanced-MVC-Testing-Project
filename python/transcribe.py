import sys
import os
import json
import torch
import pandas as pd
import whisperx
from pyannote.audio import Pipeline


# device
# • "cuda": Uses an NVIDIA graphics card. Recommended for better speed.
# • "cpu": Uses the processor. Much slower; only ideal if you do not have a dedicated graphics card.

# model_name
# • "tiny": ~1 GB VRAM. Extremely fast, basic accuracy.
# • "base": ~1 GB VRAM. Fast, slightly better than "tiny".
# • "small": ~2 GB VRAM. A good balance for quick testing.
# • "medium": ~5 GB VRAM. Very good accuracy for Spanish.
# • "large-v2" / "large-v3": ~10 GB VRAM (in float16). Highest available accuracy.
# • "large-v3-turbo": ~6 GB VRAM. Nearly the same accuracy as "large-v3" but much faster.

# compute_type
# • "float16": Maximum precision and speed on modern NVIDIA GPUs (RTX 2000 series and later). Does not work on CPU.
# • "int8_float16": A hybrid approach; maintains high accuracy while reducing VRAM usage. Ideal for GPUs with limited memory (e.g., 4 GB or 6 GB).
# • "int8": Uses half the memory of "float16" and is the fastest option on a CPU, with an almost imperceptible loss in accuracy.
# • "float32": Full precision without compression. Consumes a large amount of memory and is slow; only useful if your older hardware fails with the other options.

# The default configuration provided here is optimized for 4 GB of VRAM and geared toward translation.
# For 4 GB RTX, you should choose between this setup or "large-v3-turbo" with "int8_float16"
# -> the latter is more efficient if you are working exclusively with Spanish

# For 4GB GTX small - int8
DEVICE = "cuda"

MODEL_NAME = os.getenv("WHISPER_MODEL", "medium")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE", "float16")

# • language (LANGUAGE). Forces the language of the audio (e.g., "es", "en").
# If left as None, the model will detect the language automatically, although setting it speeds up the process and prevents errors in short audio clips.
# • vad_method (VAD_METHOD). Selects the Voice Activity Detection engine
# used to segment the audio before transcription. Supports "pyannote" (default) or "silero"
# The main difference lies in the balance between conversational accuracy and speed/lightness:
# pyannote offers greater accuracy in complex dialogues with multiple speakers and makes excellent use of the GPU,
# while silero is much lighter, faster on the CPU, and does not require external permissions or tokens.
LANGUAGE = "es"
VAD_METHOD = "silero"

# The batch_size parameter defines how many audio fragments the model processes simultaneously in parallel during each transcription step.
# It does not affect transcription accuracy;
# A higher batch_size (for example, 16 or 32) takes advantage of graphics card parallelism,
# drastically increasing transcription speed (up to 70x faster than real-time).
# The higher the batch_size, the more memory is consumed at once.
BATCH_SIZE = 4



def main():

    # Prevent memory fragmentation in PyTorch before importing torch/whisperx
    os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"

    # Validate that the path to the audio file is received as an argument
    if len(sys.argv) < 2:
        print(json.dumps({"error": "The audio file path was not provided."}))
        sys.exit(1)

    audio_file_path = sys.argv[1]

    # Hugging Face token
    hf_token = os.environ.get("HF_TOKEN", "YOUR_HUGGING_FACE_TOKEN")

    try:
        # Load the WhisperX model
        model = whisperx.load_model(
            MODEL_NAME,
            DEVICE,
            compute_type=COMPUTE_TYPE,
            language=LANGUAGE,
            vad_method=VAD_METHOD,
        )

        # Load and transcribe the audio (reduced batch_size to avoid VRAM overflow)
        audio = whisperx.load_audio(audio_file_path)
        result = model.transcribe(audio, batch_size=BATCH_SIZE, language=LANGUAGE)

        # Align word timestamps
        model_a, metadata = whisperx.load_align_model(
            language_code=result["language"], 
            device=DEVICE
        )

        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            DEVICE,
            return_char_alignments=False,
        )

        # Load the Pyannote diarization pipeline (v3.1)
        diarize_model = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token=hf_token
        )

        if DEVICE == "cuda":
            diarize_model.to(torch.device("cuda"))

        # Prepare the audio in memory (avoids the torchcodec error with .m4a files)
        waveform = torch.from_numpy(audio).unsqueeze(0)

        # WhisperX normalizes audio to 16kHz
        sample_rate = 16000

        audio_input = {
            "waveform": waveform,
            "sample_rate": sample_rate
        }

        # Perform diarization using the audio in memory
        diarize_output = diarize_model(audio_input)
        
        # Extract the annotation safely
        annotation = diarize_output.speaker_diarization if hasattr(diarize_output, "speaker_diarization") else diarize_output

        # Convert Pyannote output into a Pandas DataFrame compatible with WhisperX
        records = []
        for segment, _, speaker in annotation.itertracks(yield_label=True):
            records.append({
                "start": segment.start, 
                "end": segment.end, 
                "speaker": speaker
            })
        diarize_df = pd.DataFrame(records)

        # Assign speakers to the final transcription result
        result = whisperx.assign_word_speakers(diarize_df, result)

        # Return the complete result in JSON format for Node.js
        print(json.dumps(result, ensure_ascii=False))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

if __name__ == "__main__":
    main()