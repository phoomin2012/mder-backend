import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport.js'
import { io } from '../module/server.js'

import CheckIn from '../model/checkIn.js'
import Staff, { StaffRole } from '../model/staff.js'
import Statistic from '../model/statistic.js'

const route = Router()

route.get('/check', jwtMiddleware, async function GetCheckIn (req, res) {
  const checks = await CheckIn.find().exec()

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

  res.json({
    physician,
    nurse,
  })
})

route.post('/check/in', jwtMiddleware, async function CheckIn (req, res) {
  const staff = await Staff.findOne({
    username: req.body.username,
  })

  if (staff) {
    if (await CheckIn.findOne({ userId: staff._id })) {
      return res.json({
        success: false,
        error: {
          popup: 'checkIn.already',
        },
      })
    }

    // Save the statistic
    const statistic = await Statistic.findOne()
    if (staff.role === StaffRole.physician) {
      statistic.currentPhysician += 1
    } else if (staff.role === StaffRole.nurse) {
      statistic.currentNurse += 1
    }
    statistic.save()

    // Make check in
    await CheckIn.create({
      userId: staff._id,
      checkIn: new Date(),
    })

    io.emit('checkIn', { role: staff.role })

    return res.json({
      success: true,
    })
  } else {
    return res.json({
      success: false,
      error: {
        popup: 'checkIn.noUser',
      },
    })
  }
})

route.post('/check/out', jwtMiddleware, async function CheckOut (req, res) {
  const staff = await Staff.findOne({
    username: req.body.username,
  })

  if (staff) {
    const check = await CheckIn.findOne({ userId: staff._id })
    if (!check) {
      return res.json({
        success: false,
        error: {
          popup: 'checkOut.noCheckIn',
        },
      })
    }

    // Save the statistic
    const statistic = await Statistic.findOne()
    if (staff.role === StaffRole.physician) {
      statistic.currentPhysician -= 1
    } else if (staff.role === StaffRole.nurse) {
      statistic.currentNurse -= 1
    }
    statistic.save()

    // Make check out
    await check.remove()
    io.emit('checkOut', { role: staff.role })

    return res.json({
      success: true,
    })
  } else {
    return res.json({
      success: false,
      error: {
        popup: 'checkOut.noUser',
      },
    })
  }
})

export default route
