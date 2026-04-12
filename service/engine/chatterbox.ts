import { TTSEngine, SpeechRequest, OOMError } from './types';
import { vramManager } from '../vram';

export class ChatterboxEngine implements TTSEngine {
    name = 'Chatterbox-Turbo';
    private readonly REQUIRED_VRAM = 4;

    private simulateProcessing(text: string): Promise<Buffer> {
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
                // Return a dummy wav buffer (just the text repeated to simulate audio bytes)
                const mockAudioData = `WAV_HEADER_MOCK_CHATTERBOX [${text}]`;
                resolve(Buffer.from(mockAudioData));
            }, 500); // 500ms simulation
        });
    }

    async generate(request: SpeechRequest): Promise<Buffer> {
        console.log(`[ChatterboxEngine] Generating full audio for text: ${request.input.substring(0, 20)}...`);
        return this.simulateProcessing(request.input);
    }

    async generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        console.log(`[ChatterboxEngine] Generating streaming audio for text: ${request.input.substring(0, 20)}...`);
        const buffer = await this.simulateProcessing(request.input);
        // Simulate chunked response
        const chunkSize = Math.ceil(buffer.length / 3);
        for (let i = 0; i < buffer.length; i += chunkSize) {
            onData(buffer.slice(i, i + chunkSize));
            await new Promise(r => setTimeout(r, 100)); // simulate slight streaming delay
        }
    }
}
