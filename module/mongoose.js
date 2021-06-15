import mongoose from 'mongoose'

mongoose.connect('mongodb://localhost:28018/mder', {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true
}, () => {
  console.log('🟢 Connect to database.')
})
