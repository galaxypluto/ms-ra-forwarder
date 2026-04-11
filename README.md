# Hybrid TTS Gateway

A high-availability, high-performance hybrid Text-to-Speech gateway system. This project unifies the best TTS engines and cloud fallbacks, providing a seamless OpenAI-compatible API and WebSocket streaming interface. It's designed to provide the ultimate TTS backend for Next.js apps, Dify workflows, OpenWebUI, and more.

## Architecture

The system is built on four highly complementary core modules:

### 1. Router / Gateway (Entry Point)
*   **Protocols**: Exposes industry-standard REST API (`/v1/audio/speech`) completely compatible with OpenAI's format, and a WebSocket endpoint (`/v1/audio/speech/ws`) for pseudo-streaming.
*   **Advantage**: "Plug and Play" compatibility. Just replace the OpenAI API base URL with your deployed gateway address to utilize the powerful TTS capabilities without modifying any business logic in your frontend applications.

### 2. Chatterbox-Turbo (English & Highly Expressive Engine)
*   **Routing Condition**: Triggered when the input text is pure English or contains emotion tags (e.g., `[laugh]`, `[cough]`).
*   **Advantage**: Leverages Chatterbox's ultra-low latency and top-tier natural English prosody, making it the ideal foundation for English customer service and conversational agents.

### 3. OmniVoice (Multilingual & Voice Design Engine)
*   **Routing Condition**: Triggered when the input contains complex languages (like Chinese or Japanese) or when the user passes a voice design prompt via an extended parameter (e.g., `{"instruct": "female, Sichuan dialect, whisper"}` through `extra_body.instruct`).
*   **Advantage**: Covers 600+ languages and offers highly creative Voice Design capabilities, perfectly compensating for Chatterbox's limitations with Chinese and dialect expressiveness.

### 4. Edge-TTS (Serverless Online Fallback)
*   **Routing Condition**: A high-availability cloud fallback strategy automatically triggered if local GPUs are out of memory (OOM), or if the gateway is running on a cheap CPU-only server without VRAM.
*   **Advantage**: Guarantees High Availability (HA). Users will never hear an error and are always guaranteed a clear, synthesized voice response.

## Engineering Features & Solutions

### VRAM Management (Handling OOM)
While OmniVoice and Chatterbox have relatively low individual VRAM requirements (4GB~6GB each), loading both simultaneously on a standard 8GB GPU will cause Out of Memory errors. To solve this, the architecture supports:
*   **Lazy Loading & Dynamic Offloading**: Model weights can be dynamically swapped between GPU VRAM and CPU RAM based on demand, similar to Ollama.
*   **Microservice Independence**: Engines can be deployed as independent microservices to distribute hardware loads.
*(Note: These are handled seamlessly. If an engine fails to load due to OOM, the system gracefully degrades to Edge-TTS.)*

### Pseudo-Streaming via WebSocket
To support low first-byte latency, especially for engines that only output entire `.wav` files at once:
*   The gateway splits long text inputs by punctuation (commas, periods, etc.).
*   It feeds the first sentence to the TTS engine and instantly pushes the resulting audio binary chunk to the frontend via WebSocket/SSE.
*   While the first chunk is playing, the backend generates the next sentence, achieving pseudo-streaming with minimal perceivable delay.

### OpenAI API Adaptation
The system perfectly translates standard OpenAI `voice` parameters to the underlying engines using a mapping table:
*   `voice="alloy"` -> Maps to Chatterbox (Default Male)
*   `voice="nova"` -> Maps to OmniVoice (Sweet Chinese/English Female)
*   Supports extended parameters (e.g., `custom_voice_id` or `instruct`) via the request payload for advanced voice design.

## Deployment & Usage

### Running Locally

```bash
# Clone the repository
git clone <your-repo-url>
cd hybrid-tts-gateway

# Install dependencies
npm install

# Build the TypeScript code
npm run build

# Start the server
npm start
```

### Using the API

The REST API endpoint is located at `/v1/audio/speech`.

**Example Request:**
```bash
curl -X POST http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello, this is a test of the Hybrid TTS Gateway.",
    "voice": "alloy"
  }'
```

*(For streaming WebSocket connections, connect to `ws://localhost:3000/v1/audio/speech/ws` and send JSON messages containing a `speech_request`.)*

## Disclaimer

This project integrates various external tools, libraries, and potentially reverse-engineered cloud endpoints (like Edge-TTS) as fallbacks. Please ensure you are not violating any terms of service for the respective services. This project is intended for educational and research purposes.
