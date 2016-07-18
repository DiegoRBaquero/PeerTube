'use strict'
let rdb = require('rethinkdbdash')

module.exports = rdb({pool: true, port: 28015, host: process.env.DB_HOST, db: 'peertube'})