import mongoose from 'mongoose'
import Staff, { StaffRole } from './staff.js'

const checkInSchema = mongoose.Schema({
  userId: mongoose.Types.ObjectId,
  checkIn: Date,
})

checkInSchema.set('toJSON', {
  transform (doc, ret, opt) {
    delete ret.__v
    return ret
  },
})

checkInSchema.static('getSummary', async function () {
  const checks = await this.find().exec()

  let physician = 0
  let nurse = 0

  for (const check of checks) {
    const staff = await Staff.findById(check.userId)
    if (staff.role === StaffRole.physician) {
      physician += 1
    } else if (staff.role === StaffRole.nurse) {
      nurse += 1
    }
  }

  return {
    physician,
    nurse,
  }
})

const checkInModel = mongoose.model('checkIn', checkInSchema)
export default checkInModel
