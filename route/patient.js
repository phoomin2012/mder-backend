import { Router } from 'express'
import validator from 'validator'
import { parse } from 'date-fns'

import Patient, { PatientStage } from '../model/patient.js'
import { io } from '../module/server.js'

const route = Router()

route.post('/patient', async function CreateOrUpdatePatient (req, res) {
  const formErrors = []
  if (!req.body.hospitalNumber) {
    formErrors.push('hospitalNumber.empty')
  } else if (validator.isEmpty(req.body.hospitalNumber.toString().trim())) {
    formErrors.push('hospitalNumber.empty')
  }

  if (req.body.bedNumber) {
    if (validator.isEmpty(req.body.bedNumber.trim())) {
      formErrors.push('bedNumber.empty')
    }
  }

  if (req.body.name) {
    if (validator.isEmpty(req.body.name.trim())) {
      formErrors.push('name.empty')
    }
  }

  if (req.body.lastName) {
    if (validator.isEmpty(req.body.lastName.trim())) {
      formErrors.push('lastName.empty')
    }
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
    const entry = parse(`${req.body.entryDate} ${req.body.entryTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
    const exit = parse(`${req.body.exitDate} ${req.body.exitTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())

    const patient = await Patient.findById(req.body.id).exec()
    patient.hospitalNumber = req.body.hospitalNumber
    patient.bedNumber = req.body.bedNumber
    patient.name = req.body.name
    patient.lastName = req.body.lastName
    patient.ventilator = req.body.ventilator || false
    patient.triage = req.body.triage

    if (req.body.stage.toString() !== patient.currentStage.toString()) {
      patient.currentStage = req.body.stage
      patient.stages[patient.stages.length - 1].end = new Date()
      patient.stages.push({
        stage: req.body.stage,
        start: new Date(),
        end: null,
      })
    }

    patient.entry = entry
    patient.exit = isNaN(exit) ? null : exit
    await patient.save()

    // Broadcast patient information
    io.emit('patient.update', patient)

    return res.json({
      success: true,
    })
  } else {
    // New patient
    const entry = parse(`${req.body.entryDate} ${req.body.entryTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
    const stages = [{ stage: req.body.stage, start: entry, end: null }]

    const patient = await Patient.create({
      hospitalNumber: req.body.hospitalNumber,
      bedNumber: req.body.bedNumber,
      name: req.body.name,
      lastName: req.body.lastName,
      ventilator: req.body.ventilator || false,
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

route.delete('/patient/:id', async function RemovePatient (req, res) {
  try {
    const patient = await Patient.findById(req.params.id).exec()

    if (patient) {
      try {
        await patient.remove()
        io.emit('patient.remove', req.params.id)
        return res.status(200).json({ success: true })
      } catch (err) {
        return res.status(400).json({ success: false })
      }
    } else {
      return res.status(400).json({ success: false })
    }
  } catch (err) {
    return res.status(400).json({ success: false })
  }
})

export default route
