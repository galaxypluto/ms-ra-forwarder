import { TTSEngine, SpeechRequest, OOMError } from './types';
import { vramManager } from './vram';

export class ChatterboxEngine implements TTSEngine {
    name = 'Chatterbox-Turbo';
    private requiredVRAM = 4; // GB

    private async ensureLoaded(): Promise<void> {
        try {
            await vramManager.load(this.name, this.requiredVRAM);
        } catch (e) {
            throw new OOMError('Failed to load Chatterbox into VRAM');
        }
    }

    private simulateProcessing(text: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate an OOM error randomly (5% chance) to demonstrate fallback
                if (Math.random() < 0.05) {
                    reject(new OOMError('VRAM completely exhausted while running Chatterbox-Turbo'));
                    return;
                }

                // Return a dummy wav buffer (just the text repeated to simulate audio bytes)
                const mockAudioData = `WAV_HEADER_MOCK_CHATTERBOX [${text}]`;
                resolve(Buffer.from(mockAudioData));
            }, 500); // 500ms simulation
        });
    }

    async generate(request: SpeechRequest): Promise<Buffer> {
        await this.ensureLoaded();
        console.log(`[ChatterboxEngine] Generating full audio for text: ${request.input.substring(0, 20)}...`);
        return this.simulateProcessing(request.input);
    }

    async generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        await this.ensureLoaded();
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
