import request from 'supertest'
import app from '../app.js'
import staffModel from '../model/staff.js'
import { signJWT } from '../module/jwt.js'

let mockUser, token
describe('Test authentication route', () => {
  beforeAll(async () => {
    process.env.PORT = 3002
    mockUser = await staffModel.create({
      username: 'mockUser',
      password: '',
    })
    token = signJWT({
      uid: mockUser._id,
    })
  })

  describe('Test CreateOrUpdateStaff()', () => {
    describe('Test create staff', () => {
      test('Correct input', async () => {
        const response = await request(app).post('/api/staff').set('authorization', 'Bearer ' + token).send({
          id: null,
          username: 'staff001',
          password: '12345',
          name: 'John',
          lastName: 'Wick',
          role: 'physician',
        })
        expect(response.statusCode).toBe(200)
      })

      test('Empty fields', async () => {
        const response = await request(app).post('/api/staff').set('authorization', 'Bearer ' + token).send({})
        expect(response.statusCode).toBe(400)
      })

      afterAll(async () => {
        await staffModel.deleteMany({
          username: 'staff001',
          name: 'John',
          lastName: 'Wick',
          role: 'physician',
        })
      })
    })

    describe('Test update staff', () => {
      let staff, staff2
      beforeAll(async () => {
        staff = await staffModel.create({
          username: 'staff003',
          name: 'John',
          lastName: 'Wick',
          role: 'physician',
        })
        staff2 = await staffModel.create({
          username: 'staff001',
          name: 'John',
          lastName: 'Wick',
          role: 'physician',
        })
      })

      test('Correct input', async () => {
        const response = await request(app).post('/api/staff').set('authorization', 'Bearer ' + token).send({
          id: staff._id,
          username: 'staff003',
          password: 'abc',
          name: 'John',
          lastName: 'Wick',
          role: 'nurse',
        })
        expect(response.statusCode).toBe(200)
      })

      test('Exist username', async () => {
        const response = await request(app).post('/api/staff').set('authorization', 'Bearer ' + token).send({
          id: staff._id,
          username: 'staff001',
          password: '12345',
          name: 'John',
          lastName: 'Wick',
          role: 'physician',
        })
        expect(response.statusCode).toBe(400)
      })

      test('Empty fields', async () => {
        const response = await request(app).post('/api/staff').set('authorization', 'Bearer ' + token).send({
          id: staff._id,
        })
        expect(response.statusCode).toBe(400)
      })

      afterAll(async () => {
        await staff.remove()
        await staff2.remove()
      })
    })
  })

  describe('Test RemoveStaff()', () => {
    let staff
    beforeAll(async () => {
      staff = await staffModel.create({
        username: 'staff001',
        name: 'John',
        lastName: 'Wick',
        role: 'physician',
      })
    })

    test('Exist staff id', async () => {
      const response = await request(app).delete('/api/staff/' + staff._id).set('authorization', 'Bearer ' + token).send({})
      expect(response.statusCode).toBe(200)
    })

    test('Not exist staff id', async () => {
      const response = await request(app).delete('/api/staff/000000000000000000000').set('authorization', 'Bearer ' + token).send({})
      expect(response.statusCode).toBe(400)
    })
  })

  afterAll(async () => {
    await mockUser.remove()
  })
})
