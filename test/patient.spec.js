import request from 'supertest'
import app from '../app.js'
import patientModel from '../model/patient.js'
import staffModel from '../model/staff.js'
import { signJWT } from '../module/jwt.js'

let mockUser, token
describe('Test authentication route', () => {
  beforeAll(async () => {
    process.env.PORT = 3003
    mockUser = await staffModel.create({
      username: 'mockUser',
      password: '',
    })
    token = signJWT({
      uid: mockUser._id,
    })
  })

  describe('Test CreateOrUpdatePatient()', () => {
    describe('Test create patient', () => {
      test('Correct input', async () => {
        const response = await request(app).post('/api/patient').set('authorization', 'Bearer ' + token).send({
          id: null,
          hospitalNumber: '1234567',
          bedNumber: '1',
          name: 'John',
          lastName: 'Wick',
          ventilator: false,
          triage: 5,
          stage: 1,
          entryDate: '2021-05-22',
          entryTime: '02:12:00',
        })
        expect(response.statusCode).toBe(200)
      })
      test('Incorrect triage level', async () => {
        const response = await request(app).post('/api/patient').set('authorization', 'Bearer ' + token).send({
          id: null,
          hospitalNumber: '1234567',
          bedNumber: '1',
          name: 'John',
          lastName: 'Wick',
          ventilator: false,
          triage: 9,
          stage: 1,
          entryDate: '2021-05-22',
          entryTime: '02:12:00',
        })
        expect(response.statusCode).toBe(400)
      })

      test('Incorrect stage', async () => {
        const response = await request(app).post('/api/patient').set('authorization', 'Bearer ' + token).send({
          id: null,
          hospitalNumber: '1234567',
          bedNumber: '1',
          name: 'John',
          lastName: 'Wick',
          ventilator: false,
          triage: 5,
          stage: 33,
          entryDate: '2021-05-22',
          entryTime: '02:12:00',
        })
        expect(response.statusCode).toBe(400)
      })

      test('Empty fields', async () => {
        const response = await request(app).post('/api/patient').set('authorization', 'Bearer ' + token).send({})
        expect(response.statusCode).toBe(400)
      })

      afterAll(async () => {
        await patientModel.deleteMany({
          hospitalNumber: '1234567',
          name: 'John',
          lastName: 'Wick',
        })
      })
    })

    describe('Test update patient', () => {
      let patient
      beforeAll(async () => {
        patient = await patientModel.create({
          hospitalNumber: '1234567',
          bedNumber: '1',
          name: 'John',
          lastName: 'Wick',
          ventilator: false,
          triage: 5,
          currentStage: 1,
          stages: [{ stage: 1, start: new Date(), end: null }],
          entry: new Date(),
        })
      })

      test('Correct input', async () => {
        const response = await request(app).post('/api/patient').set('authorization', 'Bearer ' + token).send({
          id: patient._id,
          hospitalNumber: '1234567',
          bedNumber: '1',
          name: 'John',
          lastName: 'Wick',
          ventilator: false,
          triage: 5,
          stage: 62,
          entryDate: '2021-05-22',
          entryTime: '02:12:00',
          exitDate: '2021-05-22',
          exitTime: '07:52:00',
        })
        expect(response.statusCode).toBe(200)
      })

      afterAll(async () => {
        await patient.remove()
      })
    })
  })

  describe('Test RemovePatient()', () => {
    let patient
    beforeAll(async () => {
      patient = await patientModel.create({
        hospitalNumber: '1234567',
        bedNumber: '1',
        name: 'John',
        lastName: 'Wick',
        ventilator: false,
        triage: 5,
        currentStage: 1,
        stages: [{ stage: 1, start: new Date(), end: null }],
        entry: new Date(),
      })
    })

    test('Exist patient id', async () => {
      const response = await request(app).delete('/api/patient/' + patient._id).set('authorization', 'Bearer ' + token).send({})
      expect(response.statusCode).toBe(200)
    })

    test('Not exist patient id', async () => {
      const response = await request(app).delete('/api/patient/000000000000000000000').set('authorization', 'Bearer ' + token).send({})
      expect(response.statusCode).toBe(400)
    })
  })

  afterAll(async () => {
    await mockUser.remove()
  })
})
