import { CronJob } from 'cron'
import { differenceInSeconds } from 'date-fns'
import { Point } from '@influxdata/influxdb-client'
import client, { org, bucket } from '../module/influx.js'
import StatisticModel from '../model/statistic.js'
import PatientModel from '../model/patient.js'

const job = new CronJob('*/5 * * * * *', async () => {
  const __start = new Date()
  console.log('🤖 Start collect data to InfluxDB 📈📉')
  const writeApi = client.getWriteApi(org, bucket)

  // Chart 1 => patient triage level
  const patients = await PatientModel.find()
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

    writeApi.writePoint(point)
  }

  // Chart 3 => amount of staff and patient
  const statistic = await StatisticModel.findOne({})
  if (statistic) {
    const point = new Point('population')
    point.intField('physician', statistic.currentPhysician)
    point.intField('nurse', statistic.currentNurse)
    point.intField('patient', statistic.currentPatient)

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
    point.intField('all', times / peoples)

    writeApi.writePoint(point)
  }

  // Chart 5 => overcrowding score
  // if (patients && statistic) {
  //   // ....

  // }

  writeApi.close().then(() => {
    console.log(`\tFINISH in ${Date.now() - __start.getTime()}ms`)
  }).catch(e => {
    console.log('\nFinished ERROR')
    console.error(e)
  })
}, null, true, 'Asia/Bangkok')

export function startTask () {
  job.start()
}
