import request from 'supertest'
import app from '../app.js'
import staffModel from '../model/staff.js'
import { signJWT } from '../module/jwt.js'
import { hashPassword } from '../module/password'

let mockUser, token
describe('Test authentication route', () => {
  beforeAll(async () => {
    mockUser = await staffModel.create({
      username: 'staff01',
      password: hashPassword('1234abcd'),
    })
    token = signJWT({
      uid: mockUser._id,
    })
  })

  describe('Test login()', () => {
    test('Incorrect username', async () => {
      const response = await request(app).post('/api/auth/login').send({ username: 'stff01', password: '1234abcd' })
      expect(response.statusCode).toBe(400)
    })
    test('Incorrect password', async () => {
      const response = await request(app).post('/api/auth/login').send({ username: 'staff01', password: 'abcd1234' })
      expect(response.statusCode).toBe(400)
    })
    test('Incorrect username & password', async () => {
      const response = await request(app).post('/api/auth/login').send({ username: 'stff01', password: 'abcd1234' })
      expect(response.statusCode).toBe(400)
    })
    test('Correct username & password', async () => {
      const response = await request(app).post('/api/auth/login').send({ username: 'staff01', password: '1234abcd' })
      expect(response.statusCode).toBe(200)
    })
  })

  describe('Test fetchUser()', () => {
    test('Without authorization header', async () => {
      const response = await request(app).get('/api/auth/user')
      expect(response.statusCode).toBe(401)
    })

    test('With incorrect JWT token', async () => {
      const response = await request(app).get('/api/auth/user').set('authorization', 'Bearer ' + 'alsjdlakjsdkla')
      expect(response.statusCode).toBe(401)
    })

    test('With correct JWT token', async () => {
      const response = await request(app).get('/api/auth/user').set('authorization', 'Bearer ' + token)
      expect(response.statusCode).toBe(200)
    })
  })

  describe('Test logout()', () => {
    test('Without authorization header', async () => {
      const response = await request(app).post('/api/auth/logout')
      expect(response.statusCode).toBe(401)
    })

    test('With authorization header', async () => {
      const response = await request(app).post('/api/auth/logout').set('authorization', 'Bearer ' + token)
      expect(response.statusCode).toBe(200)
    })
  })

  afterAll(async () => {
    await mockUser.remove()
  })
})
