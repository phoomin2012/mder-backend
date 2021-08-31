import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport.js'
import client, { org, bucket } from '../module/influx.js'
import { parseJSON, getTime } from 'date-fns'

const route = Router()

route.get('/history', jwtMiddleware, async (req, res) => {
  const queryApi = client.getQueryApi(org)
  const jsonResponse = {}

  const query = `from(bucket: "${bucket}")
  |> range(start: -1h)
  |> filter(fn: (r) => r["_measurement"] == "population")
  |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
  |> yield(name: "mean")
  `

  const _start = Date.now()

  try {
    const rawData = await queryApi.collectRows(query)
    console.log('\nCollect ROWS SUCCESS')

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          physician: 0,
          nurse: 0,
          patient: 0,
        }
      }
      mappedData[time][row._field] = row._value
    }

    jsonResponse.chart3 = Object.values(mappedData)
  } catch (error) {
    console.error(error)
    console.log('\nCollect ROWS ERROR')
  }

  console.log(`⏱ Fetch history in ${Date.now() - _start}ms.`)

  return res.json(jsonResponse)
})

export default route
