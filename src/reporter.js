export const startup = (id) => {
  console.log("Starting - " + id)
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
    db.query("DELETE FROM dtl.runinfo WHERE ts < current_timestamp - '14 days'::interval AND id = $1", [runInfo.id], function () {
      if (err) {
        throw new Error(err)
      }
      cb(err)
    })
  })
}

export const complete = async (runInfo, db) => {
  try {
    runInfo.duration = ((new Date()).getTime() - runInfo.ts) / 1000
    console.log(`'${runInfo.id}' complete - ${runInfo.duration} seconds`)
    await db.query("INSERT INTO dtl.runinfo ( id, duration ) VALUES ( $1, $2 )", [runInfo.id, runInfo.duration])
    await db.query("DELETE FROM dtl.runinfo WHERE ts < current_timestamp - '14 days'::interval AND id = $1", [runInfo.id])
  } catch (e) {
    console.log("error: " + e)
  }
}
