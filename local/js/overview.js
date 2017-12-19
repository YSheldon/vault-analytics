var firstRun = function (rows, b) {
  var groups = _.groupBy(rows, function (row) { return row.mobile })
  var desktop = groups[false].sort(function(a, b) { return b.count - a.count })
  var mobile = groups[true].sort(function(a, b) { return b.count - a.count })

  var sumOfAll = _.reduce(rows, function (memo, row) { return memo + row.count }, 0)
  var sumOfDesktop = _.reduce(desktop, function (memo, row) { return memo + row.count }, 0)
  var table = $("#overview-first-run-table-desktop tbody")
  table.empty()
  _.each(desktop, function (row) {
    var buf = '<tr>'
    buf = buf + b.td(`<img src="/local/img/platform-icons/${row.platform}.png" height="18">`)
    buf = buf + b.td(row.platform, 'left')
    buf = buf + b.td(b.st(row.count), 'right')
    buf = buf + b.td(numeral(row.count / sumOfDesktop).format('0.0%'), 'right')
    buf = buf + b.td(numeral(row.count / sumOfAll).format('0.0%'), 'right')
    buf = buf + "</tr>"
    table.append(buf)
  })
  table.append(b.tr([b.td(), b.td(), b.td(b.b(b.st(sumOfDesktop)), 'right'), b.td(b.b(numeral(sumOfDesktop / sumOfAll).format('0.0%')), 'right'), b.td()]))

  var sumOfMobile = _.reduce(mobile, function (memo, row) { return memo + row.count }, 0)
  table = $("#overview-first-run-table-mobile tbody")
  table.empty()
  _.each(mobile, function (row) {
    var buf = '<tr>'
    buf = buf + b.td(`<img src="/local/img/platform-icons/${row.platform}.png" height="18">`)
    buf = buf + b.td(row.platform, 'left')
    buf = buf + b.td(st(row.count), 'right')
    buf = buf + b.td(numeral(row.count / sumOfDesktop).format('0.0%'), 'right')
    buf = buf + b.td(numeral(row.count / sumOfAll).format('0.0%'), 'right')
    buf = buf + "</tr>"
    table.append(buf)
  })
  table.append(b.tr([b.td(), b.td(), b.td(b.b(b.st(sumOfMobile)), 'right'), b.td(b.b(numeral(sumOfMobile / sumOfAll).format('0.0%')), 'right'), b.td()]))
  table.append(b.tr([b.td(), b.td(), b.td(b.b(b.st(sumOfAll)), 'right'), b.td(), b.td()]))
}


var ledger = function (btc, bat, b) {
  var overviewTable = $("#overview-ledger-table tbody")
  overviewTable.empty()

  overviewTable.append(tr([
    b.td(""),
    b.th('<img src="/local/img/token-icons/btc.png" height="18"> BTC', "right"),
    b.th('<img src="/local/img/token-icons/bat.svg" height="18"> BAT', "right"),
    b.td()
  ]))
  overviewTable.append(tr([
    b.td("Wallets"),
    b.td(b.st(btc.wallets), "right"),
    b.td(b.st(bat.wallets), "right"),
    b.td()
  ]))
  overviewTable.append(tr([
    b.td("Funded wallets"),
    b.td(b.st(btc.funded), "right"),
    b.td(b.st(bat.funded), "right"),
    b.td()
  ]))
  overviewTable.append(tr([
    b.td("Percentage of wallets funded"),
    b.td(numeral(btc.funded / btc.wallets).format('0.0%'), "right"),
    b.td(numeral(bat.funded / bat.wallets).format('0.0%'), "right"),
    b.td()
  ]))
  overviewTable.append(tr([
    b.td("USD / 1 Token"),
    b.td(b.st3(btc.btc_usd), "right"),
    b.td(b.st3(bat.bat_usd), "right"),
    b.td('$ USD')
  ]))
  overviewTable.append(tr([
    b.td("Total balance of funded wallets"),
    b.td(b.st3(btc.balance / 100000000), "right"),
    b.td(b.st3(bat.balance), "right"),
    b.td('tokens')
  ]))
  overviewTable.append(tr([
    b.td(),
    b.td(b.std(btc.balance / 100000000 * btc.btc_usd), "right"),
    b.td(b.std(bat.balance * bat.bat_usd), "right"),
    b.td('$ USD')
  ]))
  overviewTable.append(tr([
    b.td("Average balance of funded wallets"),
    b.td(b.round((btc.balance / btc.funded) / 100000000, 6), "right"),
    b.td(b.round((bat.balance / bat.funded), 6), "right"),
    b.td('tokens')
  ]))
  overviewTable.append(tr([
    b.td(),
    b.td(b.std((btc.balance / btc.funded) / 100000000 * btc.btc_usd), "right"),
    b.td(b.std((bat.balance / bat.funded) * bat.bat_usd), "right"),
    b.td('$ USD')
  ]))
}

