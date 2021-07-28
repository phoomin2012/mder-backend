import Patient from '../model/patient.js'

export default async function onConnect (socket) {
  const patients = await Patient.find().exec()
  socket.emit('patient.all', patients)
}
