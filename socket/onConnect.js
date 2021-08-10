import Patient from '../model/patient.js'
import CheckIn from '../model/checkIn.js'

export default async function onConnect (socket) {
  const patients = await Patient.find().exec()
  const summaryCheckIn = await CheckIn.getSummary()

  socket.emit('patient.all', patients)
  socket.emit('summary.checkIn', summaryCheckIn)
}
