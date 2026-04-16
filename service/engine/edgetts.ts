import { TTSEngine, SpeechRequest } from './types';
import { service as EdgeService, FORMAT_CONTENT_TYPE } from '../edge/index';

export class EdgeTTSEngine implements TTSEngine {
    name = 'Edge-TTS';

    private createSSML(text: string, voiceName: string): string {
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="${voiceName}">
    ${text}
  </voice>
</speak>`;
    }

    private mapVoice(voice: string): string {
        // Map common OpenAI voices to Edge TTS voices for fallback
        const mapping: Record<string, string> = {
            'alloy': 'en-US-AriaNeural',
            'echo': 'en-US-GuyNeural',
            'fable': 'en-GB-SoniaNeural',
            'onyx': 'en-US-ChristopherNeural',
            'nova': 'zh-CN-XiaoxiaoNeural',
            'shimmer': 'en-US-JennyNeural'
        };
        return mapping[voice] || 'zh-CN-XiaoxiaoNeural';
    }

    private getFormat(response_format?: string): string {
        // Maps response_format to edge-tts format string
        if (response_format === 'mp3') {
            return 'audio-24khz-48kbitrate-mono-mp3';
        } else if (response_format === 'opus') {
            return 'webm-24khz-16bit-mono-opus';
        } else if (response_format === 'pcm') {
            return 'raw-24khz-16bit-mono-pcm';
        }
        return 'audio-24khz-48kbitrate-mono-mp3'; // default
    }

    async generate(request: SpeechRequest): Promise<Buffer> {
        console.log(`[EdgeTTSEngine] Generating audio as fallback for text: ${request.input.substring(0, 20)}...`);
        const voiceName = this.mapVoice(request.voice);
        const format = this.getFormat(request.response_format);
        const ssml = this.createSSML(request.input, voiceName);

        try {
            const result = await EdgeService.convert(ssml, format);
            return result as Buffer;
        } catch (error) {
            console.error('[EdgeTTSEngine] Fallback also failed:', error);
            throw error;
        }
    }

    async generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void> {
        console.log(`[EdgeTTSEngine] Generating streaming audio for text: ${request.input.substring(0, 20)}...`);
        const voiceName = this.mapVoice(request.voice);
        const format = this.getFormat(request.response_format);
        const ssml = this.createSSML(request.input, voiceName);

        try {
            await EdgeService.convert(ssml, format, onData);
        } catch (error) {
            console.error('[EdgeTTSEngine] Stream fallback failed:', error);
            throw error;
        }
    }
}
