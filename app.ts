import * as express from 'express'
import * as bodyParser from 'body-parser'
import * as http from 'http'
import { WebSocketServer } from 'ws'
import { handleSpeechRequest } from './api/v1/speech'
import { handleWebSocketConnection } from './api/v1/ws'

const app = express()

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

// Parse application/json for the new v1 API
app.use(bodyParser.json())

// New OpenAI Compatible Endpoint
app.post('/v1/audio/speech', handleSpeechRequest)

const server = http.createServer(app)

// Mount WebSocket server
const wss = new WebSocketServer({ server, path: '/v1/audio/speech/ws' })

wss.on('connection', handleWebSocketConnection)

server.listen(port, () => {
  console.info(`应用正在监听 ${port} 端口`)
})
