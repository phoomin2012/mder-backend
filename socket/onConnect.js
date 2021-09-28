import Patient from '../model/patient.js'
import CheckIn from '../model/checkIn.js'
import Countdown from '../model/countdown.js'
import Statistic from '../model/statistic.js'
import client, { org, bucket } from '../module/influx.js'

async function getTodayPatients (socket) {
  // Today patients
  const queryApi = client.getQueryApi(org)
  try {
    const _start = new Date()
    _start.setHours(0)
    _start.setMinutes(0)
    _start.setSeconds(0)
    _start.setMilliseconds(0)

    const query = `from(bucket: "${bucket}")
    |> range(start: ${_start.toJSON()})
    |> filter(fn: (r) => r["_measurement"] == "population")
    |> filter(fn: (r) => r["_field"] == "patient")
    |> aggregateWindow(every: 1d, fn: max, createEmpty: true)
    |> yield(name: "max")
    `
    const rawData = await queryApi.collectRows(query)
    if (rawData.length > 0) {
      const todayPatients = rawData[rawData.length - 1]._value
      socket.emit('summary.todayPatient', { patients: todayPatients })
    } else {
      socket.emit('summary.todayPatient', { patients: 0 })
    }
  } catch (err) {
    // console.log(err)
    socket.emit('summary.todayPatient', { patients: 0 })
  }
}

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

  // Fetch today patients
  getTodayPatients(socket)
  // Set fetch today patients every 2 sec.
  const timer = setInterval(async () => {
    getTodayPatients(socket)
  }, 2000)

  socket.on('disconnect', () => {
    clearInterval(timer)
  })
}
