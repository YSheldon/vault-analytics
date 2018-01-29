const TBL = 'svr.sessions'
const TTL = 3 * 24 * 60 * 60 * 1000
const DEBUG = process.env.CATBOX_DEBUG || null

module.exports.setup = (server, runtime) => {
  return {
    start: (cb) => {
     cb()
    },
    stop: () => {
      // noop
    },
    isReady: () => { return true },
    validateSegmentName: (name) => {
      return null;
    },
    get: async (k, cb) => {
      const results = await runtime.db.query("SELECT * FROM " + TBL + " WHERE id = $1", [k])
      if (results.rows.length > 0) {
        let row = results.rows[0]
        row.stored = parseInt(row.stored)
        row.ttl = parseInt(row.ttl)
        if ((new Date().getTime()) > (row.stored + row.ttl)) {
          await runtime.db.query("DELETE FROM " + TBL + " WHERE id = $1", [k])
          return cb(null, null)
        } else {
          return cb(null, results.rows[0].item)
        }
      } else {
        return cb(null, null)
      }
    },
    set: async (k, v, ttl, cb) => {
      ttl = ttl || TTL
      await runtime.db.query("INSERT INTO " + TBL + " (id, item, stored, ttl) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET item = EXCLUDED.item, stored = EXCLUDED.stored, ttl = EXCLUDED.ttl", [k, v, (new Date()).getTime(), ttl])
      cb(null)
    },
    drop: async (k, cb) => {
      await runtime.db.query("DELETE FROM " + TBL + " WHERE id = $1", [k])
      cb(null)
    }
  }
}
