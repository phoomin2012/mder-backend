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
// Import for initial
import staffModel, { StaffRole } from './model/staff.js'
import { hashPassword } from './module/password.js'
import faker from 'faker'

// Env initial
process.env.SIMULATION = (process.env.SIMULATION === 'true' || process.env.SIMULATION === true)
process.env.INIT_USERNAME = process.env.INIT_USERNAME || 'test'
process.env.INIT_PASSWORD = process.env.INIT_PASSWORD || 'test'
process.env.INIT_USER_ROLE = process.env.INIT_USER_ROLE || 'physician'
process.env.INIT_PHYSICIAN = process.env.INIT_PHYSICIAN || 0
process.env.INIT_NURSE = process.env.INIT_NURSE || 0

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

async function initialSystem () {
  const staff = await staffModel.findOne({
    username: process.env.INIT_USERNAME,
  })

  if (!staff) {
    console.log('Initial system data...')

    await staffModel.create({
      username: process.env.INIT_USERNAME,
      password: hashPassword(process.env.INIT_PASSWORD),
      name: 'Initial',
      lastName: 'Account',
      role: process.env.INIT_USER_ROLE,
    })

    for (let i = 0; i < process.env.INIT_PHYSICIAN; i++) {
      await staffModel.create({
        username: `physician${i}`,
        password: hashPassword(process.env.INIT_PASSWORD),
        name: faker.name.firstName(),
        lastName: faker.name.lastName(),
        role: StaffRole.physician,
      })
    }
    for (let i = 0; i < process.env.INIT_NURSE; i++) {
      await staffModel.create({
        username: `nurse${i}`,
        password: hashPassword(process.env.INIT_PASSWORD),
        name: faker.name.firstName(),
        lastName: faker.name.lastName(),
        role: StaffRole.nurse,
      })
    }

    console.log('Initial system data success ✅')
  }
}

async function run () {
  await connectDB()
  await initialSystem()
  if (process.env.SIMULATION) {
    (await import('./task/simulation.js')).startTask()
  } else {
    startCollectorTask()
  }
  await startServer()
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
