import './module/mongoose.js'
import { app, startServer } from './module/server.js'

import staffRoute from './route/staff.js'
import authRoute from './route/auth.js'

// Express Middleware

// Socket.io Middleware

// Routes
app.use('/api', authRoute)
app.use('/api', staffRoute)

startServer()
