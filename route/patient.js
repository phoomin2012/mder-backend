import { Router } from 'express'
import validator from 'validator'
import { parse } from 'date-fns'

import Patient, { PatientStage } from '../model/patient.js'
import { io } from '../module/server.js'

const route = Router()

route.get('/patient', async (req, res) => {

})

route.post('/patient', async (req, res) => {
  const formErrors = []
  if (!req.body.hospitalNumber) {
    formErrors.push('hospitalNumber.empty')
  } else if (validator.isEmpty(req.body.hospitalNumber.toString())) {
    formErrors.push('hospitalNumber.empty')
  }

  if (!req.body.name) {
    formErrors.push('name.empty')
  } else if (validator.isEmpty(req.body.name)) {
    formErrors.push('name.empty')
  }

  if (!req.body.lastName) {
    formErrors.push('lastName.empty')
  } else if (validator.isEmpty(req.body.lastName)) {
    formErrors.push('lastName.empty')
  }

  if (!req.body.triage) {
    formErrors.push('triage.empty')
  } else if (validator.isEmpty(req.body.triage.toString())) {
    formErrors.push('triage.empty')
  } else if (![1, '1', 2, '2', 3, '3', 4, '4', 5, '5'].includes(req.body.triage)) {
    formErrors.push('triage.invalid')
  }

  if (!req.body.stage) {
    formErrors.push('stage.empty')
  } else if (validator.isEmpty(req.body.stage.toString())) {
    formErrors.push('stage.empty')
  } else if (!Object.values(PatientStage).includes(req.body.stage)) {
    formErrors.push('stage.invalid')
  }

  if (!req.body.entryDate) {
    formErrors.push('entryDate.empty')
  } else if (validator.isEmpty(req.body.entryDate)) {
    formErrors.push('entryDate.empty')
  }

  if (!req.body.entryTime) {
    formErrors.push('entryTime.empty')
  } else if (validator.isEmpty(req.body.entryTime)) {
    formErrors.push('entryTime.empty')
  }

  if (formErrors.length > 0) {
    return res.status(400).json({
      error: {
        form: formErrors,
      },
    })
  }

  if (req.body.id) {
    // Update patient
  } else {
    // New patient
    const entry = parse(`${req.body.entryDate} ${req.body.entryTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
    const stages = [{ stage: req.body.currentStage, start: entry, end: null }]

    const patient = await Patient.create({
      hospitalNumber: req.body.hospitalNumber,
      bedNumber: req.body.bedNumber,
      name: req.body.name,
      lastName: req.body.lastName,
      ventilator: req.body.ventilator,
      triage: req.body.triage,
      currentStage: req.body.stage,
      stages: stages,
      entry,
    })

    // Broadcast patient information
    io.emit('patient.add', patient)

    return res.json({
      success: true,
    })
  }
})

export default route
