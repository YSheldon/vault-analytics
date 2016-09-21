# Brave Analytics

Graphical view of usage / crash stats and analytics, crash reporting

## Setup

Clone the repo

Install dependencies `npm install`

`npm run build && npm start`

## Running Tests

`npm run build && npm run test`

## Crash symbols

Crash symbols are retrieved and stored by the brave/electron-debug-symbols npm module. It uses a space separated `BRAVE_VERSIONS` environment variable to determine which versions to store on Heroku. Currently we are limited to three versions due to sizing restrictions in the compressed dyno.

The environment variable should be modified either in the Heroku interface or through the heroku toolset.

`heroku config:set BRAVE_VERSIONS='1.3.8 1.3.10 1.3.15'`
`heroku config:set NODE_MODULES_CACHE='false'`

The symbols will be retrieved and stored on the next commit / push to Heroku.
