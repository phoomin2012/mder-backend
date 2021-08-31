import mongoose from 'mongoose'

const statisticSchema = mongoose.Schema({
  currentPhysician: {
    type: Number,
    default: 0,
  },
  currentNurse: {
    type: Number,
    default: 0,
  },
  currentPatient: {
    type: Number,
    default: 0,
  },
})

statisticSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.__v
    return ret
  },
})

const statisticModel = mongoose.model('statistic', statisticSchema)
export default statisticModel
