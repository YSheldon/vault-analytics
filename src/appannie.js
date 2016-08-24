/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

/*

  Sample usage:

    var appannie = require('./appannie')
    var request = require('request')

    appannie.downloadsByCountry(request, function(countries) {
      // countries contains the requested JSON structure from AppAnnie
    })

*/

const APPANNIE_ACCOUNT_ID = process.env.APPANNIE_ACCOUNT_ID
const APPANNIE_PRODUCT_ID = process.env.APPANNIE_PRODUCT_ID
const APPANNIE_API_KEY = process.env.APPANNIE_API_KEY

const BASE_URL = 'https://api.appannie.com'

export function checkForCredentials () {
  if (!(APPANNIE_ACCOUNT_ID && APPANNIE_PRODUCT_ID && APPANNIE_API_KEY)) {
    console.log(APPANNIE_ACCOUNT_ID, APPANNIE_PRODUCT_ID, APPANNIE_API_KEY)
    throw new Error('AppAnnie credentials need to be stored in APPANNIE_ACCOUNT_ID, APPANNIE_PRODUCT_ID and APPANNIE_API_KEY environment variables')
  }
}

// Take URL and issue request object containing API KEY header
function requestOptions (url) {
  return {
    url: url,
    headers: {
      'Authorization': 'bearer ' + APPANNIE_API_KEY
    }
  }
}

// Retrieve list of country codes in the following format:
//
// [
//   { country_name: 'Ghana', country_code: 'GH' },
//   { country_name: 'Gibraltar', country_code: 'GI' },
//   ..
// ]
export function countryCodes (r, cb) {
  checkForCredentials()
  var options = requestOptions(`${BASE_URL}/v1.2/meta/countries`)
  r(options, (err, request, response) => {
    if (err) {
      throw new Error(err)
    }
    cb(JSON.parse(response).country_list)
  })
}

// Retrieve downloads and updates by country in the following format:
//
// [
//   {
//     "country": "US",
//     "updates": 1000,
//     "downloads": 200
//   },
//   ..
// ]
export function downloadsByCountry (r, cb) {
  checkForCredentials()
  var options = requestOptions(`${BASE_URL}/v1.2/accounts/${APPANNIE_ACCOUNT_ID}/products/${APPANNIE_PRODUCT_ID}/sales?break_down=country`)
  r(options, (err, request, response) => {
    if (err) {
      throw new Error(err)
    }
    cb(JSON.parse(response).sales_list.map((country) => {
      return {
        country: country.country,
        updates: country.units.product.updates || 0,
        downloads: country.units.product.downloads
      }
    }))
  })
}

// Retrieve downloads and updates by country past a specific date in the following format:
//
// [
//   {
//     "country": "US",
//     "updates": 0,
//     "downloads": 200
//   },
//   ..
// ]
export function downloadsByCountryStart (r, start, cb) {
  checkForCredentials()
  var options = requestOptions(`${BASE_URL}/v1.2/accounts/${APPANNIE_ACCOUNT_ID}/products/${APPANNIE_PRODUCT_ID}/sales?break_down=country&start_date=${start}`)
  r(options, (err, request, response) => {
    if (err) {
      throw new Error(err)
    }
    cb(JSON.parse(response).sales_list.map((country) => {
      return {
        country: country.country,
        updates: country.units.product.updates || 0,
        downloads: country.units.product.downloads
      }
    }))
  })
}
