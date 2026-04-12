import { TTSEngine, SpeechRequest, EngineUnavailableError, OOMError } from './types';
import { vramManager } from '../vram';

export class OmniVoiceEngine implements TTSEngine {
    name = 'OmniVoice';
    private readonly REQUIRED_VRAM = 6;

    private simulateProcessing(text: string, instruct?: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                vramManager.requestVRAM(this.name, this.REQUIRED_VRAM);
            } catch (error) {
                if (error instanceof OOMError) {
                    reject(error);
                    return;
                }
                reject(error);
                return;
            }

            setTimeout(() => {
                // Simulate an EngineUnavailableError randomly (10% chance) to demonstrate fallback
                if (Math.random() < 0.1) {
                    reject(new EngineUnavailableError('OmniVoice service is currently offline or unreachable'));
                    return;
                }

                // Return a dummy wav buffer
                const mockAudioData = `WAV_HEADER_MOCK_OMNIVOICE [Instruct: ${instruct || 'None'}] [${text}]`;
                resolve(Buffer.from(mockAudioData));
            }, 800); // 800ms simulation
        });
    }

    async generate(request: SpeechRequest): Promise<Buffer> {
        console.log(`[OmniVoiceEngine] Generating full audio for text: ${request.input.substring(0, 20)}...`);
        return this.simulateProcessing(request.input, request.extra_body?.instruct);
    }

    async generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        console.log(`[OmniVoiceEngine] Generating streaming audio for text: ${request.input.substring(0, 20)}...`);
        const buffer = await this.simulateProcessing(request.input, request.extra_body?.instruct);
        // Simulate chunked response
        const chunkSize = Math.ceil(buffer.length / 3);
        for (let i = 0; i < buffer.length; i += chunkSize) {
            onData(buffer.slice(i, i + chunkSize));
            await new Promise(r => setTimeout(r, 150)); // simulate slight streaming delay
        }
    }
}
