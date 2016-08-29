/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*
  Fastly log file parsing for anonymous usage states with country / dma location
 */

const fs = require('fs')
const urlUtils = require('url')

const _ = require('underscore')

/*
  Parse a log file line into its parts

  Log file lines looking like: "<134>2016-06-06T02:00:03Z cache-lax1432 laptop-updates[337132]: 200 /1/releases/dev/0.10.0/winx64?daily=true&weekly=false&monthly=false&first=false US 801"

  will return an object:

{ apiVersion: 1,
  channel: 'dev',
  version: '0.10.0',
  platform: 'winx64',
  daily: true,
  weekly: false,
  monthly: false,
  first: false,
  statusCode: 200,
  countryCode: 'US',
  dmaCode: 801 }

*/
export const parseLine = (line) => {
  var attributes = {}
  var tokens = line.split(/\s+/)

  // parse the URL component of the log line
  var parseUrl = (url) => {
    var components = {}
    var path, query
    var $, apiVersion, releases, channel, version, os
    [path, query] = url.split('?')
    let tokens = path.split('/')
    components.apiVersion = parseInt(tokens[1], 10)
    components.channel = tokens[3]
    components.version = tokens[4]
    components.platform = tokens[5]
    // legacy handling of undefined platform
    if (components.platform === 'undefined') {
      components.platform = 'linux'
    }
    components = _.extend(components, urlUtils.parse(url, true).query)
    // boolean field handling
    _.each(['daily', 'weekly', 'monthly', 'first'], (attr) => {
      components[attr] = components[attr] === 'true'
    })
    return components
  }

  _.extend(attributes, parseUrl(tokens[4]))

  attributes.statusCode = parseInt(tokens[3], 10)
  attributes.countryCode = tokens[5] || 'unknown'
  attributes.dmaCode = parseInt(tokens[6] || 0)

  return attributes
}

/*
  Process log file, running each release line through parseLine

  Returns an Array of Objects
*/
export const parseFile = (filename) => {
  return fs.readFileSync(filename, 'utf-8').split(/\n/)
    .filter((line) => { return line.length })
    .filter((line) => { return line.match(/releases/) })
    .map((line) => { return parseLine(line) })
}

export const parseContents = (contents) => {
  return contents.split(/\n/)
    .filter((line) => { return line.length })
    .filter((line) => { return line.match(/releases/) })
    .map((line) => { return parseLine(line) })
}

/*
  Perform filtering and summarization of records

  sample usage:

    var summary = fastly.groupedSummaryBy(records, ['countryCode'], { daily: true })

  summary will be an object keyed on countryCode containing the number of rows that have a daily=true attribute
*/
export const groupedSummaryBy = (records, fields, predicates) => {
  // default to no predicates
  predicates = predicates || {}

  // don't modify the original records array
  var filtered = _.clone(records)

  // filter the records based on predicate
  filtered = _.filter(filtered, (record) => {
    var passes = true
    _.each(predicates, (v, k) => {
      if (passes && record[k] !== v) {
        passes = false
      }
    })
    return passes
  })

  // group filtered records by the contents of a set of specified fields
  var grouped = _.groupBy(filtered, (obj) => {
    return fields.map((field) => { return obj[field] }).join('~')
  })

  // calculate the number of records in each group
  var results = {}
  _.each(grouped, (v, k) => {
    results[k] = v.length
  })

  // Format the return value as array of objects
  var finalRecords = _.map(results, (v, k) => {
    var tokens = k.split('~')
    var record = {}
    _.each(tokens, (token, i) => {
      record[fields[i]] = token
    })
    record.count = v
    return record
  })

  return finalRecords
}
