import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport'

const route = Router()

route.post('/auth/login', async (req, res) => {

})

route.get('/auth/user', jwtMiddleware, async (req, res) => {
  return res.json(req.user)
})

export default route
