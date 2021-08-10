import mongoose from 'mongoose'

const statisticSchema = mongoose.Schema({
  currentPhysician: Number,
  currentNurse: Number,
  currentPatient: Number,
})

statisticSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.__v
    return ret
  },
})

const statisticModel = mongoose.model('statistic', statisticSchema)
export default statisticModel
