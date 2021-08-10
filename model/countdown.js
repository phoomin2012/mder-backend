import mongoose from 'mongoose'

export const CountDownStatus = {
  Stopped: 0,
  Running: 1,
  Finished: 2,
}

const countdownSchema = mongoose.Schema({
  patientId: mongoose.Types.ObjectId,
  duration: Number,
  start: Date,
  end: Date,
  status: Number,
})

countdownSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.__v
    return ret
  },
})

const countdownModel = mongoose.model('countdown', countdownSchema)
export default countdownModel
