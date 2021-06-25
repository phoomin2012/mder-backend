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

staffSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.password
    delete ret.__v
    return ret
  },
})

const staffModel = mongoose.model('staff', staffSchema)
export default staffModel
