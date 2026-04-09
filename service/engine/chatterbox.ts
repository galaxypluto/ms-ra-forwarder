import { TTSEngine, SpeechRequest, OOMError, EngineUnavailableError } from './types';
import axios from 'axios';

export class ChatterboxEngine implements TTSEngine {
    name = 'Chatterbox-Turbo';
    private baseUrl = process.env.CHATTERBOX_URL || 'http://localhost:8001/v1/audio/speech';

    private handleError(error: any) {
        if (error.response) {
            const status = error.response.status;
            if (status === 503) {
                throw new EngineUnavailableError('Chatterbox-Turbo service is unavailable');
            } else if (status === 507 || status === 429) { // 507 Insufficient Storage / 429 Too Many Requests (often used for OOM/capacity)
                throw new OOMError('Chatterbox-Turbo VRAM completely exhausted');
            }
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new EngineUnavailableError('Chatterbox-Turbo service is offline');
        }
        throw error;
    }

    async generate(request: SpeechRequest): Promise<Buffer> {
        console.log(`[ChatterboxEngine] Generating full audio for text: ${request.input.substring(0, 20)}...`);
        try {
            const response = await axios.post(this.baseUrl, request, {
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data);
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }

    async generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        console.log(`[ChatterboxEngine] Generating streaming audio for text: ${request.input.substring(0, 20)}...`);
        try {
            const response = await axios.post(this.baseUrl, { ...request, stream: true }, {
                responseType: 'stream'
            });

            return new Promise((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    onData(chunk);
                });
                response.data.on('end', () => {
                    resolve();
                });
                response.data.on('error', (err: any) => {
                    reject(err);
                });
            });
        } catch (error) {
            this.handleError(error);
            throw error;
        }
    }
}