var monthAveragesHandler = function (rows, b) {
  var tblHead = $("#monthly-averages-table thead")
  var tblBody = $("#monthly-averages-table tbody")

  var months = _.uniq(_.pluck(rows, 'ymd')).map(function (ymd) { return ymd.substring(0, 7) })
  var buf = "<tr><th></th>" + months.map(function (ymd) { return th(ymd, 'right') }).join('') + "</tr>"
  tblHead.html(buf)

  var platforms = _.uniq(_.pluck(rows, 'platform')).sort()
  var platformStats = _.groupBy(rows, function (row) { return row.platform } )
  var platformCrossTab = _.groupBy(rows, function (row) { return row.ymd.substring(0, 7) + '|' + row.platform })

  var formatPlatformMonth = function (platformMonth, last) {
    var b = ''
    var diffs

    var fdiff = function (diffs, k) {
      var cls
      if (diffs) {
        cls = 'ltz'
        if (diffs[k + '_per'] > 0) cls = 'gtz'
        return ' <span class="' + cls + '">' + stp(diffs[k + '_per']) + '</span>'
      } else {
        return ''
      }
    }

    if (last) {
      diffs = {
        mau_per: window.STATS.COMMON.safeDivide(platformMonth.mau - last.mau, platformMonth.mau),
        dau_per: window.STATS.COMMON.safeDivide(platformMonth.dau - last.dau, platformMonth.dau),
        first_time_per: window.STATS.COMMON.safeDivide(platformMonth.first_time - last.first_time, platformMonth.first_time)
      }
    }
    b = b + '<div>' + st(platformMonth.mau) + fdiff(diffs, 'mau') + '</div>'
    b = b + '<div>' + st(platformMonth.dau) + fdiff(diffs, 'dau') + '</div>'
    b = b + '<div>' + st(platformMonth.first_time) + fdiff(diffs, 'first_time') + '</div>'
    b = b + '<div>' + std(window.STATS.COMMON.safeDivide(platformMonth.dau, platformMonth.mau)) + '</div>'
    b = b + '<div>' + st1(window.STATS.COMMON.safeDivide(platformMonth.mau, platformMonth.first_time)) + '</div>'
    return b
  }

  var buf = ''
  platforms.forEach(function (platformName) {
    var platformData = platformStats[platformName]
    buf = buf + '<tr>'
    buf = buf + td(b.b(platformName))
    var last = null
    months.forEach(function (month) {
      var monthPlatformInfo = platformCrossTab[month + '|' + platformName]
      if (monthPlatformInfo) {
        monthPlatformInfo = monthPlatformInfo[0]
        buf = buf + td(formatPlatformMonth(monthPlatformInfo, last), 'right')
        last = monthPlatformInfo
      } else {
        buf = buf + td('')
      }
    })
    buf = buf + '</tr>'
  })
  tblBody.html(buf)
}

window.OVERVIEW = {
  ledger,
  firstRun,
  monthAveragesHandler
}
