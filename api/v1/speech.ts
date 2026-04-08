import { Request, Response } from 'express';
import { router } from '../../service/router';
import { SpeechRequest } from '../../service/engine/types';

export const handleSpeechRequest = async (req: Request, res: Response) => {
    try {
        const body = req.body as SpeechRequest;

        if (!body.input || !body.voice) {
            return res.status(400).json({ error: 'Missing required parameters: input and voice' });
        }

        if (body.stream) {
            // Streaming response
            res.setHeader('Content-Type', 'audio/mpeg'); // or appropriate format based on response_format
            res.setHeader('Transfer-Encoding', 'chunked');

            await router.handleSpeechRequestStream(body, (chunk) => {
                res.write(chunk);
            });

            res.end();
        } else {
            // Non-streaming response
            const audioBuffer = await router.handleSpeechRequest(body);

            // Map response_format to content type
            let contentType = 'audio/mpeg';
            if (body.response_format === 'opus') contentType = 'audio/ogg';
            if (body.response_format === 'pcm') contentType = 'audio/pcm';

            res.setHeader('Content-Type', contentType);
            res.status(200).send(audioBuffer);
        }
    } catch (error) {
        console.error('[Speech API Error]', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
