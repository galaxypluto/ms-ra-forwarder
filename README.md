# Hybrid TTS Gateway

A High-Availability, High-Performance Hybrid TTS Gateway system. This system gracefully absorbs the benefits of multiple TTS projects while mitigating their downsides.

## Architecture & Core Modules

The architecture consists of four core modules:

### A. Router/Gateway (The Core)
- **Role**: Serves as the user entry point, exposing two industry-standard protocols: REST API (fully compatible with OpenAI `/v1/audio/speech`) and WebSocket for pseudo-streaming audio.
- **Benefit**: Whether your frontend is built with Next.js, a Dify workflow, or OpenWebUI, you can seamlessly hot-plug this powerful TTS gateway by simply pointing the OpenAI base URL to your service address. No business logic code changes are required.

### B. English & High-Fidelity Specialized Engine: Chatterbox-Turbo
- **Role**: Routes pure English text or inputs with emotion tags (e.g., `[laugh]`, `[cough]`) to this engine.
- **Benefit**: Leverages Chatterbox’s extremely low latency and top-tier naturalness in English, making it the perfect foundation for English customer service and conversational agents.

### C. Multilingual, Chinese, & Voice Design Engine: OmniVoice
- **Role**: Routes complex languages (Chinese, Japanese) or creative character voice prompts (e.g., `{"instruct": "female, Sichuan dialect, whisper"}` using an extended `extra_body` parameter) to OmniVoice.
- **Benefit**: Capitalizes on its coverage of 600+ languages and creative Voice Design capabilities, perfectly complementing Chatterbox's limitations in Chinese and regional dialects.

### D. Online Fallback Strategy: Edge-TTS
- **Role**: Serves as a Serverless, cloud-based fallback strategy.
- **Trigger**: Automatically reroutes requests to Microsoft's Edge-TTS when the server's GPU is fully utilized, or if deployed on CPU-only, low-cost servers.
- **Benefit**: Ensures high availability (HA). Users will always receive clear audio rather than service errors.

## Key Features

- **OpenAI API Compatibility**: Provides endpoints (`/v1/audio/speech` and `/v1/audio/speech/ws`) that mock the OpenAI TTS format, including voice mappings.
- **Pseudo-Streaming**: While OmniVoice and Chatterbox typically return full audio files, this gateway splits text by punctuation and streams chunks via WebSocket/SSE, providing low time-to-first-byte latency.
- **VRAM Management**: Provides foundational structure for managing heavy memory usage from multiple TTS models by lazily routing or offloading models when necessary.

## Setup & Usage

### Installation

Requires Node.js 18+.

```bash
# Clone the repository
git clone https://github.com/meetcw/hybrid-tts-gateway.git
cd hybrid-tts-gateway

# Install dependencies
npm install

# Build the TypeScript project
npm run build
```

### Running

```bash
# Start the server
npm start
```

By default, the server listens on port 3000.

### Usage Example

```bash
curl http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "Hello world, this is the hybrid TTS gateway.",
    "voice": "alloy"
  }' \
  --output speech.mp3
```

*Disclaimer: This project was evolved from ms-ra-forwarder.*
