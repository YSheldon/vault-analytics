/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var request = require('request')
var ProxyAgent = require('proxy-agent')
const moment = require('moment')
const common = require('./common')

var agent
if (!process.env.LOCAL) {
  console.log("configuring proxy agent")
  agent = new ProxyAgent(process.env.FIXIE_URL)
}

// Summarize a group of publishers created on the same day
function summarizeGroup (created, group) {
  var stats = {
    created: created,
    ymd: created,
    verified: 0,
    authorized: 0,
    total: 0,
    irs: 0,
    address: 0
  }
  _.each(group, function (publisher) {
    stats.verified = stats.verified + (publisher.verified ? 1: 0)
    stats.authorized = stats.authorized + (publisher.authorized ? 1: 0)
    stats.irs = stats.irs + (publisher.legalFormURL ? 1 : 0)
    stats.total += 1
  })
  return stats
}

function summarizePublishers (publishers) {
  // calculate the ymd date
  _.forEach(publishers, function (publisher) {
    publisher.created_ts = publisher.history[0].created / 1000
    publisher.created = (new Date(publisher.created_ts * 1000)).toISOString().slice(0, 10)
  })

  // group and summarize within a day
  var grouped = _.groupBy(publishers, function (publisher) { return publisher.created })
  var mapped = _.map(grouped, function (group, created) { return summarizeGroup(created, group)})

  return mapped
}

export function verifiedPublishers (publishers) {
  return publishers.filter((publisher) => {
    return publisher.verified
  }).map((publisher) => {
    return {
      publisher: publisher.publisher,
      verified: publisher.verified,
      authorized: !!publisher.authorized,
      created: publisher.created || 0,
      created_at: moment(publisher.created || 0).format('YYYY-MM-DD')
    }
  })
}

export function allPublishers (publishers) {
  return publishers.map((publisher) => {
    return {
      publisher: publisher.publisher,
      name: publisher.name,
      provider: publisher.provider,
      verified: !!publisher.verified,
      authorized: !!publisher.authorized,
      created: publisher.created || 0,
      created_at: moment(publisher.created || 0).format('YYYY-MM-DD')
    }
  })
}

export function all (url, done) {
  var intervalID
  var limit = 10
  var delay = 20000

  var token = process.env.EYESHADE_TOKEN || common.nope('EYESHADE_TOKEN required')
  var options = {
    uri: url + "/v2/reports/publishers/status?format=json&summary=true&access_token=" + token,
    method: 'GET'
  }
  if (agent) options.agent = agent
  request(options, function (err, response, body) {
    if (err) {
      console.log(err)
      process.exit(1)
    }
    var reportURL, intervalId, results, publishers
    if (response.statusCode === 200) {
      reportURL = JSON.parse(body).reportURL
      console.log(reportURL)
      intervalID = setInterval(function () {
        var reportOptions = {
          method: "GET",
          uri: reportURL
        }
        if (agent) reportOptions.agent = agent
        request(reportOptions, function (err, response, body) {
          console.log("checking " + limit + ' - ' + response.statusCode)
          if (response.statusCode === 200) {
            clearInterval(intervalID)
            require('fs').writeFileSync('results.txt', body)
            results = summarizePublishers(JSON.parse(body.replace(/[\x00-\x1f]/g, "")))
            publishers = allPublishers(JSON.parse(body.replace(/[\x00-\x1f]/g, "")))
            done(null, results, publishers)
          } else {
            limit -= 1
            if (limit === 0) {
              throw new Error("Error: timeout reached for update-publishers")
              process.exit(1)
            }
          }
        })
      }, delay)
    }
  })
}
