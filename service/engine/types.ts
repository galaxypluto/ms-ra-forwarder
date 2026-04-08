export interface SpeechRequest {
    model?: string;
    input: string;
    voice: string;
    response_format?: string;
    speed?: number;
    stream?: boolean;
    // Extended parameters
    extra_body?: {
        instruct?: string;
        custom_voice_id?: string;
    };
}

export interface TTSEngine {
    name: string;
    generate(request: SpeechRequest): Promise<Buffer>;
    generateStream(request: SpeechRequest, onData: (chunk: Buffer) => void): Promise<void>;
}

export class EngineUnavailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EngineUnavailableError';
    }
}

export class OOMError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'OOMError';
    }
}
