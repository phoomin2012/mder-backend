import './module/mongoose.js'
import { app, io, startServer } from './module/server.js'

import socketAuthMiddleware from './middleware/socketAuth.js'

import staffRoute from './route/staff.js'
import authRoute from './route/auth.js'

// Express Middleware

// Socket.io Middleware
io.use(socketAuthMiddleware)

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)

// Socket handle
io.on('connect', (socket) => {
  console.log('New socket')
  setTimeout(() => {
    socket.emit('message', {
      event: [
        {
          type: 'popup',
          message: {
            title: 'Test',
            text: 'ทดสอบๆ',
            icon: 'warning',
          },
        },
      ],
    })
  }, 5000)
})

startServer()
