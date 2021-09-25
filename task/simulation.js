import { differenceInMilliseconds, differenceInSeconds, format, intervalToDuration } from 'date-fns'
import task from 'tasuku'
import { collectStatisticToInflux } from './dataCollector.js'
import Staff from '../model/staff.js'
// eslint-disable-next-line no-unused-vars
import Patient, { PatientStage } from '../model/patient.js'
// eslint-disable-next-line no-unused-vars
import CheckIn from '../model/checkIn.js'
// eslint-disable-next-line no-unused-vars
import Statistic from '../model/statistic.js'
// eslint-disable-next-line no-unused-vars
import faker from 'faker'

const __start = new Date()
const startest = new Date('2021-09-25 00:00:00').getTime()
let start = startest

// eslint-disable-next-line no-unused-vars
const _config = {
  staff: {
    businessDay: {
      normal: {
        minPhysician: 4,
        minNurse: 6,
      },
      break: {
        hours: [[7, 8], [12, 13], [17, 18]],
        minPhysician: 2,
        minNurse: 3,
      },
      night: {
        minPhysician: 2,
        minNurse: 4,
      },
    },
    holiday: {
      normal: {
        minPhysician: 3,
        minNurse: 5,
      },
      break: {
        hours: [[7, 8], [12, 13], [17, 18]],
        minPhysician: 2,
        minNurse: 3,
      },
      night: {
        minPhysician: 2,
        minNurse: 2,
      },
    },
  },
  patient: {
    chance: {
      morning: {
        hours: [4, 5, 6, 7, 8, 9, 10, 11],
        chance: 2, // Percent
        triage: { 5: 100, 4: 80, 3: 50, 2: 30, 1: 10 }, // โอกาส
      },
      noon: {
        hours: [12, 13, 14, 15, 16, 17],
        chance: 1, // Percent
        triage: { 5: 100, 4: 80, 3: 50, 2: 30, 1: 10 }, // โอกาส
      },
      night: {
        hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3],
        chance: 0.25, // Percent
        triage: { 5: 100, 4: 80, 3: 50, 2: 30, 1: 10 }, // โอกาส
      },
    },
    accident: {
      small: {
        chance: 0, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // โอกาส
        size: [2, 4],
      },
      mediem: {
        chance: 0, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // Percent
        size: [5, 9],
      },
      big: {
        chance: 0, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // Percent
        size: [10, 30],
      },
    },
  },
}
// eslint-disable-next-line no-unused-vars
const _temp = {
  now: new Date(),
  staffs: [],
  staff: {
    currentPhysician: 0,
    targetPhysician: 0,
    currentNurse: 0,
    targetNurse: 0,
  },
  patients: [],
}

