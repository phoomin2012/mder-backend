import './module/mongoose.js'
import { app, startServer } from './module/server.js'

import authRoute from './route/auth.js'
import staffRoute from './route/staff.js'
import patientRoute from './route/patient.js'

// Express Middleware

// Socket.io Middleware

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)
app.use('/api', patientRoute)

startServer()
