import { differenceInMilliseconds, format, intervalToDuration } from 'date-fns'
import task from 'tasuku'
import { collectStatisticToInflux } from './dataCollector.js'
import Staff, { StaffRole } from '../model/staff.js'
import Patient, { PatientStage } from '../model/patient.js'
import CheckIn from '../model/checkIn.js'
// eslint-disable-next-line no-unused-vars
import Statistic from '../model/statistic.js'
import faker from 'faker'
// eslint-disable-next-line no-unused-vars
import { io } from '../module/server.js'

const __start = new Date()
const startest = new Date('2021-09-01 00:00:00').getTime()
let start = startest
// eslint-disable-next-line no-unused-vars
let isCurrent = false

// eslint-disable-next-line no-unused-vars
const _config = {
  staff: {
    businessDay: {
      normal: {
        minPhysician: 4,
        minNurse: 6,
      },
      break: {
        hours: [
          [7, 8],
          [12, 13],
          [17, 18],
        ],
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
        hours: [
          [7, 8],
          [12, 13],
          [17, 18],
        ],
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
        chance: 0.35, // Percent
        triage: { 5: 100, 4: 80, 3: 50, 2: 30, 1: 10 }, // โอกาส
      },
      noon: {
        hours: [12, 13, 14, 15, 16, 17],
        chance: 0.25, // Percent
        triage: { 5: 100, 4: 80, 3: 50, 2: 30, 1: 15 }, // โอกาส
      },
      night: {
        hours: [18, 19, 20, 21, 22, 23, 0, 1, 2, 3],
        chance: 0.1, // Percent
        triage: { 5: 60, 4: 70, 3: 50, 2: 30, 1: 30 }, // โอกาส
      },
    },
    accident: {
      small: {
        chance: 0.01, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // โอกาส
        size: [2, 4],
      },
      medium: {
        chance: 0.005, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // Percent
        size: [5, 9],
      },
      large: {
        chance: 0.001, // Percent
        triage: { 5: 0, 4: 3, 3: 4, 2: 3, 1: 3 }, // Percent
        size: [10, 15],
      },
    },
  },
}
// eslint-disable-next-line no-unused-vars
const _temp = {
  now: new Date(),
  staffs: [],
  staff: {
    currentPhysician: [],
    targetPhysician: 0,
    currentNurse: [],
    targetNurse: 0,
  },
  patients: [],
  task: {
    patient: {
      nextStage: {},
    },
  },
}

