import { Router } from 'express'
import validator from 'validator'
import staffModel, { StaffRole } from '../model/staff.js'
import { hashPassword } from '../module/password.js'

const route = Router()

route.get('/staff', async function fetchAllStaff (req, res) {
  const staffs = await staffModel.find()
  return res.json(staffs)
})

route.get('/staff/:id', async function fetchStaff (req, res) {
  const staff = await staffModel.findById(req.params.id).exec()
  return res.json(staff)
})

route.post('/staff', async function CreateOrUpdateStaff (req, res) {
  const formErrors = []
  if (!req.body.username) {
    formErrors.push('username.empty')
  } else if (validator.isEmpty(req.body.username.toString())) {
    formErrors.push('username.empty')
  } else {
    const staff = await staffModel.findOne({ username: req.body.username }).exec()
    if (staff && !req.body.id) {
      formErrors.push('username.exist')
    } else if (staff && req.body.id && staff._id.toString() !== req.body.id) {
      formErrors.push('username.exist')
    }
  }

  if (req.body.password) {
    if (validator.isEmpty(req.body.password.toString())) {
      formErrors.push('password.empty')
    }
  } else {
    if (!req.body.id) {
      formErrors.push('password.empty')
    }
  }

  if (!req.body.name) {
    formErrors.push('name.empty')
  } else if (validator.isEmpty(req.body.name.toString())) {
    formErrors.push('name.empty')
  }

  if (!req.body.lastName) {
    formErrors.push('lastName.empty')
  } else if (validator.isEmpty(req.body.lastName.toString())) {
    formErrors.push('lastName.empty')
  }

  if (!req.body.role) {
    formErrors.push('role.empty')
  } else if (!Object.values(StaffRole).includes(req.body.role)) {
    formErrors.push('role.invalid')
  }

  if (formErrors.length > 0) {
    return res.status(400).json({
      error: {
        form: formErrors,
      },
    })
  }

  try {
    if (req.body.id) {
    // Update
      const staff = await staffModel.findById(req.body.id).exec()

      staff.username = req.body.username
      if (req.body.password) {
        staff.password = hashPassword(req.body.password)
      }
      staff.name = req.body.name
      staff.lastName = req.body.lastName
      staff.role = req.body.role
      await staff.save()

      return res.json({
        success: true,
        data: staff,
      })
    } else {
    // Create
      const staff = await staffModel.create({
        username: req.body.username,
        password: hashPassword(req.body.password),
        name: req.body.name,
        lastName: req.body.lastName,
        role: req.body.role,
      })

      return res.json({
        success: true,
        data: staff,
      })
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({
      success: false,
    })
  }
})

route.delete('/staff/:id', async function RemoveStaff (req, res) {
  try {
    const staff = await staffModel.findById(req.params.id).exec()

    if (staff) {
      await staff.remove()
      const staffs = await staffModel.find()
      return res.json({ success: true, list: staffs })
    }
    return res.status(400).json({ success: false })
  } catch (err) {
    return res.status(400).json({ success: false })
  }
})

export default route
