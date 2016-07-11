export const startup = (id) => {
  return {
    id: id,
    ts: (new Date()).getTime()
  }
}

export const shutdown = (runInfo, db, cb) => {
  runInfo.duration = ((new Date()).getTime() - runInfo.ts) / 1000
  console.log(`'${runInfo.id}' complete - ${runInfo.duration} seconds`)
  db.query("INSERT INTO dtl.runinfo ( id, duration ) VALUES ( $1, $2 )", [runInfo.id, runInfo.duration], (err) => {
    if (err) {
      throw new Error(err)
    }
    db.query("DELETE FROM dtl.runinfo WHERE ts < current_timestamp - '7 days'::interval AND id = $1", [runInfo.id], function () {
      if (err) {
        throw new Error(err)
      }
      cb(err)
    })
  })
}
