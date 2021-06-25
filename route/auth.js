import { Router } from 'express'
import bcrypt from 'bcrypt'
import { jwtMiddleware } from '../middleware/passport.js'
import staffModel from '../model/staff.js'
import { signJWT } from '../module/jwt.js'

const route = Router()

route.post('/auth/login', async (req, res) => {
  const formErrors = []
  if (!req.body.username) {
    formErrors.push('useranme.empty')
  }

  if (!req.body.password) {
    formErrors.push('password.empty')
  }

  if (formErrors.length > 0) {
    return res.status(400).json({
      error: {
        form: formErrors,
      },
    })
  }

  const user = await staffModel.findOne({
    username: req.body.username,
  }).exec()

  if (!user) {
    return res.status(400).json({
      error: {
        popup: 'auth.invalid',
      },
    })
  }

  if (bcrypt.compareSync(req.body.password, user.password)) {
    const token = signJWT({
      uid: user._id,
    })

    return res.json({
      success: true,
      token,
      user: user,
    })
  }
})

route.get('/auth/user', jwtMiddleware, async (req, res) => {
  return res.json(req.user)
})

export default route
