var moment = require('moment')

var platforms = {
  darwin: 'osx',
  win32: 'winx64'
}

exports.dailyCrashReportsFullGrouped = (db, cb, ts, days) => {
  ts = ts || (new Date()).getTime()
  days = days || 7

  var query = db.collection('crashes').aggregate([
    {
      $project: {
        date: {
          $add : [ (new Date(0)), '$ts' ]
        },
        platform: {
          $ifNull: [ '$platform', 'unknown' ]
        },
        version: {
          $ifNull: [ '$_version', '0.0.0' ]
        },
        ymd: {
          $dateToString: {
            format: "%Y-%m-%d", date: {
              $add : [ (new Date(-5 * 60 * 60000)), '$ts' ]
            }
          }
        }
      }
    },
    {
      $group: {
        _id: {
          ymd: '$ymd',
          platform: '$platform',
          version: '$version'
        },
        count: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        '_id.ymd': -1,
        '_id.platform': 1,
        '_id.version': 1
      }
    }
  ])

  query.toArray((err, results) => {
    results = results.map((result) => {
      result._id.platform = platforms[result._id.platform] || 'unknown'
      return result
    })
    cb(err, results)
  })
}

exports.dailyActiveUsersFullGrouped = (db, exceptions, cb, ts, days) => {
  ts = ts || (new Date()).getTime()
  days = days || 7

  var query = db.collection('usage').aggregate([
    {
      $match: { daily: true }
    },
    {
      $project: {
        date: {
          $add : [ (new Date(0)), '$ts' ]
        },
        platform: {
          $ifNull: [ '$platform', 'unknown' ]
        },
        version: {
          $ifNull: [ '$version', '0.0.0' ]
        },
        first_time: {
          $ifNull: [ '$first', false ]
        },
        ymd: {
          $dateToString: {
            format: "%Y-%m-%d", date: {
              $add : [ (new Date(-5 * 60 * 60000)), '$ts' ]
            }
          }
        }
      }
    },
    {
      $match: {
          ymd: { $gt: '2016-01-18' }
      }
    },
    {
      $group: {
        _id: {
          ymd: '$ymd',
          platform: '$platform',
          version: '$version',
          first_time: '$first_time'
        },
        count: {
          $sum: 1
        }
      }
    },
    {
      $sort: {
        '_id.ymd': -1,
        '_id.platform': 1,
        '_id.version': 1,
        '_id.first_time': 1
      }
    }
  ])

  query.toArray((err, result) => {
    result = result.concat(exceptions)
    cb(err, result)
  })
}
