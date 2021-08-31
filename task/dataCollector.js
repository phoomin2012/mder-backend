import { CronJob } from 'cron'
import { Point } from '@influxdata/influxdb-client'
import client, { org, bucket } from '../module/influx.js'
import statisticModel from '../model/statistic.js'

const job = new CronJob('*/5 * * * * *', async () => {
  console.log('🤖 Start collect data to InfluxDB 📈📉')
  const writeApi = client.getWriteApi(org, bucket)
  const statistic = await statisticModel.findOne({})
  // console.log(statistic)

  if (statistic) {
    const point = new Point('population')
    point.intField('physician', statistic.currentPhysician)
    point.intField('nurse', statistic.currentNurse)
    point.intField('patient', statistic.currentPatient)

    writeApi.writePoint(point)
  }
  writeApi.close().then(() => {
    console.log('\tFINISH')
  }).catch(e => {
    console.error(e)
    console.log('\nFinished ERROR')
  })
}, null, true, 'Asia/Bangkok')

export function startTask () {
  job.start()
}
