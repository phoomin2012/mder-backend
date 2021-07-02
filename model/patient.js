import mongoose from 'mongoose'

export const PatientStage = {
  triage: 1,
  investigation: 2,
  consultation: 3,
  diagnosis: 4,
  treatment: 5,
  disposition: 60,
  discharged: 61,
  admitted: 62,
  transfered: 63,
}

const PatientStageSchema = mongoose.Schema({
  stage: Number,
  start: Date,
  end: Date,
})
PatientStageSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret._id
    return ret
  },
})

const PatientSchema = mongoose.Schema({
  hospitalNumber: String,
  bedNumber: String,
  name: String,
  lastName: String,
  ventilator: Boolean,
  triage: Number,
  currentStage: Number,
  stages: [PatientStageSchema],
  dispositionType: Number,
  entry: Date,
  exit: Date,
})

PatientSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.__v
    return ret
  },
})

const Patient = mongoose.model('patient', PatientSchema)
export default Patient
