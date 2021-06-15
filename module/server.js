import http from 'http'
import Express from 'express'
import IO from 'socket.io'

export const app = Express()
const httpServer = http.createServer(app)
export const io = IO(httpServer, {

})

export function startServer () {
  httpServer.listen(process.env.PORT, () => {
    console.log('Start server')
  })
}
