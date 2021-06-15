import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport'
import bcrypt from 'bcrypt'
import staffModel from '../model/staff'

const route = Router()

route.post('/auth/login', async (req, res) => {
  const user = await staffModel.findOne({
    username: req.body.username,
  })

  if (user) {
    return res.status(400).json({
      error: {
        popup: 'auth.invalid',
      },
    })
  }

  if (bcrypt.compareSync(req.body.password, user.password)) {
    return res.json({
      success: true,
      user: user,
    })
  }
})

route.get('/auth/user', jwtMiddleware, async (req, res) => {
  return res.json(req.user)
})

export default route
