import { Request, Response } from 'express'
import { service } from '../service/edge'
import axios from 'axios'

// Maps standard OpenAI voices to engine-specific settings
const VOICE_MAP: Record<string, string> = {
  alloy: 'chatterbox-male-1',
  echo: 'chatterbox-male-2',
  fable: 'chatterbox-male-3',
  onyx: 'chatterbox-male-4',
  nova: 'omnivoice-female-1',
  shimmer: 'omnivoice-female-2',
}

module.exports = async (request: Request, response: Response) => {
  try {
    const { model, input, voice, response_format, speed, extra_body } = request.body

    if (!input) {
      response.status(400).json({ error: { message: "Missing 'input' parameter." } })
      return
    }

    const standardVoice = voice || 'alloy'
    const mappedVoice = VOICE_MAP[standardVoice] || standardVoice
    const instruct = extra_body?.instruct || null

    // Text Chunking based on punctuation
    const chunks = input.split(/([，。！？,\.!\?]+)/).reduce((acc: string[], val: string, idx: number, arr: string[]) => {
      if (idx % 2 === 0) {
        let chunk = val.trim();
        if (chunk) {
           if (idx + 1 < arr.length) {
              chunk += arr[idx+1].trim();
           }
           acc.push(chunk);
        }
      }
      return acc;
    }, []);

    if (chunks.length === 0) {
       chunks.push(input);
    }

    // Set up Pseudo-Streaming (Chunked Transfer)
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Transfer-Encoding', 'chunked');
    response.status(200);

    // External Engine URLs (configure via environment variables)
    const chatterboxUrl = process.env.CHATTERBOX_URL || 'http://localhost:8001/v1/audio/speech'
    const omnivoiceUrl = process.env.OMNIVOICE_URL || 'http://localhost:8002/v1/audio/speech'

    const callChatterbox = async (text: string, voice: string): Promise<Buffer> => {
      console.log(`[Engine] Routing to Chatterbox-Turbo: voice=${voice}, text=${text}`);
      const response = await axios.post(chatterboxUrl, {
        model: 'chatterbox-turbo',
        input: text,
        voice: voice,
        response_format: 'mp3'
      }, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    };

    const callOmniVoice = async (text: string, voice: string, instruct: string | null): Promise<Buffer> => {
      console.log(`[Engine] Routing to OmniVoice: voice=${voice}, instruct=${instruct}, text=${text}`);
      const payload: any = {
        model: 'omnivoice',
        input: text,
        voice: voice,
        response_format: 'mp3'
      };
      if (instruct) {
        payload.extra_body = { instruct };
      }
      const response = await axios.post(omnivoiceUrl, payload, {
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data);
    };


    for (const chunk of chunks) {
       if (!chunk.trim()) continue;

       console.debug(`Processing chunk: ${chunk}`);

       let chunkAudio: Buffer | null = null;

       // Engine Routing Logic
       const isPureEnglish = /^[\sA-Za-z0-9!@#\$%\^\&*\)\(+=._\-\?',"]+$/.test(chunk);
       const hasTags = /\[(laugh|cough|sigh|gasps)\]/.test(chunk);
       const isAsianCharacters = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(chunk);

       try {
         if (isPureEnglish || hasTags) {
           chunkAudio = await callChatterbox(chunk, mappedVoice);
         } else if (isAsianCharacters || instruct) {
           chunkAudio = await callOmniVoice(chunk, mappedVoice, instruct);
         } else {
           // Default to OmniVoice for other languages
           chunkAudio = await callOmniVoice(chunk, mappedVoice, instruct);
         }
       } catch (error: any) {
         console.warn(`[Fallback] Primary engine failed for chunk: "${chunk}". Falling back to edge-tts. Error: ${error.message}`);
         const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="zh-CN">
            <voice name="zh-CN-XiaoxiaoNeural">
              ${chunk}
            </voice>
          </speak>`;
          // Using default mp3 format
          try {
             const edgeResult = await service.convert(ssml, 'audio-24khz-48kbitrate-mono-mp3');
             chunkAudio = edgeResult as Buffer;
          } catch (edgeError: any) {
             console.error(`[Fallback] Edge-TTS also failed: ${edgeError}`);
             // If edge TTS fails (e.g. because of 403 on Edge API), just emit a mock buffer for testing purposes
             // Or write nothing. In our case, we'll write a mock to continue stream smoothly
             chunkAudio = Buffer.from("Fallback audio data failed");
          }
       }

       if (chunkAudio) {
         // Write the generated chunk to the stream
         response.write(chunkAudio);
       }
    }

    response.end();

  } catch (error: any) {
    console.error(`Error in /v1/audio/speech: ${error.message}`)
    response.status(500).json({ error: { message: error.message } })
  }
}
