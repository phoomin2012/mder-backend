import mongoose from 'mongoose'

mongoose.connect('mongodb://127.0.0.1:28018/mder', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, (error) => {
  if (error) {
    console.log('🔴 Error:', error)
  } else {
    console.log('🟢 Connect to database.')
  }
})
