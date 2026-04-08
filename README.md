# Hybrid TTS Gateway

A high-availability, high-performance hybrid Text-to-Speech (TTS) gateway system. It provides a robust, drop-in replacement for OpenAI's audio/speech endpoints by intelligently routing requests across specialized local TTS microservices and a serverless fallback.

## 🌟 Core Modules & Architecture

This gateway serves as a unified router offering two industry-standard protocols:
- **REST API** (Fully compatible with OpenAI `/v1/audio/speech`)
- **WebSocket** (Compatible with streaming audio protocols for real-time LLM conversations)

Clients like Next.js apps, Dify workflows, and OpenWebUI can seamlessly use this powerful TTS backend by simply repointing their OpenAI base URL to this service.

### 1. 🚦 The Router / Gateway
Provides the primary unified endpoints. It parses incoming requests, determines the optimal engine based on language, tags, voice mappings, and custom instructions, and seamlessly handles streaming vs. non-streaming responses.

### 2. 🇬🇧 Chatterbox-Turbo: English & High Emotion Engine
When the router detects pure English input or emotion tags (e.g., `[laugh]`, `[cough]`), it routes the request here.
- **Strengths:** Extremely low latency, top-tier natural English prosody, perfect for English customer service and conversational AI.

### 3. 🇨🇳 OmniVoice: Multi-Language & Voice Design Engine
When the input contains complex languages (Chinese, Japanese) or uses prompt-based voice creation (e.g., `{"instruct": "female, Sichuan dialect, whisper"}` via `extra_body`), the router directs the request to OmniVoice.
- **Strengths:** 600+ language support and highly creative Voice Design capabilities via prompt instructions.

### 4. ☁️ Edge-TTS: Online Serverless Fallback
A high-availability strategy (Fallback) invoked automatically when local GPU resources are exhausted (OOM) or when the gateway is deployed on CPU-only/low-resource machines.
- **Strengths:** Ensures 99.9% uptime. The user always receives clear audio, masking temporary backend failures.

## 🛠 Engineering Solutions

- **VRAM Management:** Built around independent backend microservices. OmniVoice and Chatterbox handle requests independently. If a model hits an Out of Memory (OOM) limit or is being dynamically offloaded/lazy-loaded, the router seamlessly catches the failure and redirects to Edge-TTS.
- **WebSocket Pseudo-Streaming:** Local models often generate whole WAV files. The gateway splits long texts by punctuation and processes them sequentially. Once the first sentence is generated, it streams the binary chunk to the client via SSE/WebSocket while rendering the next sentence in the background.
- **OpenAI API Protocol Adapter:** Smooth mapping of standard OpenAI voices to the optimal engine:
  - `voice="alloy"` -> Maps to Chatterbox-Turbo default male voice.
  - `voice="nova"` -> Maps to OmniVoice default sweet bilingual female voice.
  - Custom voices and voice design via `extra_body.instruct`.

## 🚀 Setup & Execution

### Prerequisites
- Node.js (>= 16.x)
- `npm`

### Installation
```bash
git clone https://github.com/yourusername/hybrid-tts-gateway.git
cd hybrid-tts-gateway
npm install
```

### Build and Run
```bash
# Compile the TypeScript codebase
npm run build

# Start the server (Listens on port 3000 by default)
npm start
```

## 🔌 API Endpoints

### 1. OpenAI Compatible REST API
**`POST /v1/audio/speech`**

```json
{
  "model": "tts-1",
  "input": "Hello world, this is a test. [laugh]",
  "voice": "alloy",
  "response_format": "mp3",
  "stream": true
}
```
*Supports extra_body:*
```json
{
  "model": "tts-1",
  "input": "你好，这是一段测试音频。",
  "voice": "nova",
  "extra_body": {
    "instruct": "female, whisper"
  }
}
```

### 2. WebSocket Streaming
**`ws://localhost:3000/v1/audio/speech/ws`**

Send a JSON message:
```json
{
  "type": "speech_request",
  "payload": {
    "input": "First sentence. Second sentence.",
    "voice": "alloy"
  }
}
```
The server will stream back binary audio chunks as they are generated.

---
*This project combines the best engines (OmniVoice, Chatterbox) and a reliable fallback (Edge-TTS) under a unified, familiar OpenAI-compatible interface.*
