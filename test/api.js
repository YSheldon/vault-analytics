var tap = require('tap')
var _ = require('underscore')

var apiCommon = require('../dist/api/common')

tap.ok(_.isArray(apiCommon.allPlatforms) && apiCommon.allPlatforms.length > 0, 'allPlatforms is defined correctly')

tap.ok(_.isArray(apiCommon.allChannels) && apiCommon.allChannels.length > 0, 'allChannels is defined correctly')

tap.ok(apiCommon.channelPostgresArray('').length === apiCommon.allChannels.length, 'channel filter works with empty filter')

tap.ok(apiCommon.channelPostgresArray('dev,stable').length === 2, 'channel filter works with filter')

tap.ok(apiCommon.platformPostgresArray('').length === apiCommon.allPlatforms.length, 'platform filter works with empty filter')

tap.ok(apiCommon.platformPostgresArray('osx,ios').length === 2, 'platform filter works with filter')
