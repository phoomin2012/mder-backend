import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport.js'
import client, { org, bucket } from '../module/influx.js'
import { parseJSON, getTime } from 'date-fns'

const route = Router()

route.get('/history', jwtMiddleware, async (req, res) => {
  const queryApi = client.getQueryApi(org)
  const jsonResponse = {}

  const _start = Date.now()

  // Chart 1 => patient triage level
  try {
    const query = `from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "triage")
      |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
      |> yield(name: "mean")
      `
    const rawData = await queryApi.collectRows(query)
    console.log('\nCollect ROWS SUCCESS')

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          triage: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        }
      }
      mappedData[time].triage[row._field] = row._value
    }

    jsonResponse.chart1 = Object.values(mappedData)
  } catch (error) {
    console.error(error)
    console.log('\nCollect ROWS ERROR')
  }

  // Chart 2 => average time interval
  try {
    const query = `from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "timeInterval")
      |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
      |> yield(name: "mean")
      `
    const rawData = await queryApi.collectRows(query)
    console.log('\nCollect ROWS SUCCESS')

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          triage: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        }
      }
      mappedData[time].triage[row._field] = row._value
    }

    jsonResponse.chart2 = Object.values(mappedData)
  } catch (error) {
    console.error(error)
    console.log('\nCollect ROWS ERROR')
  }

  // Chart 3 => amount of staff and patient
  try {
    const query = `from(bucket: "${bucket}")
      |> range(start: -1h)
      |> filter(fn: (r) => r["_measurement"] == "population")
      |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
      |> yield(name: "mean")
      `
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

  // Chart 4 => average length of stay
  try {
    const query = `from(bucket: "${bucket}")
    |> range(start: -1h)
    |> filter(fn: (r) => r["_measurement"] == "timeStay")
    |> aggregateWindow(every: 5s, fn: mean, createEmpty: false)
    |> yield(name: "mean")
    `
    const rawData = await queryApi.collectRows(query)
    console.log('\nCollect ROWS SUCCESS')

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          all: 0,
        }
      }
      mappedData[time][row._field] = row._value
    }

    jsonResponse.chart4 = Object.values(mappedData)
  } catch (error) {
    console.error(error)
    console.log('\nCollect ROWS ERROR')
  }

  // Chart 5 => overcrowding score

  jsonResponse.finishIn = Date.now() - _start
  return res.json(jsonResponse)
})

export default route
