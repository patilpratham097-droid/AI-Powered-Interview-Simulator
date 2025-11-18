# Whisper.cpp Setup Guide
## Free, High-Quality Speech Recognition

### Quick Start (Windows)

#### 1. Download Whisper.cpp Server
```bash
# Download pre-built binary from GitHub
# Visit: https://github.com/ggerganov/whisper.cpp/releases
# Download: whisper-bin-x64.zip (or build from source)
```

#### 2. Download Whisper Model
```bash
# Download the base model (good balance of speed/quality)
# Visit: https://huggingface.co/ggerganov/whisper.cpp/tree/main

# Recommended models:
# - ggml-base.en.bin (74 MB) - English only, fast
# - ggml-small.en.bin (466 MB) - English only, better quality
# - ggml-base.bin (142 MB) - Multilingual, fast
```

#### 3. Run Whisper Server
```bash
# Navigate to whisper.cpp directory
cd path/to/whisper.cpp

# Start the server (Windows)
server.exe -m models/ggml-base.en.bin -p 8080

# Or on Linux/Mac
./server -m models/ggml-base.en.bin -p 8080
```

#### 4. Verify Server is Running
Open browser: http://localhost:8080
You should see the Whisper server interface.

---

### Alternative: Docker Setup (Easier)

```bash
# Pull and run Whisper server in Docker
docker run -d -p 8080:8080 \
  --name whisper-server \
  ggerganov/whisper.cpp:latest \
  -m /models/ggml-base.en.bin

# Or use docker-compose (create docker-compose.yml):
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  whisper:
    image: ggerganov/whisper.cpp:latest
    ports:
      - "8080:8080"
    volumes:
      - ./models:/models
    command: -m /models/ggml-base.en.bin -p 8080
    restart: unless-stopped
```

Then run:
```bash
docker-compose up -d
```

---

### Model Comparison

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| tiny.en | 75 MB | Very Fast | Basic | Testing only |
| base.en | 142 MB | Fast | Good | **Recommended for interviews** |
| small.en | 466 MB | Medium | Great | High accuracy needed |
| medium.en | 1.5 GB | Slow | Excellent | Professional use |

---

### Environment Variables

Add to your `.env` file:
```env
WHISPER_URL=http://localhost:8080
WHISPER_MODEL=base.en
WHISPER_LANGUAGE=en
```

---

### Testing

```bash
# Test if Whisper is running
curl http://localhost:8080/health

# Test transcription with a sample audio file
curl -X POST http://localhost:8080/inference \
  -F "file=@sample.wav"
```

---

### Troubleshooting

**Server won't start:**
- Check if port 8080 is available
- Try a different port: `server.exe -m model.bin -p 8081`
- Update WHISPER_URL in .env

**Low accuracy:**
- Use a larger model (small.en or medium.en)
- Ensure audio quality is good (16kHz, mono recommended)
- Check microphone settings

**Slow transcription:**
- Use smaller model (tiny.en or base.en)
- Enable GPU acceleration if available
- Reduce audio chunk size

---

### Performance Tips

1. **Use GPU acceleration** (if available):
   ```bash
   server.exe -m model.bin -p 8080 --use-gpu
   ```

2. **Optimize for real-time**:
   - Use base.en model
   - Send smaller audio chunks (3-5 seconds)
   - Enable streaming mode

3. **Quality vs Speed**:
   - Interviews: base.en or small.en
   - Real-time chat: base.en
   - Transcription: small.en or medium.en

---

### Integration Status

✅ Backend service created: `services/whisperService.js`
⏳ Frontend integration: Next step
⏳ Fallback to Web Speech API: If Whisper unavailable

---

### Next Steps

1. Download and run Whisper server
2. Update backend to use Whisper service
3. Update frontend to send audio to backend
4. Test with real interview session

**Estimated setup time:** 10-15 minutes
**Quality improvement:** 3-5x better than Web Speech API
**Cost:** $0 (completely free!)
