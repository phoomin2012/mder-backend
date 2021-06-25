import http from 'http'
import Express from 'express'
import { Server } from 'socket.io'

process.env.PORT = process.env.PORT || 3001

export const app = Express()
app.use(Express.json())

const httpServer = http.createServer(app)

export const io = new Server(httpServer, {

})

export function startServer () {
  httpServer.listen(process.env.PORT, () => {
    console.log('Start server 0.0.0.0:' + process.env.PORT)
  })
}
