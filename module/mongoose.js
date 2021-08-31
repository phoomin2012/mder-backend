import mongoose from 'mongoose'
import { startTask } from '../task/dataCollector.js'

mongoose.connect('mongodb://127.0.0.1:28018/mder', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, (error) => {
  if (process.env.NODE_ENV !== 'test') {
    if (error) {
      console.log('🔴 Error:', error)
    } else {
      console.log('🟢 Connect to database.')
      startTask()
    }
  }
})
