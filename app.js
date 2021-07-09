import './module/mongoose.js'
import { app, io, startServer } from './module/server.js'
// Import middleware
import socketAuthMiddleware from './middleware/socketAuth.js'
// Import route
import authRoute from './route/auth.js'
import staffRoute from './route/staff.js'
import patientRoute from './route/patient.js'
// Import socket event
import onConnect from './socket/onConnect.js'

// Express Middleware

// Socket.io Middleware
io.use(socketAuthMiddleware)

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)
app.use('/api', patientRoute)

// Socket handle
//    On socket connect
io.on('connect', async (socket) => {
  console.log('New socket:', socket.handshake.user)
  onConnect(socket)
//   setTimeout(() => {
//     socket.emit('message', {
//       event: [
//         {
//           type: 'popup',
//           message: {
//             title: 'Test',
//             text: 'ทดสอบๆ',
//             icon: 'warning',
//           },
//         },
//       ],
//     })
//   }, 5000)
})

if (process.env.NODE_ENV !== 'test') {
  startServer()
}
export default app
