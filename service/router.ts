import { SpeechRequest, TTSEngine, EngineUnavailableError, OOMError } from './engine/types';
import { ChatterboxEngine } from './engine/chatterbox';
import { OmniVoiceEngine } from './engine/omnivoice';
import { EdgeTTSEngine } from './engine/edgetts';
import { splitTextByPunctuation } from '../utils/stream';

class GatewayRouter {
    private chatterbox = new ChatterboxEngine();
    private omnivoice = new OmniVoiceEngine();
    private edgetts = new EdgeTTSEngine();

    private containsChineseOrJapanese(text: string): boolean {
        // Simple regex to match Chinese characters or Kana
        return /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/.test(text);
    }

    private containsEmotionTags(text: string): boolean {
        // Matches things like [laugh], [cough]
        return /\[.*?\]/.test(text);
    }

    private determinePrimaryEngine(request: SpeechRequest): TTSEngine {
        if (request.extra_body?.instruct) {
            console.log('[Router] Routing to OmniVoice due to voice instruction.');
            return this.omnivoice;
        }

        if (this.containsChineseOrJapanese(request.input)) {
            console.log('[Router] Routing to OmniVoice due to complex language detection.');
            return this.omnivoice;
        }

        if (this.containsEmotionTags(request.input)) {
            console.log('[Router] Routing to Chatterbox-Turbo due to emotion tags.');
            return this.chatterbox;
        }

        // Default mapping based on voice
        if (request.voice === 'nova') {
            console.log(`[Router] Routing to OmniVoice based on voice mapping: nova`);
            return this.omnivoice;
        }

        if (request.voice === 'alloy') {
            console.log(`[Router] Routing to Chatterbox-Turbo based on voice mapping: alloy`);
            return this.chatterbox;
        }

        // Default to Chatterbox if not specifically handled
        console.log(`[Router] Routing to Chatterbox-Turbo as default pure English handler for voice: ${request.voice}`);
        return this.chatterbox;
    }

    async handleSpeechRequest(request: SpeechRequest): Promise<Buffer> {
        const primaryEngine = this.determinePrimaryEngine(request);

        try {
            return await primaryEngine.generate(request);
        } catch (error) {
            if (error instanceof EngineUnavailableError || error instanceof OOMError) {
                console.warn(`[Router] Primary engine (${primaryEngine.name}) failed with ${error.name}. Falling back to Edge-TTS.`);
                return await this.edgetts.generate(request);
            }
            throw error;
        }
    }

    async handleSpeechRequestStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        const primaryEngine = this.determinePrimaryEngine(request);
        const sentences = splitTextByPunctuation(request.input);

        let activeEngine = primaryEngine;
        let isFallback = false;

        for (const sentence of sentences) {
            const chunkRequest = { ...request, input: sentence };
            try {
                if (isFallback) {
                    await this.edgetts.generateStream(chunkRequest, onData);
                } else {
                    await activeEngine.generateStream(chunkRequest, onData);
                }
            } catch (error) {
                if (!isFallback && (error instanceof EngineUnavailableError || error instanceof OOMError)) {
                    console.warn(`[Router] Engine (${activeEngine.name}) failed during stream with ${error.name}. Switching to Edge-TTS fallback for remaining chunks.`);
                    isFallback = true;
                    await this.edgetts.generateStream(chunkRequest, onData);
                } else {
                    throw error;
                }
            }
        }
    }
}

export const router = new GatewayRouter();