async function randomErEvent (t) {
  const output = [`[${format(start, 'yyyy-MM-dd HH:mm:ss')}]`]
  const nowInDate = new Date(_temp.now)
  const currentHour = nowInDate.getHours()
  const isHoliday = [0, 6].includes(nowInDate.getDay())
  const isNight = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7].includes(currentHour)

  // Staff check in/out
  let isBreak = false
  // Check break time
  for (const _hour of _config.staff[isHoliday ? 'holiday' : 'businessDay'].break.hours) {
    if (currentHour >= _hour[0] && currentHour <= _hour[1]) {
      isBreak = _config.staff[isHoliday ? 'holiday' : 'businessDay'].break
    }
  }

  // Calculate target
  if (isBreak) {
    _temp.staff.targetPhysician = isBreak.minPhysician
    _temp.staff.targetNurse = isBreak.minNurse
  } else if (isNight) {
    const c = _config.staff[isHoliday ? 'holiday' : 'businessDay'].night
    _temp.staff.targetPhysician = c.minPhysician
    _temp.staff.targetNurse = c.minNurse
  } else {
    const c = _config.staff[isHoliday ? 'holiday' : 'businessDay'].normal
    _temp.staff.targetPhysician = c.minPhysician
    _temp.staff.targetNurse = c.minNurse
  }

  // for (const staff of _temp.staffs) {
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

  // Staff output
  output.push(...staffOutput())

  // New patient
  let newPatientChance = 0
  if (_config.patient.chance.morning.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.morning.chance
  } else if (_config.patient.chance.noon.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.noon.chance
  } else if (_config.patient.chance.night.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.night.chance
  }

  if (randomNumber(0, 100) < newPatientChance) {
    // Create new patient
    const hospitalNo = randomNumber(0, 9999999)
    const patientFirstName = faker.name.firstName()
    const patientLastName = faker.name.lastName()
    let patientTriage = 5

    let triagePosible = { 5: 3, 4: 2, 3: 2, 2: 1, 1: 0 }
    for (const time in _config.patient.chance) {
      if (randomNumber(0, 100) < _config.patient.chance[time].change) {
        triagePosible = _config.patient.chance[time].triage
        break
      }
    }

    const r1 = randomNumber(0, Object.values(triagePosible).reduce((a, b) => a + b, 0))
    let sum = 0
    for (const _triage in triagePosible) {
      sum += triagePosible[_triage]
      if (r1 < sum) {
        patientTriage = _triage
        break
      }
    }

    _temp.patients.push(await Patient.create({
      hospitalNumber: hospitalNo,
      bedNumber: '',
      name: patientFirstName,
      lastName: patientLastName,
      ventilator: false,
      triage: patientTriage,
      currentStage: 1,
      stages: [
        { stage: 1, start: nowInDate, end: null },
      ],
      entry: nowInDate,
    }))
  }

  // Move patient stage
  for (const patient of _temp.patients.filter(p => p.currentStage <= 60)) {
    let change = 1
    const LoSall = differenceInSeconds(nowInDate, patient.entry)
    const LoSstage = differenceInSeconds(nowInDate, patient.stages[patient.stages.length - 1].start)

    if (LoSall > 3600) {
      change += 2.4
    }
    if (LoSstage > 3600) {
      change += 5
    } else if (LoSstage > 1800) {
      change += 1
    }

    const r2 = randomNumber(0, 100)
    if (r2 < change) {
      const currentStage = patient.currentStage
      patient.stages[patient.stages.length - 1].end = nowInDate

      if (currentStage === 5) {
        // Current stage is 5, next is 60 (Disposition)
        patient.currentStage = 60
        patient.stages.push({
          stage: 60,
          start: nowInDate,
          end: null,
        })
      } else if (currentStage === 60) {
        // Current stage is 60 (Disposition), next will be 61, 62, 63 (Discharged, Admited, Transfered)
        const nextStage = faker.random.arrayElement([61, 62, 63])
        patient.currentStage = nextStage
        patient.stages.push({
          stage: nextStage,
          start: nowInDate,
          end: nowInDate,
        })
        patient.exit = nowInDate
      } else if ([1, 2, 3, 4].includes(currentStage)) {
        // Go to next stage
        patient.currentStage = currentStage + 1
        patient.stages.push({
          stage: currentStage + 1,
          start: nowInDate,
          end: null,
        })
      }
      await patient.save()
    }
  }

  // Remove patient
  if (currentHour === 0 && nowInDate.getMinutes() === 0 && nowInDate.getSeconds() === 0) {
    for (const patient of _temp.patients) {
      if (patient.exit) {
        const i = _temp.patients.findIndex(p => p._id === patient._id)
        await patient.remove()
        _temp.patients.splice(i, 1)
      }
    }
  }

  // Patient output
  const t1 = _temp.patients.filter(p => p.triage === 1)
  const t2 = _temp.patients.filter(p => p.triage === 2)
  const t3 = _temp.patients.filter(p => p.triage === 3)
  const t4 = _temp.patients.filter(p => p.triage === 4)
  const t5 = _temp.patients.filter(p => p.triage === 5)
  output.push(`● Total patient: ${_temp.patients.length}`)
  output.push('-----------┼------┼------┼-------┼---------┼-----┼-----------┼----------┼-----┼-----')
  output.push('   Stage   |Triage|Invest|Consult|Diagnosis|Treat|Disposition|Discharged|Admit|Trans')
  output.push('-----------┼------┼------┼-------┼---------┼-----┼-----------┼----------┼-----┼-----')
  output.push(`  Triage 1 | ${patientTriageInfo(t1)}`)
  output.push(`  Triage 2 | ${patientTriageInfo(t2)}`)
  output.push(`  Triage 3 | ${patientTriageInfo(t3)}`)
  output.push(`  Triage 4 | ${patientTriageInfo(t4)}`)
  output.push(`  Triage 5 | ${patientTriageInfo(t5)}`)

  // Finally, save statistic from mongo to influx
  await collectStatisticToInflux(start)

  // Print output
  t.setOutput(output.join('\n    '))
}

function staffOutput () {
  const output = []

  output.push(`● Check-in staff: ${_temp.staff.currentPhysician} Physician + ${_temp.staff.currentNurse} Nurse = ${_temp.staff.currentPhysician + _temp.staff.currentNurse} (Total staff ${_temp.staffs.length})`)

  return output
}

function patientTriageInfo (patients) {
  return `  ${filterStage(patients, 1).length}  |   ${filterStage(patients, 2).length}  |   ${filterStage(patients, 3).length}   |    ${filterStage(patients, 4).length}    |  ${filterStage(patients, 5).length}  |     ${filterStage(patients, 60).length}     |     ${filterStage(patients, 61).length}    |  ${filterStage(patients, 62).length}  |  ${filterStage(patients, 63).length}`
}

/**
 *
 * @param {Patient[]} patients
 * @param {PatientStage} stage
 * @returns {Patient[]}
 */
function filterStage (patients, stage) {
  return patients.filter(p => p.currentStage === stage)
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

/**
 * If `randomNumber(0, 100)` =  random 0 ~ 99.99999
 * ใน 1 วันมีโอกาสทำงาน 17280 ครั้ง
 * 1% ของ 17280 = 172.28 ครั้ง
 *
 * @param {Number} min
 * @param {Number} max
 * @returns
 */
function randomNumber (min, max) {
  return Math.random() * (max - min) + min
}
randomNumber()

async function doErEvent (t) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    _temp.now = Date.now()

    if (start < _temp.now) {
      await randomErEvent(t)
    }

    t.setStatus(`${totalRunTime()}, ${remindTimeText()}`)

    if (start > _temp.now) {
      // Set timer for next event
      setTimeout(async () => {
        _temp.staffs = await Staff.find().exec()
        _temp.patients = await Patient.find().exec()

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
    _temp.staffs = await Staff.find().exec()
    _temp.patients = await Patient.find().exec()

    return await doErEvent(t)
  })
}
