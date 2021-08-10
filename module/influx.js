import { InfluxDB } from '@influxdata/influxdb-client'

const token = 'e37F3iwYI8amMjZqR2F0bMdBhI8qCyMj-2OJJ2ftEapfnXjGURC9oh2JPco5MjHMJ7W6Fai1wF2GsiQcnxoGsA=='
export const org = 'mder'
export const bucket = 'statistic'

const client = new InfluxDB({ url: 'http://localhost:7076', token: token })

export default client
