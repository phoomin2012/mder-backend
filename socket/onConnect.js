import Patient from '../model/patient.js'
import CheckIn from '../model/checkIn.js'
import Countdown from '../model/countdown.js'

export default async function onConnect (socket) {
  const patients = await Patient.find().exec()
  const summaryCheckIn = await CheckIn.getSummary()
  const countdowns = await Countdown.find().exec()

  socket.emit('patient.all', patients)
  socket.emit('summary.checkIn', summaryCheckIn)
  socket.emit('countdown.all', countdowns)
}
