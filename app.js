import './module/mongoose.js'
import { app, io, startServer } from './module/server.js'
// Import middleware
import socketAuthMiddleware from './middleware/socketAuth.js'
// Import route
import authRoute from './route/auth.js'
import staffRoute from './route/staff.js'
import patientRoute from './route/patient.js'
import checkInOutRoute from './route/check.js'
import CountdownRoute from './route/countdown.js'
// Import socket event
import onConnect from './socket/onConnect.js'
import onCountdownRemove from './socket/onCountdownRemove.js'

// Express Middleware

// Socket.io Middleware
io.use(socketAuthMiddleware)

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)
app.use('/api', patientRoute)
app.use('/api', checkInOutRoute)
app.use('/api', CountdownRoute)

// Socket handle
//    On socket connect
io.on('connect', async (socket) => {
  console.log('New socket:', socket.handshake.user)
  onConnect(socket)
  onCountdownRemove(socket)
})

if (process.env.NODE_ENV !== 'test') {
  startServer()
}
export default app