async function randomErEvent (t) {
  const output = [`[${format(start, 'yyyy-MM-dd HH:mm:ss')}]`]
  const nowInDate = new Date(start)
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

  // Calculate staff target
  if (isNight) {
    const c = _config.staff[isHoliday ? 'holiday' : 'businessDay'].night
    _temp.staff.targetPhysician = c.minPhysician
    _temp.staff.targetNurse = c.minNurse
  } else if (isBreak) {
    _temp.staff.targetPhysician = isBreak.minPhysician
    _temp.staff.targetNurse = isBreak.minNurse
  } else {
    const c = _config.staff[isHoliday ? 'holiday' : 'businessDay'].normal
    _temp.staff.targetPhysician = c.minPhysician
    _temp.staff.targetNurse = c.minNurse
  }

  if (_temp.staff.currentPhysician.length > _temp.staff.targetPhysician) {
    // คนเกิน Check Out ออก
    for (const staff of _temp.staff.currentPhysician) {
      const _check = await CheckIn.findOne({ userId: staff._id })
      if (_check) {
        // Check out
        await _check.remove()

        const index = _temp.staff.currentPhysician.findIndex(s => s._id === staff._id)
        _temp.staff.currentPhysician.splice(index, 1)
        emit('checkOut', { role: staff.role })
      }
      if (_temp.staff.currentPhysician.length <= _temp.staff.targetPhysician) {
        break
      }
    }
    // Save the statistic
    const statistic = await Statistic.findOne()
    statistic.currentPhysician = _temp.staff.currentPhysician.length
    await statistic.save()
  } else if (_temp.staff.currentPhysician.length < _temp.staff.targetPhysician) {
    // คนขาด Check In เพิ่ม
    for (const staff of _temp.staffs.filter(s => s.role === StaffRole.physician && !_temp.staff.currentPhysician.includes(s))) {
      const _check = await CheckIn.findOne({ userId: staff._id })
      if (!_check) {
        // Check in
        await CheckIn.create({
          userId: staff._id,
          checkIn: new Date(start),
        })
        _temp.staff.currentPhysician.push(staff)
        emit('checkIn', { role: staff.role })
      }
      if (_temp.staff.currentPhysician.length >= _temp.staff.targetPhysician) {
        break
      }
    }
    // Save the statistic
    const statistic = await Statistic.findOne()
    statistic.currentPhysician = _temp.staff.currentPhysician.length
    await statistic.save()
  }

  if (_temp.staff.currentNurse.length > _temp.staff.targetNurse) {
    // คนเกิน Check Out ออก
    for (const staff of _temp.staff.currentNurse) {
      const _check = await CheckIn.findOne({ userId: staff._id })
      if (_check) {
        // Check out
        await _check.remove()

        const index = _temp.staff.currentNurse.findIndex(s => s._id === staff._id)
        _temp.staff.currentNurse.splice(index, 1)
        emit('checkOut', { role: staff.role })
      }
      if (_temp.staff.currentNurse.length <= _temp.staff.targetNurse) {
        break
      }
    }
    // Save the statistic
    const statistic = await Statistic.findOne()
    statistic.currentNurse = _temp.staff.currentNurse.length
    await statistic.save()
  } else if (_temp.staff.currentNurse.length < _temp.staff.targetNurse) {
    // คนขาด Check In เพิ่ม
    for (const staff of _temp.staffs.filter(s => s.role === StaffRole.nurse && !_temp.staff.currentNurse.includes(s))) {
      const _check = await CheckIn.findOne({ userId: staff._id })
      if (!_check) {
        // Check in
        await CheckIn.create({
          userId: staff._id,
          checkIn: new Date(start),
        })
        _temp.staff.currentNurse.push(staff)
        emit('checkIn', { role: staff.role })
      }
      if (_temp.staff.currentNurse.length >= _temp.staff.targetNurse) {
        break
      }
    }
    // Save the statistic
    const statistic = await Statistic.findOne()
    statistic.currentNurse = _temp.staff.currentNurse.length
    await statistic.save()
  }

  // Staff output
  output.push(...staffOutput())

  // New patient (เคสธรรมดา มาทีละคน)
  let newPatientChance = 0
  let triagePossible = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  if (_config.patient.chance.morning.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.morning.chance
    triagePossible = _config.patient.chance.morning.triage
  } else if (_config.patient.chance.noon.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.noon.chance
    triagePossible = _config.patient.chance.noon.triage
  } else if (_config.patient.chance.night.hours.includes(currentHour)) {
    newPatientChance = _config.patient.chance.night.chance
    triagePossible = _config.patient.chance.night.triage
  }

  if (randomNumber(0, 100) < newPatientChance) {
    // Create new patient
    spawnPatient(triagePossible)
  }

  // New patient (เคสอุบัตติเหตุ มาหลายคน มา 3 จ่าย 4)
  if (randomNumber(0, 100) < _config.patient.accident.small.chance) {
    console.log(`💩 เกิดอุบัตติเหตุเล็ก - ${format(nowInDate, 'yyyy-MM-dd HH:mm:ss')}`)
    spawnAccidentPatients(_config.patient.accident.small)
  }
  if (randomNumber(0, 100) < _config.patient.accident.medium.chance) {
    console.log(`📛 เกิดอุบัตติเหตุกลาง - ${format(nowInDate, 'yyyy-MM-dd HH:mm:ss')}`)
    spawnAccidentPatients(_config.patient.accident.medium)
  }
  if (randomNumber(0, 100) < _config.patient.accident.large.chance) {
    console.log(`💀 เกิดอุบัตติเหตุใหญ่ - ${format(nowInDate, 'yyyy-MM-dd HH:mm:ss')}`)
    spawnAccidentPatients(_config.patient.accident.large)
  }

  // Move patient stage
  for (const patientId in _temp.task.patient.nextStage) {
    if (_temp.task.patient.nextStage[patientId] < start) {
      const patient = _temp.patients.find(p => p._id.toString() === patientId)
      if (patient) {
        const currentStage = patient.currentStage
        patient.stages[patient.stages.length - 1].end = nowInDate

        if ([1, 2, 3, 4].includes(currentStage)) {
          // Go to next stage
          patient.currentStage = currentStage + 1
          patient.stages.push({
            stage: currentStage + 1,
            start: nowInDate,
            end: null,
          })
          _temp.task.patient.nextStage[patient._id] = randomPatientNextStage(patient)
        } else if (currentStage === 5) {
          // Current stage is 5, next is 60 (Disposition)
          patient.currentStage = 60
          patient.stages.push({
            stage: 60,
            start: nowInDate,
            end: null,
          })
          _temp.task.patient.nextStage[patient._id] = randomPatientNextStage(patient)
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
          delete _temp.task.patient.nextStage[patientId]
        }
        // Save patient info
        await patient.save()
        emit('patient.update', patient)
      }
    }
  }

  // Remove patient
  if (currentHour === 0 && nowInDate.getMinutes() === 0 && nowInDate.getSeconds() === 0) {
    for (const patient of _temp.patients.filter(p => p.exit)) {
      const i = _temp.patients.findIndex(p => p._id === patient._id)
      await patient.remove()
      _temp.patients.splice(i, 1)
      emit('patient.remove', patient._id)
    }
  }

  // Patient output
  const t1 = _temp.patients.filter(p => p.triage === 1)
  const t2 = _temp.patients.filter(p => p.triage === 2)
  const t3 = _temp.patients.filter(p => p.triage === 3)
  const t4 = _temp.patients.filter(p => p.triage === 4)
  const t5 = _temp.patients.filter(p => p.triage === 5)
  output.push(`● Patient: กำลังอยู่ใน ER ${_temp.patients.filter(p => [1, 2, 3, 4, 5, 60].includes(p.currentStage)).length} คน | ออกจาก ER ไปแล้ว ${_temp.patients.filter(p => [61, 62, 63].includes(p.currentStage)).length} คน | รวม ${_temp.patients.length} คน`)
  output.push('-----------┼------┼------┼-------┼---------┼-----┼-----------┼----------┼-----┼-----')
  output.push('   Stage   |Triage|Invest|Consult|Diagnosis|Treat|Disposition|Discharged|Admit|Trans')
  output.push('-----------┼------┼------┼-------┼---------┼-----┼-----------┼----------┼-----┼-----')
  output.push(`  Triage 1 | ${patientTriageInfo(t1)}`)
  output.push(`  Triage 2 | ${patientTriageInfo(t2)}`)
  output.push(`  Triage 3 | ${patientTriageInfo(t3)}`)
  output.push(`  Triage 4 | ${patientTriageInfo(t4)}`)
  output.push(`  Triage 5 | ${patientTriageInfo(t5)}`)

  // Finally, save statistic from mongo to influx
  await collectStatisticToInflux(new Date(start))

  // Print output
  t.setOutput(output.join('\n    '))
}

