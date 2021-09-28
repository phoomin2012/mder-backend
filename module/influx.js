import { InfluxDB } from '@influxdata/influxdb-client'

process.env.INFLUX_URL = process.env.INFLUX_URL || 'localhost:7076'

const token = process.env.INFLUXDB_TOKEN || 'xqMcanwN1tSLj-cGMYG1jyXl20UsZV1ptjloAB6r7GmYzmkSoKRCLWdVu1CZPtKXgauq9UN4nGoOQIPzpdqZ_A=='
export const org = 'mder'
export const bucket = 'statistics'

const client = new InfluxDB({ url: `http://${process.env.INFLUX_URL}`, token: token })

export default client
