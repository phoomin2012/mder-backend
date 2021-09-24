import { CronJob } from 'cron'
import { differenceInSeconds } from 'date-fns'
import { Point } from '@influxdata/influxdb-client'
import client, { org, bucket } from '../module/influx.js'
import StatisticModel from '../model/statistic.js'
import PatientModel, { PatientStage } from '../model/patient.js'

export async function collectStatisticToInflux (timestamp = new Date()) {
  const __start = new Date()
  console.log('🤖 Start collect data to InfluxDB 📈📉')
  const writeApi = client.getWriteApi(org, bucket)

  // Chart 1 => patient triage level
  const patients = await PatientModel.getNonDisposition()
  if (patients) {
    const levels = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    }

    for (const patient of patients) {
      levels[patient.triage] += 1
    }

    const point = new Point('triage')
    point.intField('1', levels[1])
    point.intField('2', levels[2])
    point.intField('3', levels[3])
    point.intField('4', levels[4])
    point.intField('5', levels[5])
    point.timestamp(timestamp)

    writeApi.writePoint(point)
  }

  // Chart 2 => average time interval
  if (patients) {
    const people = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      60: 0,
      61: 0,
      62: 0,
      63: 0,
    }
    const times = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      60: 0,
      61: 0,
      62: 0,
      63: 0,
    }

    for (const patient of patients) {
      const lastStage = patient.stages[patient.stages.length - 1]

      people[lastStage.stage] += 1
      times[lastStage.stage] += differenceInSeconds(new Date(), lastStage.start)
    }

    const point = new Point('timeInterval')
    point.intField('1', people[1] > 0 ? times[1] / people[1] : 0)
    point.intField('2', people[2] > 0 ? times[2] / people[2] : 0)
    point.intField('3', people[3] > 0 ? times[3] / people[3] : 0)
    point.intField('4', people[4] > 0 ? times[4] / people[4] : 0)
    point.intField('5', people[5] > 0 ? times[5] / people[5] : 0)
    point.intField('60', people[60] > 0 ? times[60] / people[60] : 0)
    point.intField('61', people[61] > 0 ? times[61] / people[61] : 0)
    point.intField('62', people[62] > 0 ? times[62] / people[62] : 0)
    point.intField('63', people[63] > 0 ? times[63] / people[63] : 0)
    point.timestamp(timestamp)

    writeApi.writePoint(point)
  }

  // Chart 3 => amount of staff and patient
  const statistic = await StatisticModel.findOne({})
  if (statistic) {
    const point = new Point('population')
    point.intField('physician', statistic.currentPhysician)
    point.intField('nurse', statistic.currentNurse)
    point.intField('patient', statistic.currentPatient)
    point.timestamp(timestamp)

    writeApi.writePoint(point)
  }

  // Chart 4 => average length of stay
  if (patients) {
    let peoples = 0
    let times = 0

    for (const patient of patients) {
      peoples += 1
      times += differenceInSeconds(new Date(), patient.entry)
    }

    const point = new Point('timeStay')
    point.intField('all', peoples === 0 ? 0 : times / peoples)
    point.timestamp(timestamp)

    writeApi.writePoint(point)
  }

  // Chart 5 => overcrowding score
  if (patients && statistic) {
    // NEDOCS
    let LOSHr = 0; let lastAdmitHr = 0
    const currentPatient = patients.length
    const waitForAdmitPatient = patients.filter(patient => patient.currentStage === PatientStage.triage).length
    const ventilatorPatient = patients.filter(patient => patient.ventilator).length
    if (patients.length > 0) {
      LOSHr = differenceInSeconds(new Date(), patients.reduce((last, patient) => differenceInSeconds(last.entry, patient.entry) > 0 ? patient : last).entry) / 3600
      lastAdmitHr = differenceInSeconds(new Date(), patients.reduce((last, patient) => differenceInSeconds(last.entry, patient.entry) > 0 ? patient : last).entry) / 3600
    }

    const nedocs = overcrowdNEDOCS(currentPatient, waitForAdmitPatient, ventilatorPatient, LOSHr, lastAdmitHr)

    const lv1Patient = patients.filter(patient => patient.triage === 1).length
    const lv2Patient = patients.filter(patient => patient.triage === 2).length
    const lv3Patient = patients.filter(patient => patient.triage === 3).length
    const lv4Patient = patients.filter(patient => patient.triage === 4).length
    const lv5Patient = patients.filter(patient => patient.triage === 5).length
    const currentStaff = statistic.currentPhysician + statistic.currentNurse
    const edwin = overcrowdEDWIN(currentPatient, lv1Patient, lv2Patient, lv3Patient, lv4Patient, lv5Patient, currentStaff)

    const point = new Point('overcrowd')
    point.floatField('nedocs', Math.max(0, nedocs))
    point.floatField('edwin', edwin)
    point.timestamp(timestamp)

    writeApi.writePoint(point)
  }

  writeApi.close().then(() => {
    console.log(`\tFINISH in ${Date.now() - __start.getTime()}ms`)
  }).catch(e => {
    console.log('\nFinished ERROR')
    console.error(e)
  })
}

const job = new CronJob('*/5 * * * * *', async () => {
  await collectStatisticToInflux()
}, null, false, 'Asia/Bangkok')

export function startTask () {
  job.start()
}

export function overcrowdNEDOCS (currentPatient, waitForAdmitPatient, ventilatorPatient, LOSHr, lastAdmitHr, ERBeds = 6, hosBeds = 1000) {
  return 85.8 * (currentPatient / ERBeds) +
      600 * (waitForAdmitPatient / hosBeds) +
      13.4 * ventilatorPatient +
      0.93 * LOSHr +
      5.64 * lastAdmitHr - 20
}

export function overcrowdEDWIN (currentPatient, lv1Patient, lv2Patient, lv3Patient, lv4Patient, lv5Patient, currentStaff, EDBeds = 6) {
  return ((lv5Patient * 1) + (lv4Patient * 2) + (lv3Patient * 3) + (lv2Patient * 4) + (lv1Patient * 5)) / ((currentStaff === 0 ? 0.01 : currentStaff) * (EDBeds - currentPatient))
}
