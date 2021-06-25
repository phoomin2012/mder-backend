import './module/mongoose.js'
import staffModel, { StaffRole } from './model/staff.js'
import { hashPassword } from './module/password.js'

async function start () {
  try {
    await staffModel.create({
      username: 'test',
      password: hashPassword('test'),
      name: 'Test',
      lastName: 'Tester',
      role: StaffRole.physician,
    })
    console.log('Mock data success')
  } catch (e) {
    console.log('Error mock data:', e)
  }
}

start()