/**
 *
 * @param {Patient} patient
 * @return {Number} Timestamp of next stage
 */
function randomPatientNextStage (patient) {
  let duration = 15 * 60 // seconds
  if (patient.currentStage === PatientStage.triage) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(1, 5) * 60
        break
      case 2:
        duration = randomNumber(5, 10) * 60
        break
      case 3:
        duration = randomNumber(10, 20) * 60
        break
      case 4:
        duration = randomNumber(20, 45) * 60
        break
      case 5:
        duration = randomNumber(30, 60) * 60
        break
    }
  } else if (patient.currentStage === PatientStage.investigation) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(5, 15) * 60
        break
      case 2:
        duration = randomNumber(10, 15) * 60
        break
      case 3:
        duration = randomNumber(10, 15) * 60
        break
      case 4:
        duration = randomNumber(10, 15) * 60
        break
      case 5:
        duration = randomNumber(30, 60) * 60
        break
    }
  } else if (patient.currentStage === PatientStage.consultation) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(5, 15) * 60
        break
      case 2:
        duration = randomNumber(10, 15) * 60
        break
      case 3:
        duration = randomNumber(10, 15) * 60
        break
      case 4:
        duration = randomNumber(10, 15) * 60
        break
      case 5:
        duration = randomNumber(20, 40) * 60
        break
    }
  } else if (patient.currentStage === PatientStage.diagnosis) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(5, 15) * 60
        break
      case 2:
        duration = randomNumber(10, 15) * 60
        break
      case 3:
        duration = randomNumber(10, 15) * 60
        break
      case 4:
        duration = randomNumber(10, 15) * 60
        break
      case 5:
        duration = randomNumber(20, 40) * 60
        break
    }
  } else if (patient.currentStage === PatientStage.treatment) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(20, 60) * 60
        break
      case 2:
        duration = randomNumber(30, 90) * 60
        break
      case 3:
        duration = randomNumber(30, 90) * 60
        break
      case 4:
        duration = randomNumber(30, 90) * 60
        break
      case 5:
        duration = randomNumber(30, 120) * 60
        break
    }
  } else if (patient.currentStage === PatientStage.disposition) {
    switch (patient.triage) {
      case 1:
        duration = randomNumber(10, 30) * 60
        break
      case 2:
        duration = randomNumber(10, 30) * 60
        break
      case 3:
        duration = randomNumber(10, 30) * 60
        break
      case 4:
        duration = randomNumber(10, 30) * 60
        break
      case 5:
        duration = randomNumber(15, 60) * 60
        break
    }
  }

  return start + duration * 1000
}

