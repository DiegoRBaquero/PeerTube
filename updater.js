'use strict'
let request = require('request')

let r = require('./db')
let lg = console.log

let update = () => {
  r.table('videos').pluck('infoHash')('infoHash').coerceTo('array').run().then(infoHashes => {
    request({url: 'https://tracker.btorrent.xyz/peers', method: 'post', json: infoHashes}, (err, res, numPeers) => {
      if (err) console.error(err)
      r.table('videos').getAll(r.args(infoHashes), {index: 'infoHash'}).update((infoHash) => { return { peers: r.expr(numPeers).getField(infoHash('infoHash')) } }).run().then((result) => {
        lg('Updated peers')
      })
    })
  })
}

setInterval(update, 10000)
