var platforms = {
  darwin: 'osx',
  win32: 'winx64'
}

exports.crashesForYMDPlatform = (db, ymd, platform, cb) => {
  var query = db.collection('crashes').aggregate([
    {
      $project: {
        date: {
          $add: [ (new Date(0)), '$ts' ]
        },
        _version: 1,
        ver: 1,
        ptime: 1,
        platform: {
          $ifNull: [ '$platform', 'unknown' ]
        },
        ymd: {
          $dateToString: {
            format: '%Y-%m-%d', date: {
              $add: [ (new Date(-5 * 60 * 60000)), '$ts' ]
            }
          }
        }
      }
    },
    {
      $match: {
        platform: platform,
        ymd: ymd
      }
    }])

  query.toArray((err, results) => {
    console.log(results.length)
    cb(err, results)
  })
}

exports.dailyCrashReportsFullGrouped = (db, cb, ts, days) => {
  ts = ts || (new Date()).getTime()
  days = days || 7

  var query = db.collection('crashes').aggregate([
    {
      $project: {
        date: {
          $add: [ (new Date(0)), '$ts' ]
        },
        platform: {
          $ifNull: [ '$platform', 'unknown' ]
        },
        channel: {
          $ifNull: [ '$channel', 'dev' ]
        },
        version: {
          $ifNull: [ '$_version', '0.0.0' ]
        },
        ymd: {
          $dateToString: {
            format: '%Y-%m-%d', date: {
              $add: [ (new Date(-5 * 60 * 60000)), '$ts' ]
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
          version: '$version',
          channel: '$channel'
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
        '_id.channel': 1
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
          $add: [ (new Date(0)), '$ts' ]
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
        channel: {
          $ifNull: [ '$channel', 'dev' ]
        },
        ymd: {
          $dateToString: {
            format: '%Y-%m-%d', date: {
              $add: [ (new Date(-5 * 60 * 60000)), '$ts' ]
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
          first_time: '$first_time',
          channel: '$channel'
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
        '_id.first_time': 1,
        '_id.channel': 1
      }
    }
  ])

  query.toArray((err, result) => {
    result = result.concat(exceptions)
    cb(err, result)
  })
}

exports.dailyMonthlyUsers = (db, cb, ts, days) => {
  ts = ts || (new Date()).getTime()
  days = days || 7

  var query = db.collection('usage').aggregate([
    {
      $match: { monthly: true }
    },
    {
      $project: {
        date: {
          $add: [ (new Date(0)), '$ts' ]
        },
        platform: {
          $ifNull: [ '$platform', 'unknown' ]
        },
        version: {
          $ifNull: [ '$version', '0.0.0' ]
        },
        channel: {
          $ifNull: [ '$channel', 'dev' ]
        },
        ymd: {
          $dateToString: {
            format: '%Y-%m-%d', date: {
              $add: [ (new Date(-5 * 60 * 60000)), '$ts' ]
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
          channel: '$channel'
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
        '_id.channel': 1
      }
    }
  ])

  query.toArray((err, result) => {
    cb(err, result)
  })
}
