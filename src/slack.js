/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var _ = require('underscore')
var Slack = require('node-slack')

var slack
var params

module.exports.setup = function (server, config, debug) {
  debug = debug || console.log

  if (config.slack && config.slack.webhook && !process.env.LOCAL) {
    debug('Configuring Slack')
    slack = new Slack(config.slack.webhook)
  } else {
    debug('Skipping Slack configuration')
  }
  params = config.slack

  module.exports.notify = function (payload) {
    debug(payload.text)
    if (!slack) {
      debug('Slack webhook not configured')
      return
    }

    _.defaults(payload, { channel: params.channel,
                          username: config.npminfo.name,
                          icon_url: params.icon_url,
                          text: 'ping.' })

    slack.send(payload, (res, err, body) => {
      if (err) console.log(err)
    })
  }
}
