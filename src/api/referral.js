const common = require('./common')

// method, local uri, remote uri, description
const proxyForwards = [
  ['GET', '/api/1/promo/stats/summary', '/api/1/promo/stats/summary', 'Retrieve referral promo summary stats']
]

exports.setup = (server, db, mongo) => {
  server.route({
    method: 'GET',
    path: '/api/1/referral/stats/summary',
    config: {
      tags: ['api'],
      description: 'Proxy call to retrieve referral promo summary stats',
      handler: async (request, reply) => {
        try {
          var options = {
            method: 'GET',
            url: process.env.PROMO_SERVICES_URL + '/api/1/promo/stats/summary',
            headers: {
              Authorization: 'Bearer ' + process.env.PROMO_SERVICES_TOKEN
            }
          }
          let results = JSON.parse(await common.prequest(options))
          reply(results)
        } catch (e) {
          console.log(e)
          reply(null)
        }
      }
    }
  })
}
