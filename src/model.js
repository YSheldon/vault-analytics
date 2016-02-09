exports.usageUpserter = function(client, row) {
  return function (cb) {
    client.query('INSERT INTO dw.fc_usage (ymd, platform, version, first_time, total) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (ymd, platform, version, first_time) DO UPDATE SET total = $5', [row._id.ymd, row._id.platform, row._id.version, row._id.first_time, row.count], (err, result) => {
      cb(err)
    })
  }
}

exports.crashUpserter = function(client, row) {
  return function (cb) {
    client.query('INSERT INTO dw.fc_crashes (ymd, platform, version, total) VALUES ($1, $2, $3, $4) ON CONFLICT (ymd, platform, version) DO UPDATE SET total = $4', [row._id.ymd, row._id.platform, row._id.version, row.count], (err, result) => {
      cb(err)
    })
  }
}
