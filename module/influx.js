import { InfluxDB } from '@influxdata/influxdb-client'

const token = 'xqMcanwN1tSLj-cGMYG1jyXl20UsZV1ptjloAB6r7GmYzmkSoKRCLWdVu1CZPtKXgauq9UN4nGoOQIPzpdqZ_A=='
export const org = 'mder'
export const bucket = 'statistics'

const client = new InfluxDB({ url: 'http://localhost:7076', token: token })

export default client
