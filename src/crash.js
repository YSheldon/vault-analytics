const mini = require('./mini')

exports.parsedCrash = (pg, id, cb) => {
  pg.query('SELECT * FROM dtl.crashes WHERE id = $1', [id], (err, results) => {
    mini.readAndParse(id, (s3err, minidump) => {
      minidump = minidump.toString()
      console.log(minidump)
      var meta = mini.parsePlainTextMinidump(minidump)
      console.log(meta)
      cb(s3err, {
        crash_report: minidump,
        meta: meta
      })
    })
  })
}
