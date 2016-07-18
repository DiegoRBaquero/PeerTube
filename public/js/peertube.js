let WebTorrent = require('webtorrent')

global.WEBTORRENT_ANNOUNCE = ['wss://tracker.btorrent.xyz', 'wss://tracker.webtorrent.io', 'wss://tracker.openwebtorrent.com']

let client = new WebTorrent()

window.client = client