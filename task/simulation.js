import { differenceInMilliseconds, format, intervalToDuration } from 'date-fns'
import task from 'tasuku'
// eslint-disable-next-line no-unused-vars
import { collectStatisticToInflux } from './dataCollector.js'
// eslint-disable-next-line no-unused-vars
import Staff from '../model/staff.js'
// eslint-disable-next-line no-unused-vars
import Patient from '../model/patient.js'
// eslint-disable-next-line no-unused-vars
import CheckIn from '../model/checkIn.js'
// eslint-disable-next-line no-unused-vars
import Statistic from '../model/statistic.js'

const __start = new Date()
const startest = new Date('2021-09-25 12:00:00').getTime()
let start = startest

// eslint-disable-next-line no-unused-vars
const _config = {
  staff: {
    businessDay: {
      break: {
        hour: [[7, 8], [12, 13], [17, 18]],
        minPhysician: 3,
        minNurse: 5,
      },
      night: {
        hour: [18, 8],
        minPhysician: 3,
        minNurse: 5,
      },
    },
    holiday: {
      break: {
        hour: [[7, 8], [12, 13], [17, 18]],
        minPhysician: 2,
        minNurse: 2,
      },
      night: {
        hour: [18, 8],
        minPhysician: 1,
        minNurse: 2,
      },
    },
  },
  patient: {
    chance: {
      morning: {
        hour: [4, 11],
        chance: 0, // Percent
        triage: { 5: 3, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
      },
      noon: {
        hour: [12, 17],
        chance: 0, // Percent
        triage: { 5: 3, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
      },
      night: {
        hour: [4, 11],
        chance: 0, // Percent
        triage: { 5: 3, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
      },
    },
    accident: {
      small: {
        chance: 0, // Percent
        triage: { 5: 3, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
        size: [2, 4],
      },
      mediem: {
        chance: 0, // Percent
        triage: { 5: 10, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
        size: [5, 9],
      },
      big: {
        chance: 0, // Percent
        triage: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, // Percent
        size: [10, 30],
      },
    },
  },
}
// eslint-disable-next-line no-unused-vars
const _temp = {
  now: new Date(),
  staff: {
    targetPhysician: 0,
    targetNurse: 0,
  },
}

async function randomErEvent (t) {
  const output = [`[${format(start, 'yyyy-MM-dd HH:mm:ss')}]`]
  const nowInDate = new Date(_temp.now)

  // Staff check in/out
  //  ....
  const staffs = await Staff.find().exec()
  // for (const staff of staffs) {
  //   const _check = await CheckIn.findOne({ userId: staff._id })
  //   if (_check) {
  //     // Check out
  //     await _check.remove()
  //   } else {
  //     // Check in
  //     await CheckIn.create({
  //       userId: staff._id,
  //       checkIn: new Date(start),
  //     })
  //   }
  // }
  output.push(`Total staff: ${staffs.length},`)

  // New patient
  //  ....

  // Move patient stage
  const patients = await Patient.find().exec()
  output.push(`Total patient: ${patients.length}`)

  // Remove patient
  //  ....

  t.setOutput(output.join(' '))
}

function remindTimeText () {
  const d2 = differenceInMilliseconds(_temp.now, __start)
  const raw = (_temp.now - start) / ((start - startest) / d2)
  if (raw > 0) {
    const remind = Math.max(0, raw)
    const s = Math.floor(remind / 1000) % 60
    const m = Math.floor(remind / 1000 % 3600 / 60)
    const h = Math.floor(remind / 1000 / 3600)
    return `ถึงปัจจุบันใน ${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`
  } else {
    return 'ปัจจุบัน'
  }
}

function totalRunTime () {
  const d = intervalToDuration({ start: __start, end: _temp.now })
  return `${d.hours < 10 ? '0' + d.hours : d.hours}:${d.minutes < 10 ? '0' + d.minutes : d.minutes}:${d.seconds < 10 ? '0' + d.seconds : d.seconds}`
}

async function doErEvent (t) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    _temp.now = Date.now()

    if (start < _temp.now) {
      await randomErEvent(t)
      // Finally, save statistic from mongo to influx
      // await collectStatisticToInflux(start)
    }

    t.setStatus(`${totalRunTime()}, ${remindTimeText()}`)

    if (start > _temp.now) {
      // Set timer for next event
      setTimeout(async () => {
        doErEvent(t)
      }, 1000)
    } else {
      // Do ER event immediate
      setImmediate(async () => {
        // Go to new date
        start += 5 * 1000
        doErEvent(t)
      })
    }
  })
}

export async function startTask () {
  task(`Start from ${format(start, 'yyyy-MM-dd HH:mm:ss')}`, async (t) => {
    return await doErEvent(t)
  })
}
