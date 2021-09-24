import connectDB from './module/mongoose.js'
import { app, io, startServer } from './module/server.js'
// Import middleware
import socketAuthMiddleware from './middleware/socketAuth.js'
// Import route
import authRoute from './route/auth.js'
import staffRoute from './route/staff.js'
import patientRoute from './route/patient.js'
import checkInOutRoute from './route/check.js'
import CountdownRoute from './route/countdown.js'
import HistoryRoute from './route/history.js'
// Import socket event
import onConnect from './socket/onConnect.js'
import onCountdownRemove from './socket/onCountdownRemove.js'
import { startTask as startCollectorTask } from './task/dataCollector.js'

// Express Middleware

// Socket.io Middleware
io.use(socketAuthMiddleware)

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)
app.use('/api', patientRoute)
app.use('/api', checkInOutRoute)
app.use('/api', CountdownRoute)
app.use('/api', HistoryRoute)

// Socket handle
//    On socket connect
io.on('connect', async (socket) => {
  console.log(`👨 New socket ➡️ ${socket.handshake.user.name} ${socket.handshake.user.lastName} (${socket.handshake.user.role})`)
  onConnect(socket)
  onCountdownRemove(socket)
})

const [,, mode] = process.argv

async function run () {
  await connectDB()
  if (mode === 'mock') {
    (await import('./task/simulation.js')).startTask()
  } else {
    startCollectorTask()
    await startServer()
  }
}
async function forTest () {
  await connectDB()
}

if (process.env.NODE_ENV !== 'test') {
  run()
} else {
  forTest()
}

export default app
