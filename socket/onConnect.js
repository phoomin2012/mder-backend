import Patient from '../model/patient.js'
import CheckIn from '../model/checkIn.js'
import Countdown from '../model/countdown.js'
import Statistic from '../model/statistic.js'

export default async function onConnect (socket) {
  const patients = await Patient.getNonDisposition()
  const summaryCheckIn = await CheckIn.getSummary()
  const countdowns = await Countdown.find()

  const countStatistic = await Statistic.countDocuments()
  if (countStatistic === 0) {
    await Statistic.create({})
  }

  const statistic = await Statistic.findOne()
  statistic.currentPhysician = summaryCheckIn.physician
  statistic.currentNurse = summaryCheckIn.nurse
  statistic.currentPatient = patients.length
  statistic.save()

  socket.emit('patient.all', patients)
  socket.emit('summary.checkIn', summaryCheckIn)
  socket.emit('countdown.all', countdowns)
}
