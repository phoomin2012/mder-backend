import mongoose from 'mongoose'

export const StaffRole = {
  physician: 'physician',
  nurse: 'nurse',
}

const staffSchema = mongoose.Schema({
  username: String,
  password: String,
  name: String,
  lastName: String,
  role: String,
})

const staffModel = mongoose.model('staff', staffSchema)
export default staffModel
