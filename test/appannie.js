/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

var tap = require('tap')

process.env.APPANNIE_ACCOUNT_ID = 'ACCOUNT_ID'
process.env.APPANNIE_PRODUCT_ID = 'PRODUCT_ID'
process.env.APPANNIE_API_KEY = 'API_KEY'

var appannie = require('../dist/appannie')

tap.test('countryCodes', function(childTest) {
  var requestMock = function(o, cb) {
    childTest.ok(o.url.match(/meta/), 'meta passed in')
    cb(null, null, JSON.stringify({
      country_list: [
        { country_name: 'United States of America', country_code: 'US' },
        { country_name: 'Canada', country_code: 'CA' }
      ]
    }))
  }
  appannie.countryCodes(requestMock, function(countries) {
    childTest.equal(countries[0].country_code, 'US', 'US country code')
    childTest.equal(countries[0].country_name, 'United States of America', 'US name')
    childTest.equal(countries[1].country_code, 'CA', 'CA country code')
    childTest.equal(countries[1].country_name, 'Canada', 'CA name')
    childTest.end()
  })
})

tap.test('downloadsByCountry', function(childTest) {
  var requestMock = function(o, cb) {
    childTest.ok(o.url.match(/ACCOUNT_ID/), 'account id passed in')
    cb(null, null, JSON.stringify({
      sales_list: [
        {
          country: 'US',
          units: {
            product: {
              updates: 1000,
              downloads: 200
            }
          }
        },
        {
          country: 'CA',
          units: {
            product: {
              updates: 95,
              downloads: 78
            }
          }
        }
      ]
    }))
  }
  appannie.downloadsByCountry(requestMock, function(countries) {
    childTest.equal(countries[0].country, 'US', 'US country code')
    childTest.equal(countries[0].updates, 1000, 'US updates')
    childTest.equal(countries[0].downloads, 200, 'US downloads')
    childTest.equal(countries[1].country, 'CA', 'CA country code')
    childTest.equal(countries[1].updates, 95, 'CA updates')
    childTest.equal(countries[1].downloads, 78, 'CA downloads')
    childTest.end()
  })
})
