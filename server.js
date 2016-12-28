'use strict'

// Modules
// let bodyParser = require('body-parser')
let createTorrent = require('create-torrent')
let express = require('express')
let fs = require('fs')
let multer = require('multer')
let parseTorrent = require('parse-torrent')

// Vars
let app = express()
let r = require('./db')
let upload = multer({dest: 'tmp/', limits: {fileSize: 1024 * 1024 * 200}}).single('file')
let lg = console.log

app.enable('trust proxy')

app.set('view engine', 'pug')
app.use(express.static(__DIRNAME + '/public'))
// app.use(bodyParser.json())

app.get('/', (req, res) => {
  r.table('videos').orderBy({index: r.desc('createdAt')}).limit(20).run().then(newVideos => {
    r.table('videos').orderBy({index: r.desc('peers')}).limit(20).run().then(popularVideos => {
      res.render('index', {popularVideos: popularVideos, newVideos: newVideos})
    })
  })
})

app.get('/upload', (req, res) => {
  res.render('upload')
})

app.get('/view/:infoHash', (req, res) => {
  r.table('videos').get(req.params.infoHash).run().then(result => {
    lg(result)
    res.render('view', {video: result})
  })
})

app.post('/video', upload, (req, res) => {
  if (req.file == null) {
    console.log('No file')
    res.status(400).send('You have to give me a file')
    return
  }
  // lg('Receiving file...' + req.file.originalname)
  lg(req.file)
  createTorrent(req.file.path, {
    name: req.file.originalname
  }, (err, torrent) => {
    if (err) {
      console.error(err)
      res.status(400).send('Error creating torrent')
      return
    }

    let parsedTorrent = parseTorrent(torrent)

    parsedTorrent.urlList = [process.env.TORRENTS_URL + parsedTorrent.infoHash + '/' + parsedTorrent.infoHash + '.mp4']

    delete parsedTorrent.info
    delete parsedTorrent.infoBuffer
    delete parsedTorrent.infoHashBuffer
    delete parsedTorrent.created
    delete parsedTorrent.announce

    parsedTorrent.info = {}

    // lg(parsedTorrent)

    r.table('videos').insert({infoHash: parsedTorrent.infoHash, name: req.body.name, torrent: parsedTorrent, peers: 0, createdAt: r.now()}).run().then((result) => {
      // lg(result)
      res.redirect('/')
    })

    try {
      fs.accessSync('public/videos/' + parsedTorrent.infoHash, fs.F_OK)
      // Do something
      return
    } catch (e) {
      console.error(e)
      // It isn't accessible
      lg("doesn't exist")
    }

    torrent = parseTorrent.toTorrentFile(parsedTorrent)

    fs.mkdir('public/videos/' + parsedTorrent.infoHash, (err) => {
      if (err) console.error(err)
      fs.writeFile('public/videos/' + parsedTorrent.infoHash + '/' + parsedTorrent.infoHash + '.torrent', torrent)
      fs.rename('tmp/' + req.file.filename, 'public/videos/' + parsedTorrent.infoHash + '/' + parsedTorrent.infoHash + '.mp4', (err) => {
        if (err) console.error(err)
      })
    })
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log('Started')
})
