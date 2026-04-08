import { WebSocket } from 'ws';
import { router } from '../../service/router';
import { SpeechRequest } from '../../service/engine/types';

export const handleWebSocketConnection = (ws: WebSocket) => {
    console.log('[WebSocket] Client connected');

    ws.on('message', async (message: string) => {
        try {
            const data = JSON.parse(message.toString());

            if (data.type === 'speech_request') {
                const request: SpeechRequest = data.payload;

                await router.handleSpeechRequestStream(request, (chunk) => {
                    // Send audio chunk as binary data
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(chunk);
                    }
                });

                // Send completion message
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'speech_completed' }));
                }
            }
        } catch (error) {
            console.error('[WebSocket Error]', error);
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: 'Failed to process request' }));
            }
        }
    });

    ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
    });
};