function staffOutput () {
  const output = []

  output.push(`● Check-in staff: หมอ ${_temp.staff.currentPhysician.length}/${_temp.staff.targetPhysician} คน + พยาบาล ${_temp.staff.currentNurse.length}/${_temp.staff.targetNurse} คน = ${_temp.staff.currentPhysician.length + _temp.staff.currentNurse.length}/${_temp.staff.targetPhysician + _temp.staff.targetNurse} คน (Staff ในระบบ ${_temp.staffs.length} คน)`)

  return output
}

function patientTriageInfo (patients) {
  return `  ${filterStage(patients, 1).length}  |   ${filterStage(patients, 2).length}  |   ${filterStage(patients, 3).length}   |    ${filterStage(patients, 4).length}    |  ${filterStage(patients, 5).length}  |     ${filterStage(patients, 60).length}     |     ${filterStage(patients, 61).length}    |  ${filterStage(patients, 62).length}  |  ${filterStage(patients, 63).length}`
}

function emit (event, ...parameters) {
  // if (isCurrent) {
  //   io.emit(event, ...parameters)
  // }
  io.emit(event, ...parameters)
}

async function spawnAccidentPatients (accident) {
  const accidentSize = randomNumber(accident.size[0], accident.size[1])
  for (let i = 0; i < accidentSize; i++) {
    await spawnPatient(accident.triage)
  }
}

async function spawnPatient (triagePossible) { // Create new patient
  const hospitalNo = parseInt(randomNumber(0, 9999999))
  const patientFirstName = faker.name.firstName()
  const patientLastName = faker.name.lastName()
  let patientTriage = 5

  // Triage random
  const r1 = randomNumber(0, Object.values(triagePossible).reduce((a, b) => a + b, 0))
  let sum = 0
  for (const _triage in triagePossible) {
    sum += triagePossible[_triage]
    if (r1 < sum) {
      patientTriage = _triage
      break
    }
  }

  const patient = await Patient.create({
    hospitalNumber: hospitalNo,
    bedNumber: '',
    name: patientFirstName,
    lastName: patientLastName,
    ventilator: false,
    triage: patientTriage,
    currentStage: 1,
    stages: [
      { stage: 1, start: new Date(start), end: null },
    ],
    entry: new Date(start),
  })
  _temp.patients.push(patient)
  emit('patient.add', patient)

  // กำหนดเวลาในการเปลี่ยน stage
  _temp.task.patient.nextStage[patient._id] = randomPatientNextStage(patient)
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
      isCurrent = true
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

async function initialData () {
  _temp.staffs = await Staff.find().exec()
  _temp.patients = await Patient.find().exec()

  // เช็คว่า staff แต่ละคน check in/out
  for (const staff of _temp.staffs) {
    const _check = await CheckIn.findOne({ userId: staff._id })
    if (_check) {
      if (staff.role === StaffRole.physician) {
        _temp.staff.currentPhysician.push(staff)
      } else if (staff.role === StaffRole.nurse) {
        _temp.staff.currentNurse.push(staff)
      }
    }
  }

  // กำหนดเวลาเปลี่ยน stage ของ patients
  for (const patient of _temp.patients.filter(p => [1, 2, 3, 4, 5, 60].includes(p.currentStage))) {
    _temp.task.patient.nextStage[patient._id] = randomPatientNextStage(patient)
  }
}

export async function startTask () {
  task(`Start from ${format(start, 'yyyy-MM-dd HH:mm:ss')}`, async (t) => {
    await initialData()
    return await doErEvent(t)
  })
}
