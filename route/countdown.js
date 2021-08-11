import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport.js'
import { io } from '../module/server.js'

import Countdown, { CountDownStatus } from '../model/countdown.js'
import Patient from '../model/patient.js'
import { addSeconds } from 'date-fns'

const route = Router()

route.post('/countdown/start', jwtMiddleware, async (req, res) => {
  const patient = await Patient.findById(req.body.patient)

  if (patient) {
    const oldCounting = await Countdown.findOne({ patientId: patient._id })
    if (oldCounting) {
      oldCounting.duration = req.body.duration
      oldCounting.start = new Date()
      oldCounting.end = addSeconds(oldCounting.start, oldCounting.duration)

      await oldCounting.save()
      io.emit('countdown.start', oldCounting)

      return res.json({
        success: true,
      })
    } else {
      const start = new Date()
      const end = addSeconds(start, req.body.duration)

      const counting = await Countdown.create({
        patientId: patient._id,
        duration: req.body.duration,
        start,
        end,
        status: CountDownStatus.Running,
      })

      io.emit('countdown.start', counting)
      return res.json({
        success: true,
      })
    }
  } else {
    return res.json({
      success: false,
      error: {
        popup: 'patient.notExist',
      },
    })
  }
})

route.post('/countdown/stop', jwtMiddleware, async (req, res) => {
  const counting = await Countdown.findById(req.body.id)

  if (counting) {
    io.emit('countdown.stop', counting)
    await counting.remove()

    return res.json({
      success: true,
    })
  } else {
    return res.json({
      success: false,
      error: {
        popup: 'countdown.notExist',
      },
    })
  }
})

export default route
