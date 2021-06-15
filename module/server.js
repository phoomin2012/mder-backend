import http from 'http'
import Express from 'express'
import { Server } from 'socket.io'

export const app = Express()

const httpServer = http.createServer(app)

export const io = new Server(httpServer, {

})

export function startServer () {
  httpServer.listen(process.env.PORT, () => {
    console.log('Start server')
  })
}
