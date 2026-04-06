# High-availability Hybrid TTS Gateway

A commercial-grade, high-performance hybrid TTS gateway system. This project merges the strengths of multiple open-source audio models and cloud services into a single, seamless, and unified API compatible with OpenAI's format.

By utilizing standard protocols (REST API & WebSocket), you can plug this gateway directly into your existing Next.js apps, Dify workflows, or OpenWebUI deployments without modifying any of your business logic. Just change your OpenAI Base URL!

## Core Architecture & Features

This gateway is composed of four distinct layers, each specialized in a specific TTS requirement:

### 1. Gateway Router (The Core)
- Provides full protocol compatibility with OpenAI's `/v1/audio/speech` endpoint.
- Provides intelligent text parsing and punctuation-based text chunking for low-latency pseudo-streaming (chunked transfer).
- Routes requests to the appropriate specialized engine dynamically based on the language/content of your text.

### 2. Chatterbox-Turbo Engine
- **Specialty:** Pure English generation and High-Expressivity (e.g., laughter, coughs, sighs).
- If the gateway detects pure English text or emotion tags (e.g., `[laugh]`), it routes to Chatterbox-Turbo to provide top-tier English naturalness with very low latency.

### 3. OmniVoice Engine
- **Specialty:** Multi-lingual support (600+ languages including Chinese/Japanese) and powerful Voice Design.
- If the gateway detects Asian characters or receives explicit voice instructions via `extra_body.instruct` (e.g. `{"instruct": "female, 四川话, whisper"}`), it automatically hands off to OmniVoice.

### 4. Edge-TTS (Cloud Fallback Strategy)
- **Specialty:** High Availability and VRAM Management.
- If either of the primary engines (Chatterbox or OmniVoice) encounters an error—such as GPU Out-Of-Memory, overload, or offline status—the system gracefully and instantly falls back to using Microsoft Edge-TTS via serverless cloud endpoints. You will never get a failed generation!

## Installation & Deployment

```bash
# Clone the repository
git clone <repository_url>
cd <repository_folder>

# Install Dependencies
npm install

# Build & Run
npm run build
npm start
```

## Usage

### Using the Gateway API

Send a standard OpenAI payload to `/v1/audio/speech`:

```bash
curl -X POST http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "This is an amazing Hybrid Architecture! [laugh]",
    "voice": "alloy"
  }'
```

### Voice Mapping

The standard OpenAI voices are automatically mapped to specialized roles within our hybrid engines:
- `alloy` -> Chatterbox Male 1
- `echo` -> Chatterbox Male 2
- `nova` -> OmniVoice Female 1
- `shimmer` -> OmniVoice Female 2

### Advanced Voice Design

You can inject advanced instructions via the custom `extra_body` payload:

```bash
curl -X POST http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{
    "model": "tts-1",
    "input": "你好，这是一段测试语音。",
    "voice": "nova",
    "extra_body": {
      "instruct": "female, 四川话, whisper"
    }
  }'
```

## Legacy API
The project still supports the older Legado and raw Edge-TTS (`/api/ra`) endpoints for backwards compatibility.

**Note:** This project is intended for learning and architectural reference. Do not use for large-scale commercial deployments without adequate GPU provisioning.
