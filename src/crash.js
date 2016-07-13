const mini = require('./mini')

exports.parsedCrash = (pg, id, cb) => {
  pg.query('SELECT * FROM dtl.crashes WHERE id = $1', [id], (err, results) => {
    mini.readAndParse(id, (s3err, minidump, metadata) => {
      minidump = minidump.toString()
      console.log(metadata)
      cb(s3err, {
        crash_report: minidump,
        meta: metadata
      })
    })
  })
}
