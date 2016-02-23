exports.usageUpserter = function(client, row) {
  return function (cb) {
    client.query('INSERT INTO dw.fc_usage (ymd, platform, version, first_time, channel, total) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (ymd, platform, version, first_time, channel) DO UPDATE SET total = $6', [row._id.ymd, row._id.platform, row._id.version, row._id.first_time, row._id.channel, row.count], (err, result) => {
      cb(err)
    })
  }
}

exports.crashUpserter = function(client, row) {
  return function (cb) {
    client.query('INSERT INTO dw.fc_crashes (ymd, platform, version, channel, total) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (ymd, platform, version, channel) DO UPDATE SET total = $5', [row._id.ymd, row._id.platform, row._id.version, row._id.channel, row.count], (err, result) => {
      cb(err)
    })
  }
}
