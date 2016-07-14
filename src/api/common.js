/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('underscore')

const allPlatforms = ['osx', 'winx64', 'winia32', 'ios', 'android', 'unknown', 'linux', 'darwin']
exports.allPlatforms = allPlatforms

const allChannels = ['dev', 'beta', 'stable']
exports.allChannels = allChannels

exports.channelPostgresArray = (channelFilter) => {
  let channels = _.filter((channelFilter || '').split(','), (channel) => channel !== '')
  if (!channels.length) {
    return allChannels
  } else {
    return channels
  }
}

exports.platformPostgresArray = (platformFilter) => {
  let platforms = _.filter((platformFilter || '').split(','), (platform) => platform !== '')
  if (!platforms.length) {
    return allPlatforms
  } else {
    return platforms
  }
}

exports.formatPGRow = (row) => {
  if (row.count) {
    row.count = parseInt(row.count, 10)
    if (row.first_count) {
      row.first_count = parseInt(row.first_count, 10)
    }
    if (row.all_count) {
      row.all_count = parseInt(row.all_count, 10)
    }
  }
  if (row.daily_percentage) {
    row.daily_percentage = parseFloat(row.daily_percentage)
  }
  return row
}

const todayISODate = () => {
  let d = new Date()
  return [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), ('0' + d.getDate()).slice(-2)].join('-')
}

const todayISOMonth = () => {
  let d = new Date()
  return [d.getFullYear(), ('0' + (d.getMonth() + 1)).slice(-2), '01'].join('-')
}

exports.potentiallyFilterToday = (rows, showToday) => {
  if (!showToday) {
    var today = todayISODate()
    rows = _.filter(rows, (row) => {
      return row.ymd < today
    })
  }
  return rows
}

exports.potentiallyFilterThisMonth = (rows, showMonth) => {
  if (!showMonth) {
    var thisMonth = todayISOMonth()
    rows = _.filter(rows, (row) => {
      return row.ymd < thisMonth
    })
  }
  return rows
}
