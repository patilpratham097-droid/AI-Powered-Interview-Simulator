"""
High-Quality Speech Recognition Server using Faster Whisper
Runs locally, completely free, 90-95% accuracy
"""

from faster_whisper import WhisperModel
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Load Whisper model
logger.info("Loading Whisper model (base.en)...")
model = WhisperModel("base.en", device="cpu", compute_type="int8")
logger.info("✅ Whisper model loaded successfully!")

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "ok",
        "model": "base.en (Faster Whisper)",
        "quality": "High (90-95% accuracy)",
        "cost": "Free"
    })

@app.route('/asr', methods=['POST'])
def transcribe():
    """
    Transcribe audio to text
    Expects: multipart/form-data with 'audio_file' field
    Returns: JSON with transcribed text
    """
    try:
        # Check if audio file is present
        if 'audio_file' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio_file']
        
        if audio_file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        logger.info(f"Received audio file: {audio_file.filename}")
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Transcribe with Whisper
            logger.info("Transcribing audio...")
            segments, info = model.transcribe(
                temp_path,
                beam_size=5,
                language="en",
                condition_on_previous_text=False
            )
            
            # Combine all segments
            text = " ".join([segment.text.strip() for segment in segments])
            
            logger.info(f"✅ Transcription complete: {text[:100]}...")
            
            return jsonify({
                "text": text.strip(),
                "language": info.language,
                "success": True
            })
        
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        return jsonify({
            "error": str(e),
            "success": False
        }), 500

@app.route('/transcribe', methods=['POST'])
def transcribe_alt():
    """Alternative endpoint name for compatibility"""
    return transcribe()

if __name__ == '__main__':
    port = int(os.environ.get('WHISPER_PORT', 8080))
    logger.info(f"🚀 Starting Whisper server on port {port}")
    logger.info(f"📡 Endpoints:")
    logger.info(f"   - Health: http://localhost:{port}/health")
    logger.info(f"   - Transcribe: http://localhost:{port}/asr")
    logger.info(f"🎤 Ready for high-quality speech recognition!")
    
    app.run(host='0.0.0.0', port=port, debug=False, threaded=True)
