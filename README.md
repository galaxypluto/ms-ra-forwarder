# Hybrid TTS Gateway

**A High-Availability, High-Performance Hybrid TTS Gateway System.**

Hybrid TTS Gateway is a commercial-grade text-to-speech routing system that seamlessly combines the unique strengths of various TTS engines into a single, unified, OpenAI-compatible API. It is designed to be a drop-in replacement for any application currently using the OpenAI API, providing an unparalleled voice experience with zero code changes required on the client side.

By intelligently routing requests based on language, voice parameters, and even emotion tags, the Gateway orchestrates multiple underlying AI models to deliver the perfect voice response—whether you need ultra-low latency conversational English, highly expressive multi-lingual and regional dialect voices, or a robust, zero-cost cloud fallback.

## 🌟 Core Features & Architecture

The system is built on four core, complementary modules:

### A. The Router / Gateway (Routing Control Center)
- **Role:** Serves as the universal entry point for users, fully compatible with industry-standard protocols.
- **Protocols:**
  - **REST API:** Completely compatible with OpenAI's `/v1/audio/speech` endpoint.
  - **WebSocket:** Supports pseudo-streaming (`/v1/audio/speech/ws`) for real-time conversational agents.
- **Advantage:** Whether your frontend is built with Next.js, Dify workflows, or OpenWebUI, simply point your OpenAI base URL to this service, and enjoy an instant upgrade to next-gen TTS without modifying your business logic.

### B. Chatterbox-Turbo (English & High-Fidelity Conversational Engine)
- **Role:** Handles pure English text or inputs containing emotion tags (e.g., `[laugh]`, `[sigh]`).
- **Advantage:** Leverages Chatterbox’s incredibly low latency and top-tier natural English prosody, making it the ultimate foundation for English AI customer service and conversational bots.

### C. OmniVoice (Multi-Lingual, Chinese & Voice Design Engine)
- **Role:** Takes over when the input contains complex languages like Chinese or Japanese, or when a user employs prompt-based voice creation (e.g., using `{"instruct": "female, Sichuan dialect, whisper"}` via the `extra_body` parameter).
- **Advantage:** Harnesses OmniVoice's massive 600+ language coverage and highly creative "Voice Design" capabilities, perfectly compensating for Chatterbox's limitations in Chinese dialects and expressive role-play.

### D. Edge-TTS (Serverless Cloud Fallback)
- **Role:** The ultimate safety net. A zero-cost, highly reliable cloud fallback strategy.
- **Trigger:** If your local servers run out of VRAM (OOM) or the Gateway is deployed on cheap, CPU-only servers.
- **Advantage:** Guarantees High Availability (HA). Users will never hear an error message; they will always receive clear, high-quality audio, no matter the server load.

## 🚀 Technical Highlights & Solutions

### 1. VRAM Management & Lazy Loading
Running both OmniVoice and Chatterbox simultaneously on consumer-grade GPUs (e.g., 8GB VRAM) can lead to Out-Of-Memory (OOM) errors. Our architecture is designed to handle this gracefully. By structuring the models as independent microservices and implementing intelligent offloading (swapping model weights between GPU and CPU RAM, similar to Ollama), the system maximizes resource utilization while preventing crashes.

### 2. Pseudo-Streaming (WebSocket Chunking)
While the OpenAI API natively supports Server-Sent Events (SSE) and Edge-TTS is inherently streaming, local models like OmniVoice and Chatterbox typically require generating the entire audio file before returning it.
**Our Solution:** The Gateway implements smart text chunking. It slices long input text by punctuation (commas, periods) and feeds the first sentence to the model. As soon as the first chunk's audio is generated, it's pushed to the frontend via WebSocket, while the backend processes the next sentence in parallel. This drastically reduces Time-To-First-Byte (TTFB) and provides a seamless, ultra-low latency pseudo-streaming experience.

### 3. Native OpenAI API Adaptability
The OpenAI API only exposes a limited set of voice names (e.g., `alloy`, `nova`, `echo`). We bridge this gap using a powerful **Mapping Map**:
- Requesting `voice="alloy"` routes automatically to Chatterbox's default male conversational voice.
- Requesting `voice="nova"` routes to OmniVoice's sweet bilingual female voice.
- Advanced users can pass custom configurations via `extra_body`, such as `custom_voice_id` or `instruct`.

## 💻 Getting Started

### Prerequisites
- Node.js installed
- (Optional) Local GPU for running OmniVoice and Chatterbox engines

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/hybrid-tts-gateway.git

cd hybrid-tts-gateway

# Install dependencies
npm install

# Build the project
npm run build

# Start the Gateway
npm start
```

### Usage Examples

#### 1. Standard REST API (OpenAI Compatible)

```bash
curl http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello world! This is a test of the Hybrid TTS Gateway.",
    "voice": "alloy"
  }' \
  --output test.mp3
```

#### 2. Advanced Voice Design (Routing to OmniVoice)

```bash
curl http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "这是一段非常棒的测试文本！",
    "voice": "nova",
    "extra_body": {
      "instruct": "female, 四川话, whisper"
    }
  }' \
  --output custom_voice.mp3
```

#### 3. WebSocket Streaming

Connect to `ws://localhost:3000/v1/audio/speech/ws` and send a JSON payload:

```json
{
  "type": "speech_request",
  "payload": {
    "model": "tts-1",
    "input": "This is the first sentence. And this is the second sentence.",
    "voice": "alloy",
    "stream": true
  }
}
```

The server will stream back raw audio chunks as they are generated.

## 🤝 Conclusion
This project doesn't just reinvent the wheel; it builds a luxury vehicle by assembling the best engines from the open-source community (OmniVoice, Chatterbox), outfitting it with premium, free features (Edge-TTS), and providing developers with the most familiar steering wheel available (the OpenAI API).
