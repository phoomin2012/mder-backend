import mongoose from 'mongoose'

export const PatientStage = {
  triage: 1,
  investigation: 2,
  consultation: 3,
  diagnosis: 4,
  treatment: 5,
  disposition: 6,
  discharged: 7,
  admitted: 8,
  transfered: 9,
}

const PatientSchema = mongoose.Schema({
  hosiptalNumber: Number,
  name: String,
  lastName: String,
  ventilator: Boolean,
  triage: Number,
  stage: String,
  entry: Date,
  exit: Date,
})

const Patient = mongoose.model('patient', PatientSchema)
export default Patient
