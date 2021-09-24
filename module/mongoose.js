import mongoose from 'mongoose'

export default function () {
  return new Promise((resolve, reject) => {
    if (mongoose.connection.readyState === 1) {
      resolve()
    } else if (mongoose.connection.readyState === 2) {
      mongoose.connection.once('connected', resolve)
      mongoose.connection.once('error', reject)
    } else {
      mongoose.connect('mongodb://127.0.0.1:28018/mder', {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }, (error) => {
        if (process.env.NODE_ENV !== 'test') {
          if (error) {
            console.log('🔴 Error:', error)
            reject(error)
          } else {
            console.log('🟢 Connect to database.')
            resolve()
          }
        }
      })
    }
  })
}
