import { Router } from 'express'
import { jwtMiddleware } from '../middleware/passport.js'
import client, { org, bucket } from '../module/influx.js'
import { parseJSON, getTime, differenceInSeconds } from 'date-fns'

const route = Router()

route.get('/history', jwtMiddleware, async (req, res) => {
  const queryApi = client.getQueryApi(org)
  const jsonResponse = {}

  const { start, end, mode } = req.query
  // start = parseJSON(start)
  // end = parseJSON(end)

  const _start = Date.now()
  let range = `range(start: ${start})`
  let every = '5s'
  if (mode === 'custom') {
    range = `range(start: ${start}, stop: ${end})`
    const duration = differenceInSeconds(parseJSON(end), parseJSON(start))
    if (duration > 3600 * 24 * 30) {
      every = '1d'
    } else if (duration > 3600 * 24) {
      every = '1h'
    } else if (duration > 3600) {
      every = '1m'
    }
  } else if (mode === 'past') {
    switch (start) {
      case '-5m':
      case '-15m':
      case '-30m':
      case '-1h':
        every = '5s'; break
      case '-3h':
      case '-6h':
      case '-12h':
      case '-24h':
        every = '1m'; break
      case '-2d':
      case '-7d':
      case '-30d':
        every = '1h'; break
    }
  }

  // Chart 1 => patient triage level
  try {
    const query = `from(bucket: "${bucket}")
      |> ${range}
      |> filter(fn: (r) => r["_measurement"] == "triage")
      |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
      |> yield(name: "mean")
    `
    let __start = Date.now()
    const rawData = await queryApi.collectRows(query)
    console.log(`[API] Query chart 1 SUCCESS in ${Date.now() - __start}ms`)
    __start = Date.now()

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          triages: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
          },
        }
      }
      mappedData[time].triages[row._field] = row._value
    }

    jsonResponse.chart1 = Object.values(mappedData)
    console.log(`[API] Mapping chart 1 SUCCESS in ${Date.now() - __start}ms`)
  } catch (error) {
    console.error(error)
    console.log('[API] Query chart 1 ERROR')
  }

  // Chart 2 => average time interval
  try {
    const query = `from(bucket: "${bucket}")
      |> ${range}
      |> filter(fn: (r) => r["_measurement"] == "timeInterval")
      |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
      |> yield(name: "mean")
    `
    let __start = Date.now()
    const rawData = await queryApi.collectRows(query)
    console.log(`[API] Query chart 2 SUCCESS in ${Date.now() - __start}ms`)
    __start = Date.now()

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          stages: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            60: 0,
            61: 0,
            62: 0,
            63: 0,
          },
        }
      }
      mappedData[time].stages[row._field] = row._value
    }

    jsonResponse.chart2 = Object.values(mappedData)
    console.log(`[API] Mapping chart 2 SUCCESS in ${Date.now() - __start}ms`)
  } catch (error) {
    console.error(error)
    console.log('[API] Query chart 2 ERROR')
  }

  // Chart 3 => amount of staff and patient
  try {
    const query = `from(bucket: "${bucket}")
      |> ${range}
      |> filter(fn: (r) => r["_measurement"] == "population")
      |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
      |> yield(name: "mean")
    `
    let __start = Date.now()
    const rawData = await queryApi.collectRows(query)
    console.log(`[API] Query chart 3 SUCCESS in ${Date.now() - __start}ms`)
    __start = Date.now()

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
    console.log(`[API] Mapping chart 3 SUCCESS in ${Date.now() - __start}ms`)
  } catch (error) {
    console.error(error)
    console.log('[API] Query chart 3 ERROR')
  }

  // Chart 4 => average length of stay
  try {
    const query = `from(bucket: "${bucket}")
      |> ${range}
      |> filter(fn: (r) => r["_measurement"] == "timeStay")
      |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
      |> yield(name: "mean")
    `
    let __start = Date.now()
    const rawData = await queryApi.collectRows(query)
    console.log(`[API] Query chart 4 SUCCESS in ${Date.now() - __start}ms`)
    __start = Date.now()

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
    console.log(`[API] Mapping chart 4 SUCCESS in ${Date.now() - __start}ms`)
  } catch (error) {
    console.error(error)
    console.log('[API] Query chart 4 ERROR')
  }

  // Chart 5 => overcrowding score
  try {
    const query = `from(bucket: "${bucket}")
      |> ${range}
      |> filter(fn: (r) => r["_measurement"] == "overcrowd")
      |> aggregateWindow(every: ${every}, fn: mean, createEmpty: true)
      |> yield(name: "mean")
    `
    let __start = Date.now()
    const rawData = await queryApi.collectRows(query)
    console.log(`[API] Query chart 5 SUCCESS in ${Date.now() - __start}ms`)
    __start = Date.now()

    const mappedData = {}
    for (const row of rawData) {
      const time = getTime(parseJSON(row._time))
      if (typeof mappedData[time] === 'undefined') {
        mappedData[time] = {
          time: time,
          nedocs: 0,
          edwin: 0,
        }
      }
      mappedData[time][row._field] += row._value
    }

    jsonResponse.chart5 = Object.values(mappedData)
    console.log(`[API] Mapping chart 5 SUCCESS in ${Date.now() - __start}ms`)
  } catch (error) {
    console.error(error)
    console.log('[API] Query chart 5 ERROR')
  }

  jsonResponse.finishIn = Date.now() - _start
  return res.json(jsonResponse)
})

export default route
