// Platform meta data
var platforms = {
  osx: {
    id: 'osx',
    label: 'OSx',
    mobile: false
  },
  winx64: {
    id: 'winx64',
    label: 'Windows x64',
    mobile: false
  },
  winia32: {
    id: 'winia32',
    label: 'Windows ia32',
    mobile: false
  },
  linux: {
    id: 'linux',
    label: 'Linux',
    mobile: false
  },
  android: {
    id: 'android',
    label: 'Android',
    mobile: true
  },
  androidbrowser: {
    id: 'androidbrowser',
    label: 'Android Browser',
    mobile: true
  },
  ios: {
    id: 'ios',
    label: 'iOS',
    mobile: true
  }
}

// Channel meta data
var channels = {
  dev: {
    id: 'dev',
    label: 'Development'
  },
  beta: {
    id: 'beta',
    label: 'Beta'
  },
  stable: {
    id: 'stable',
    label: 'Stable'
  }
}

var platformKeys = _.keys(platforms)
var channelKeys = _.keys(channels)

var reversePlatforms = _.object(_.map(platforms, function(platform) { return [platform.label, platform] }))

var round = function (x, n) {
  n = n || 0
  return Math.round(x * Math.pow(10, n)) / Math.pow(10, n)
}

var td = function (contents, align, opts) {
  contents = contents || ''
  align = align || 'left'
  opts = opts || {}
  return '<td class="text-' + align + '">' + contents + '</td>'
}

var ptd = function (val, per, align, opts) {
  contents = contents || ''
  align = align || 'left'
  opts = opts || {}
  return '<td class="text-' + align + '">' + val + ' <span class="subvalue">' + per + '</span></td>'
}

var th = function (contents, align, opts) {
  contents = contents || ''
  align = align || 'left'
  opts = opts || {}
  return '<th class="text-' + align + '">' + contents + '</th>'
}

var tr = function (tds, opts) {
  tds = tds || []
  opts = opts || {}
  var buf = '<tr '
  if (opts.classes) {
    buf += ' class="' + opts.classes + '" '
  }
  buf += '>' + tds.join('') + '</tr>'
  return buf
}

// standard integer number format i.e. 123,456
var st = function (num) {
  return numeral(num).format('0,0')
}

// standard dollar number format i.e. 123,456.78
var std = function (num) {
  return numeral(num).format('0,0.00')
}

// standard number format i.e. 123,456.7
var st1 = function (num) {
  return numeral(num).format('0,0.0')
}

// standard percentage form i.e. 45.3%
var stp = function (num) {
  return numeral(num).format('0.0%')
}

var b = function(text) { return '<strong>' + text + "</strong>" }


var overviewMonthAveragesHandler = function (rows) {
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
    buf = buf + td(b(platformName))
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

var overviewHandler = function (rows, overview) {

  var overviewTable = $("#overview-ledger-table tbody")
  overviewTable.empty()

  overviewTable.append(tr([
    td("Wallets"),
    td(st(overview.wallets), "right"),
    td()
  ]))
  overviewTable.append(tr([
    td("Funded wallets"),
    td(st(overview.funded), "right"),
    td()
  ]))
  overviewTable.append(tr([
    td("Percentage of wallets funded"),
    td(numeral(overview.funded / overview.wallets).format('0.0%'), "right"),
    td()
  ]))
  overviewTable.append(tr([
    td("USD / 1 BTC"),
    td(std(overview.btc_usd), "right"),
    td('$ USD')
  ]))
  overviewTable.append(tr([
    td("Total balance of funded wallets"),
    td(round(overview.balance / 100000000, 3), "right"),
    td('<i class="fa fa-btc" aria-hidden="true"></i>')
  ]))
  overviewTable.append(tr([
    td(),
    td(std(overview.balance / 100000000 * overview.btc_usd), "right"),
    td('$ USD')
  ]))
  overviewTable.append(tr([
    td("Average balance of funded wallets"),
    td(round((overview.balance / overview.funded) / 100000000, 6), "right"),
    td('<i class="fa fa-btc" aria-hidden="true"></i>')
  ]))
  overviewTable.append(tr([
    td(),
    td(std((overview.balance / overview.funded) / 100000000 * overview.btc_usd), "right"),
    td('$ USD')
  ]))

  var groups = _.groupBy(rows, function (row) { return row.mobile })
  var desktop = groups[false].sort(function(a, b) { return b.count - a.count })
  var mobile = groups[true].sort(function(a, b) { return b.count - a.count })

  var sumOfAll = _.reduce(rows, function (memo, row) { return memo + row.count }, 0)
  var sumOfDesktop = _.reduce(desktop, function (memo, row) { return memo + row.count }, 0)
  var table = $("#overview-first-run-table-desktop tbody")
  table.empty()
  _.each(desktop, function (row) {
    var buf = '<tr>'
    buf = buf + td(row.platform, 'left')
    buf = buf + td(st(row.count), 'right')
    buf = buf + td(numeral(row.count / sumOfDesktop).format('0.0%'), 'right')
    buf = buf + td(numeral(row.count / sumOfAll).format('0.0%'), 'right')
    buf = buf + "</tr>"
    table.append(buf)
  })
  table.append(tr([td(), td(b(st(sumOfDesktop)), 'right'), td(b(numeral(sumOfDesktop / sumOfAll).format('0.0%')), 'right'), td()]))

  var sumOfMobile = _.reduce(mobile, function (memo, row) { return memo + row.count }, 0)
  table = $("#overview-first-run-table-mobile tbody")
  table.empty()
  _.each(mobile, function (row) {
    var buf = '<tr>'
    buf = buf + td(row.platform, 'left')
    buf = buf + td(st(row.count), 'right')
    buf = buf + td(numeral(row.count / sumOfDesktop).format('0.0%'), 'right')
    buf = buf + td(numeral(row.count / sumOfAll).format('0.0%'), 'right')
    buf = buf + "</tr>"
    table.append(buf)
  })
    table.append(tr([td(), td(b(st(sumOfMobile)), 'right'), td(b(numeral(sumOfMobile / sumOfAll).format('0.0%')), 'right'), td()]))
  table.append(tr([td(), td(b(st(sumOfAll)), 'right'), td(), td()]))
}

var crashVersionHandler = function(rows) {
  var s = $('#crash-ratio-versions')
  s.empty()
  s.append('<option value="">All</option>')
  _.each(rows, function (row) {
    var buf = '<option value="' + row.version + '" '
    if (pageState.version === row.version) {
      buf = buf + 'SELECTED'
    }
    buf = buf + '>' + row.version + '</option>'
    s.append(buf)
  })
}

var crashRatioHandler = function(rows) {
  $.ajax('/api/1/crash_versions?' + standardParams(), {
    success: crashVersionHandler
  })
  var table = $('#crash-ratio-table tbody')
  table.empty()
  rows.forEach(function (row) {
    var params = [row.platform, row.version, pageState.days].join('/')
    var buf = '<tr>'
    buf = buf + '<td class="text-right"><a href="#crash_ratio_list/' + params + '">' + round(row.crash_rate * 100, 1) + '</a></td>'
    buf = buf + '<td class="text-left">' + row.version + '</td>'
    buf = buf + '<td class="text-left">' + row.platform + '</td>'
    buf = buf + '<td class="text-right">' + row.crashes + '</td>'
    buf = buf + '<td class="text-right">' + row.total + '</td>'

    buf = buf + '</tr>'
    table.append(buf)
  })
}

var topCrashHandler = function(rows) {
  var table = $('#top-crash-table tbody')
  table.empty()
  var sum = _.reduce(rows, function (memo, row) { return memo + parseInt(row.total) }, 0)
  rows.forEach(function (row) {
    var params = [row.platform, row.version, pageState.days, encodeURIComponent(row.crash_reason), row.cpu, encodeURIComponent(row.signature)].join('/')
    var buf = '<tr>'
    var percentage = round(row.total / sum * 100, 1)
    buf = buf + '<td class="text-right"><a href="#crash_list/' + params + '">' + row.total + '</a><br/><span class="ago">' + percentage + '%</span></td>'
    buf = buf + '<td class="text-left">' + row.version + '</td>'
    buf = buf + '<td class="text-left">' + row.canonical_platform + '</td>'
    buf = buf + '<td class="text-left">' + row.platform + ' ' + row.cpu + '</td>'
    buf = buf + '<td class="text-left">' + row.crash_reason + '<br/>' + row.signature + '</td>'
    buf = buf + '</tr>'
    table.append(buf)
  })
}


var statsHandler = function(rows) {
  // Build the table
  var table = $('#statsDataTable tbody')
  table.empty()
  rows.forEach(function(row) {
    var buf = '<tr>'
    buf = buf + '<td nowrap>' + row.ymd + '</td>'
    buf = buf + '<td class="text-right">' + row.count + '</td>'
    buf = buf + '<td class="text-right">' + row.prev + '</td>'
    buf = buf + '<td class="text-right">' + row.delta + '</td>'
    buf = buf + '<td class="text-right">' + round(row.change * 100, 1) + '</td>'
    buf = buf + '<td class="text-right">' + row.first_count + '</td>'
    buf = buf + '<td class="text-right">' + round(row.retention, 1) + '</td>'
    buf = buf + '</tr>'
    table.append(buf)
  })

  // Build the graph
  rows = rows.reverse()

  // Build a list of unique labels (ymd)
  var labels = _.chain(rows)
      .map(function(row) { return row.ymd })
      .uniq()
      .sort()
      .value()

  var ys = ['change', 'retention']

  // Build the Chart.js data structure
  var datasets = []
  ys.forEach(function(y) {
    var dataset = []
    rows.forEach(function(row) {
      dataset.push(row[y])
    })
    datasets.push(dataset)
  })

  var data = {
    labels: labels,
    datasets: _.map(datasets, function(dataset, idx) {
      return _.extend({
        label: ys[idx],
        data: dataset
      })
    })
  }

  var container = $("#statsChartContainer")
  container.empty()
  container.append("<canvas id='statsChart' height='300' width='800'></canvas>")

  var statsChart = document.getElementById("statsChart")
  var ctx = statsChart.getContext("2d")
  var myChart = new Chart.Line(ctx, { data: data, options: window.STATS.COMMON.standardYAxisOptions })
}

var buildTelemetryChartBuilder = function (opts) {
  opts = opts || {}

  var grouperLabel = function (row) {
    return [row.platform, row.version, row.channel, row.machine, row.measure].join('-')
  }

  return function (rows) {
    // Build a list of unique labels (ymd)
    var ymds = _.chain(rows)
        .map(function(row) { return row.ymd })
        .uniq()
        .sort()
        .value()

    // Build a list of unique data sets (platform)
    var ys = _.chain(rows)
        .map(function(row) { return grouperLabel(row) })
        .uniq()
        .value()

    var groups = _.groupBy(rows, function (row) {
      return grouperLabel(row)
    })

    // Associate the data
    var product = _.object(_.map(ymds, function(ymd) {
      return [ymd, {}]
    }))
    rows.forEach(function(row) {
      if (!product[row.ymd][grouperLabel(row)]) product[row.ymd][grouperLabel(row)] = {}
      product[row.ymd][grouperLabel(row)].average = row.average
      product[row.ymd][grouperLabel(row)].minimum = row.minimum
      product[row.ymd][grouperLabel(row)].maximum = row.maximum
      product[row.ymd][grouperLabel(row)].quant25 = row.quant25
      product[row.ymd][grouperLabel(row)].quant75 = row.quant75
    })

    var opacityByIndex = function (idx) {
      return {
        0: 0.05,
        1: 0.2,
        2: 1,
        3: 0.2,
        4: 0.05
      }[idx]
    }

    var datasets = []
    var labels = []
    var measureCount = 0
    _.each(groups, function (groupedRows, k) {
      ['minimum', 'quant25', 'average', 'quant75', 'maximum'].map(function (fld, idx) {
        labels.push({
          label: k + '-' + fld,
          idx: measureCount,
          opacity: opacityByIndex(idx)
        })
        datasets.push(_.map(ymds, function (ymd, idx) {
          return product[ymd][k][fld]
        }))
      })
      measureCount += 1
    })

    var regressionData = _.map(datasets[0], function (v, idx) { return [idx, v] })
    console.log(ss.linearRegression(regressionData))

    var data = {
      labels: ymds,
      datasets: _.map(datasets, function(dataset, idx) {
        return {
          label: labels[idx].label,
          data: dataset,
          borderColor: window.STATS.COLOR.colorForIndex(labels[idx].idx, labels[idx].opacity),
          fill: false
        }
      })
    }

    var container = $("#telemetryChartContainer")
    container.empty()
    container.append("<canvas id='telemetryUsageChart' height='350' width='800'></canvas>")

    var chartOptions = _.extend(_.clone(window.STATS.COMMON.standardYAxisOptions), {
      onClick: function (evt, points) {
        if (points.length) {
          var ymd = points[0]._xScale.ticks[points[0]._index]
          $.ajax('/api/1/ci/telemetry/' + ymd + '?' + standardTelemetryParams(), {
            success: function (results) {
              // detailed telemetry items
              console.log(results)
            }
          })
        }
      }
    })

    var usageChart = document.getElementById("telemetryUsageChart")
    new Chart.Line(usageChart.getContext("2d"), { data: data, options: chartOptions })
  }
}

// Build a handler for a successful API request
var buildSuccessHandler = function (x, y, x_label, y_label, opts) {
  opts = opts || {}

  var value_func = function(row, value) {
    var formatter = st
    if (opts.percentage) {
      formatter = stp
    } else if (opts.currency) {
      formatter = std
    }
    return formatter(value)
  }

  return function (rows) {
    var table = $('#usageDataTable tbody')
    table.empty()
    var ctrl = rows[x]
    var ctrlClass = ''
    var grandTotalAccumulator = 0
    var previousValue, difference, differenceRate, i
    rows.forEach(function(row) {
      if (!previousValue) previousValue = row.count
      if (row[x] !== ctrl) {
        // The ctrl has broken, we need to change grouping
        if (ctrlClass === 'active') {
          ctrlClass = ''
        } else {
          ctrlClass = 'active'
        }
        ctrl = row[x]
      }
      var buf = '<tr class="' + ctrlClass + '">'
      buf = buf + '<td>' + row[x] + '</td>'
      buf = buf + '<td>' + (row[y] || 'All') + '</td>'
      buf = buf + '<td class="text-right">' + value_func(row, row.count) + '</td>'
      if (row.daily_percentage !== undefined) {
        buf = buf + '<td class="text-right">' + stp(row.daily_percentage / 100) + '</td>'
      }
      if (opts.growth_rate) {
        difference = row.count - previousValue
        differenceRate = (difference / parseFloat(previousValue) * 100).toFixed(1)
        buf = buf + '<td class="text-right">' + value_func(row, difference) + '<span class="subvalue"> ' + differenceRate + '%</span>' + '</td>'
      }
      buf = buf + '</tr>'
      table.append(buf)
      previousValue = row.count
      grandTotalAccumulator += row.count
    })

    if (opts.growth_rate) {
      averageGrowthRate = Math.pow(rows[rows.length - 1].count / rows[0].count, 1 / rows.length) - 1
      averageGrowthRateDesc = "Math.pow(" + rows[rows.length - 1].count + "/" + rows[0].count + ", 1 / " + rows.length + ") - 1"
      console.log(averageGrowthRate)
      table.append(tr([
        td(),
        td(),
        td(),
        td("Average monthly growth rate " + (averageGrowthRate * 100).toFixed(1) + '%<br><span class="subvalue">' + averageGrowthRateDesc + '</span>', 'right')
      ]))

      table.append(tr([
        td("Forward projections based on " + (averageGrowthRate * 100).toFixed(1) + "% monthly growth rate"),
        td(st(rows[rows.length - 1].count))
      ]))

      for (i = 1; i < 13; i++) {
        console.log(i, moment(rows[rows.length - 1].x), rows[rows.length - 1])
        table.append(tr([
          td(moment(rows[rows.length - 1].ymd).add(i, 'months').format('MMMM YYYY')),
          td(st(rows[rows.length - 1].count * Math.pow(1 + averageGrowthRate, i)))
        ]))
      }
    }

    // Show grand total line if option present
    if (opts.showGrandTotal) {
      table.append(tr([
        td(),
        td(),
        td(grandTotalAccumulator, 'right')
      ], { classes: "info" }))
    }

    // Build a list of unique labels (ymd)
    var labels = _.chain(rows)
        .map(function(row) { return row[x] })
        .uniq()
        .sort()
        .value()

    // Build a list of unique data sets (platform)
    var ys = _.chain(rows)
        .map(function(row) { return row[y] })
        .uniq()
        .value()

    // Associate the data
    var product = _.object(_.map(labels, function(label) {
      return [label, {}]
    }))
    rows.forEach(function(row) {
      product[row[x]][row[y]] = row.count
    })

    // Build the Chart.js data structure
    var datasets = []
    ys.forEach(function(platform) {
      var dataset = []
      labels.forEach(function(label) {
        dataset.push(product[label][platform] || 0)
      })
      datasets.push(dataset)
    })

    // Determine the color of the line by label or index
    var colourer = function (idx, opacity) { return window.STATS.COLOR.colorForLabel(ys[idx], opacity) }
    if (opts.colourBy === 'index') {
      colourer = function (idx, opacity) { return window.STATS.COLOR.colorForIndex(idx, opacity) }
    }

    var data = {
      labels: labels,
      datasets: _.map(datasets, function(dataset, idx) {
        return {
          label: ys[idx] || 'All',
          data: dataset,
          borderColor: colourer(idx, 1),
          pointColor: colourer(idx, 0.5),
          backgroundColor: colourer(idx, 0.05)
        }
      })
    }

    var container = $("#usageChartContainer")
    container.empty()
    container.append("<canvas id='usageChart' height='350' width='800'></canvas>")

    var usageChart = document.getElementById("usageChart")
    new Chart.Line(usageChart.getContext("2d"), { data: data, options: window.STATS.COMMON.standardYAxisOptions })
  }
}

// Data type success handlers
var usagePlatformHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { colourBy: 'label' })

var aggMAUHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { colourBy: 'label', growth_rate: true })

var usageVersionHandler = buildSuccessHandler('ymd', 'version', 'Date', 'Version', { colourBy: 'index' })

var usageCrashesHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { colourBy: 'label' })

var telemetryHandler = buildTelemetryChartBuilder('ymd')

var walletsTotalHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { showGrandTotal: true })

var walletsCurrencyHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { showGrandTotal: true, currency: true })

var walletsHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { showGrandTotal: false, percentage: true })

var walletsBalanceAverageHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', { showGrandTotal: false, currency: true })

// Array of content panels
var contents = [
  "usageContent",
  "publisherContent",
  "usageTelemetry",
  "crashesContent",
  "overviewContent",
  "statsContent",
  "topCrashContent",
  "recentCrashContent",
  "developmentCrashContent",
  "crashRatioContent",
  "searchContent"
]

var serializePlatformParams = function () {
  var filterPlatforms = _.filter(platformKeys, function(id) {
    return pageState.platformFilter[id]
  })
  return filterPlatforms.join(',')
}

var serializeChannelParams = function () {
  var filterChannels = _.filter(channelKeys, function(id) {
    return pageState.channelFilter[id]
  })
  return filterChannels.join(',')
}

var standardParams = function() {
  return $.param({
    days: pageState.days,
    platformFilter: serializePlatformParams(),
    channelFilter: serializeChannelParams(),
    showToday: pageState.showToday,
    version: pageState.version
  })
}

var standardTelemetryParams = function() {
  return $.param({
    days: pageState.days,
    platformFilter: serializePlatformParams(),
    channelFilter: serializeChannelParams(),
    showToday: pageState.showToday,
    version: pageState.version,
    measure: pageState.measure,
    machine: pageState.machine
  })
}

var versionsRetriever = function() {
  $.ajax('/api/1/versions?' + standardParams(), {
    success: usageVersionHandler
  })
}

var DAUPlatformRetriever = function() {
  $.ajax('/api/1/dau_platform?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var DAUReturningPlatformRetriever = function() {
  $.ajax('/api/1/dau_platform_minus_first?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var MAUPlatformRetriever = function() {
  $.ajax('/api/1/mau_platform?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var MAUAggPlatformRetriever = function() {
  $.ajax('/api/1/mau?' + standardParams(), {
    success: aggMAUHandler
  })
}

var MAUAverageAggPlatformRetriever = function() {
  $.ajax('/api/1/dau_monthly_average?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var MAUAveragePlatformRetriever = function() {
  $.ajax('/api/1/dau_monthly_average_platform?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var MAUAverageNewAggPlatformRetriever = function() {
  $.ajax('/api/1/dau_first_monthly_average?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var MAUAverageNewPlatformRetriever = function() {
  $.ajax('/api/1/dau_first_monthly_average_platform?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var DNUPlatformRetriever = function() {
  $.ajax('/api/1/dau_platform_first?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var DAURetriever = function() {
  $.ajax('/api/1/dau?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var DUSRetriever = function() {
  $.ajax('/api/1/dus?' + standardParams(), {
    success: statsHandler
  })
}

var topCrashesRetriever = function() {
  $.ajax('/api/1/crash_reports?' + standardParams(), {
    success: topCrashHandler
  })
}

var crashRatioRetriever = function() {
  $.ajax('/api/1/crash_ratios?' + standardParams(), {
    success: crashRatioHandler
  })
}

var recentCrashesRetriever = function() {
  $.ajax('/api/1/recent_crash_report_details?' + standardParams(), {
    success: function(crashes) {
      $("#contentTitle").html("Recent Crash Reports")
      var table = $('#recent-crash-list-table tbody')
      table.empty()
      _.each(crashes, function(crash) {
        var rowClass = ""
        if (crash.node_env == 'development') {
          rowClass = 'warning'
        }
        var buf = '<tr class="' + rowClass + '">'
        buf = buf + '<td><a href="#crash/' + crash.id + '">' + crash.id + '</a></td>'
        buf = buf + '<td nowrap>' + crash.ymd + '<br/><span class="ago">' + crash.ago + '</span></td>'
        buf = buf + '<td>' + crash.version + '<br/><span class="ago">' + crash.electron_version + '</span></td>'
        buf = buf + '<td>' + crash.canonical_platform + '</td>'
        buf = buf + '<td>' + crash.platform + ' ' + crash.cpu + '<br/><span class="ago">' + crash.operating_system_name + '</span></td>'
        buf = buf + '<td>' + crash.crash_reason + '<br/>' + crash.signature + '</td>'
        buf = buf + '</tr>'
        table.append(buf)
      })
    }
  })
}

var developmentCrashesRetriever = function() {
  $.ajax('/api/1/development_crash_report_details?' + standardParams(), {
    success: function(crashes) {
      $("#contentTitle").html("Development Crash Reports")
      var table = $('#development-crash-list-table tbody')
      table.empty()
      _.each(crashes, function(crash) {
        var rowClass = ""
        var buf = '<tr class="' + rowClass + '">'
        buf = buf + '<td><a href="#crash/' + crash.id + '">' + crash.id + '</a></td>'
        buf = buf + '<td nowrap>' + crash.ymd + '<br/><span class="ago">' + crash.ago + '</span></td>'
        buf = buf + '<td>' + crash.version + '<br/><span class="ago">' + crash.electron_version + '</span></td>'
        buf = buf + '<td>' + crash.canonical_platform + '</td>'
        buf = buf + '<td>' + crash.platform + ' ' + crash.cpu + '<br/><span class="ago">' + crash.operating_system_name + '</span></td>'
        buf = buf + '<td>' + crash.crash_reason + '<br/>' + crash.signature + '</td>'
        buf = buf + '</tr>'
        table.append(buf)
      })
    }
  })
}

var crashesRetriever = function() {
  $.ajax('/api/1/dc_platform?' + standardParams(), {
    success: usageCrashesHandler
  })
}

var crashesDetailRetriever = function() {
  $.ajax('/api/1/dc_platform?' + standardParams(), {
    success: usageCrashesHandler
  })
}

var crashesVersionRetriever = function() {
  $.ajax('/api/1/dc_platform_version?' + standardParams(), {
    success: usagePlatformHandler
  })
}

var overviewRetriever = function () {
  $.ajax('/api/1/monthly_average_stats_platform', {
    success: overviewMonthAveragesHandler
  })

  $.ajax('/api/1/publishers/overview', {
    success: function (overview) {
      $.ajax('/api/1/publishers/overview/bucketed', {
        success: function (buckets) {
          window.STATS.PUB.overviewPublisherHandler(overview, buckets)
        }
      })
    }
  })

  $.ajax('/api/1/dau_platform_first_summary', {
    success: function(rows) {
      $.ajax('/api/1/ledger_overview', {
        success: function(overview) {
          overviewHandler(rows, overview)
        }
      })
    }
  })
}

var eyeshadeRetriever = function() {
  $.ajax('/api/1/eyeshade_wallets?' + standardParams(), {
    success: walletsTotalHandler
  })
}

var eyeshadeFundedRetriever = function() {
  $.ajax('/api/1/eyeshade_funded_wallets?' + standardParams(), {
    success: walletsTotalHandler
  })
}

var eyeshadeFundedPercentageRetriever = function() {
  $.ajax('/api/1/eyeshade_funded_percentage_wallets?' + standardParams(), {
    success: walletsHandler
  })
}

var eyeshadeFundedBalanceRetriever = function() {
  $.ajax('/api/1/eyeshade_funded_balance_wallets?' + standardParams(), {
    success: walletsCurrencyHandler
  })
}

var eyeshadeFundedBalanceAverageRetriever = function() {
  $.ajax('/api/1/eyeshade_funded_balance_average_wallets?' + standardParams(), {
    success: walletsBalanceAverageHandler
  })
}

var eyeshadeFundedBalanceAverageRetriever = function() {
  $.ajax('/api/1/eyeshade_funded_balance_average_wallets?' + standardParams(), {
    success: walletsBalanceAverageHandler
  })
}

var telemetryRetriever = function () {
  $.ajax('/api/1/ci/telemetry?' + standardTelemetryParams(), {
    success: telemetryHandler
  })
}

var fillOptionsIfNotEmpty = function (url, id) {
  var select = $("#" + id)
  if (select.children().length <= 1) {
    $.ajax(url, {
      success: function(results) {
        results.forEach(function (item) {
          select.append("<option value='" + item + "'>" + item + "</option>")
        })
      }
    })
  }
}

var telemetryStandardRetriever = function() {
  fillOptionsIfNotEmpty('/api/1/ci/measures', 'measures')
  fillOptionsIfNotEmpty('/api/1/ci/machines', 'machines')
  fillOptionsIfNotEmpty('/api/1/ci/versions', 'telemetryVersions')
  telemetryRetriever()
}

// Object of menu item meta data
var menuItems = {
  "mnSearch": {
    show: "searchContent",
    title: "Search",
    retriever: function() {} // TODO
  },
  "mnOverview": {
    show: "overviewContent",
    title: "Overview",
    retriever: overviewRetriever
  },
  "mnUsage": {
    show: "usageContent",
    title: "Daily Active Users by Platform (DAU)",
    retriever: DAUPlatformRetriever
  },
  "mnUsageReturning": {
    show: "usageContent",
    title: "Daily Returning Active Users by Platform (DAU)",
    retriever: DAUReturningPlatformRetriever
  },
  "mnDailyUsageStats": {
    show: "statsContent",
    title: "Daily Usage Stats",
    retriever: DUSRetriever
  },
  "mnUsageMonth": {
    show: "usageContent",
    title: "Monthly Active Users by Platform (MAU)",
    retriever: MAUPlatformRetriever
  },
  "mnUsageMonthAgg": {
    show: "usageContent",
    title: "Monthly Active Users (MAU)",
    retriever: MAUAggPlatformRetriever
  },
  "mnUsageMonthAverageAgg": {
    show: "usageContent",
    title: "Monthly Average Daily Active Users (MAU/DAU)",
    retriever: MAUAverageAggPlatformRetriever
  },
  "mnUsageMonthAverage": {
    show: "usageContent",
    title: "Monthly Average Daily Active Users by Platform (MAU/DAU)",
    retriever: MAUAveragePlatformRetriever
  },
  "mnUsageMonthAverageNewAgg": {
    show: "usageContent",
    title: "Monthly Average Daily New Users (MAU/DNU)",
    retriever: MAUAverageNewAggPlatformRetriever
  },
  "mnUsageMonthAverageNew": {
    show: "usageContent",
    title: "Monthly Average Daily New Users by Platform (MAU/DNU)",
    retriever: MAUAverageNewPlatformRetriever
  },
  "mnDailyNew": {
    show: "usageContent",
    title: "Daily New Users by Platform (DNU)",
    retriever: DNUPlatformRetriever
  },
  "mnUsageAgg": {
    title: "Daily Active Users (DAU)",
    show: "usageContent",
    retriever: DAURetriever
  },
  "mnVersions": {
    title: "Daily Active Users by Version (DAU)",
    show: "usageContent",
    retriever: versionsRetriever
  },
  "mnTopCrashes": {
    title: "Top Crashes By Platform and Version",
    show: "topCrashContent",
    retriever: topCrashesRetriever
  },
  "mnCrashRatio": {
    title: "Crash Ratio By Platform and Version",
    show: "crashRatioContent",
    retriever: crashRatioRetriever
  },
  "mnRecentCrashes": {
    title: "Recent Crashes",
    show: "recentCrashContent",
    retriever: recentCrashesRetriever
  },
  "mnDevelopmentCrashes": {
    title: "Development Crashes",
    show: "developmentCrashContent",
    subtitle: "Most recent development crashes",
    retriever: developmentCrashesRetriever
  },
  "mnCrashes": {
    title: "Daily Crashes by Platform",
    show: "usageContent",
    retriever: crashesRetriever
  },
  "mnCrashesVersion": {
    title: "Daily Crashes by Version",
    show: "usageContent",
    retriever: crashesVersionRetriever
  },
  "mnCrashesDetail": {
    title: "Crash Details",
    show: "usageContent",
    retriever: crashesDetailRetriever
  },
  "mnEyeshade": {
    show: "usageContent",
    title: "Daily Ledger Wallets",
    subtitle: "Number of ledger wallets created per day",
    retriever: eyeshadeRetriever
  },
  "mnFundedEyeshade": {
    show: "usageContent",
    title: "Daily Ledger Funded Wallets",
    subtitle: "Number of funded ledger wallets created per day",
    retriever: eyeshadeFundedRetriever
  },
  "mnFundedPercentageEyeshade": {
    show: "usageContent",
    title: "Daily Ledger Funded Wallets Percentage",
    subtitle: "Percentage of wallets created that are funded per day",
    retriever: eyeshadeFundedPercentageRetriever
  },
  "mnFundedBalanceEyeshade": {
    show: "usageContent",
    title: "Daily Ledger Funded Wallets Balance",
    subtitle: "Total balance of funded wallets per day in USD ($)",
    retriever: eyeshadeFundedBalanceRetriever
  },
  "mnFundedBalanceAverageEyeshade": {
    show: "usageContent",
    title: "Daily Ledger Funded Wallets Average Balance",
    subtitle: "Average balance of funded wallets per day in USD ($)",
    retriever: eyeshadeFundedBalanceAverageRetriever
  },
  "mnTelemetryStandard": {
    show: "usageTelemetry",
    title: "Telemetry Navigator",
    subtitle: "Browser telemetry by measure, machine and version",
    retriever: telemetryStandardRetriever
  },
  "mnDailyPublishers": {
    show: "publisherContent",
    title: "Daily Publisher Status",
    subtitle: "Publisher activations by day",
    retriever: window.STATS.PUB.publisherDailyRetriever
  },
}

// Mutable page state
var pageState = {
  currentlySelected: null,
  days: 14,
  version: null,
  platformFilter: {
    osx: true,
    winx64: true,
    winia32: true,
    linux: true,
    ios: true,
    android: false,
    androidbrowser: true
  },
  channelFilter: {
    dev: true,
    beta: false,
    stable: true
  },
  showToday: false
}

var viewState = {
  showControls: true,
  platformEnabled: {
    osx: true,
    winx64: true,
    winia32: true,
    linux: true,
    ios: true,
    android: true,
    androidbrowser: true
  }
}

var enableAllPlatforms = function () {
  viewState.platformEnabled = {
    osx: true,
    winx64: true,
    winia32: true,
    linux: true,
    ios: true,
    android: true,
    androidbrowser: true
  }
}

var disableAllPlatforms = function () {
  viewState.platformEnabled = {
    osx: false,
    winx64: false,
    winia32: false,
    linux: false,
    ios: false,
    android: false,
    androidbrowser: false
  }
}

var enableDesktopPlatforms = function () {
  viewState.platformEnabled.osx = true
  viewState.platformEnabled.winia32 = true
  viewState.platformEnabled.winx64 = true
  viewState.platformEnabled.linux = true
}

var disableDesktopPlatforms = function () {
  viewState.platformEnabled.osx = true
  viewState.platformEnabled.winia32 = true
  viewState.platformEnabled.winx64 = true
}

var enableMobilePlatforms = function () {
  viewState.platformEnabled.ios = true
  viewState.platformEnabled.android = true
  viewState.platformEnabled.androidbrowser = true
}

var disableMobilePlatforms = function () {
  viewState.platformEnabled.ios = false
  viewState.platformEnabled.android = false
  viewState.platformEnabled.androidbrowser = false
}

$("#daysSelector").on('change', function (evt, value) {
  pageState.days = parseInt(this.value, 10)
  refreshData()
})

$("#machines").on('change', function (evt, value) {
  pageState.machine = this.value
  refreshData()
})

$("#measures").on('change', function (evt, value) {
  pageState.measure = this.value
  refreshData()
})

$("#telemetryVersions").on('change', function (evt, value) {
  pageState.version = this.value
  refreshData()
})

$("#crash-ratio-versions").on('change', function (evt, value) {
  pageState.version = this.value
  refreshData()
})

// Update page based on current state
var updatePageUIState = function() {
  $("#controls").show()
  _.keys(menuItems).forEach(function(id) {
    if (id !== pageState.currentlySelected) {
      $("#" + id).parent().removeClass("active")
    } else {
      $("#" + id).parent().addClass("active")
      $("#contentTitle").text(menuItems[id].title)
      $("#contentSubtitle").text(menuItems[id].subtitle || '')
    }
  })

  contents.forEach(function(content) {
    if (menuItems[pageState.currentlySelected].show === content) {
      $("#" + menuItems[pageState.currentlySelected].show).show()
    } else {
      $("#" + content).hide()
    }
  })

  if (viewState.showControls) {
    $('#controls').show()
  } else {
    $('#controls').hide()
  }
}

// Load data for the selected item
var refreshData = function() {
  if (menuItems[pageState.currentlySelected]) {
    menuItems[pageState.currentlySelected].retriever()
  }
}

// Setup menu handler routes
var router = new Grapnel()

router.get('search', function(req) {
  pageState.currentlySelected = 'mnSearch'
  viewState.showControls = false
  updatePageUIState()
  refreshData()
})

router.get('overview', function(req) {
  pageState.currentlySelected = 'mnOverview'
  viewState.showControls = false
  updatePageUIState()
  refreshData()
})

router.get('versions', function(req) {
  pageState.currentlySelected = 'mnVersions'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage', function(req) {
  pageState.currentlySelected = 'mnUsage'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_returning', function(req) {
  pageState.currentlySelected = 'mnUsageReturning'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month', function(req) {
  pageState.currentlySelected = 'mnUsageMonth'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month_agg', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAgg'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month_average_agg', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAverageAgg'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month_average', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAverage'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month_average_new_agg', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAverageNewAgg'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_month_average_new', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAverageNew'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('daily_new', function(req) {
  pageState.currentlySelected = 'mnDailyNew'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('daily_usage_stats', function(req) {
  pageState.currentlySelected = 'mnDailyUsageStats'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('usage_agg', function(req) {
  pageState.currentlySelected = 'mnUsageAgg'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('top_crashes', function(req) {
  pageState.currentlySelected = 'mnTopCrashes'
  viewState.showControls = true
  updatePageUIState()
  refreshData()

  // Show and hide sub-sections
  $('#top-crash-table').show()
  $('#crash-detail').hide()
  $('#crash-list-table').hide()
})

router.get('crash_ratio', function (req) {
  pageState.currentlySelected = 'mnCrashRatio'
  viewState.showControls = true
  updatePageUIState()
  refreshData()

  $('#crash-ratio-table').show()
  $('#crash-ratio-detail-table').hide()
})

router.get('development_crashes', function(req) {
  pageState.currentlySelected = 'mnDevelopmentCrashes'
  updatePageUIState()
  refreshData()
})

router.get('recent_crashes', function(req) {
  pageState.currentlySelected = 'mnRecentCrashes'
  updatePageUIState()
  refreshData()
})

router.get('crashes_platform_detail/:ymd/:platform', function(req) {
  pageState.currentlySelected = 'mnCrashesDetails'
  viewState.showControls = true
  updatePageUIState()
  //refreshData()
})

router.get('crashes_platform_version', function(req) {
  pageState.currentlySelected = 'mnCrashesVersion'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('crashes_platform', function(req) {
  pageState.currentlySelected = 'mnCrashes'
  updatePageUIState()
  refreshData()
})

router.get('eyeshade', function(req) {
  pageState.currentlySelected = 'mnEyeshade'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('eyeshade_funded', function(req) {
  pageState.currentlySelected = 'mnFundedEyeshade'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('eyeshade_funded_percentage', function(req) {
  pageState.currentlySelected = 'mnFundedPercentageEyeshade'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('eyeshade_funded_balance', function(req) {
  pageState.currentlySelected = 'mnFundedBalanceEyeshade'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('eyeshade_funded_balance_average', function(req) {
  pageState.currentlySelected = 'mnFundedBalanceAverageEyeshade'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('telemetry_standard', function(req) {
  pageState.currentlySelected = 'mnTelemetryStandard'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

router.get('daily_publishers', function(req) {
  pageState.currentlySelected = 'mnDailyPublishers'
  viewState.showControls = true
  updatePageUIState()
  refreshData()
})

// Display a single crash report
router.get('crash/:id', function(req) {
  pageState.currentlySelected = 'mnTopCrashes'
  viewState.showControls = false
  updatePageUIState()
  // Show and hide sub-sections
  $('#top-crash-table').hide()
  $('#crash-detail').show()
  $('#crash-list-table').hide()
  pageState.currentlySelected = null

  var table = $('#crash-detail-table tbody')
  $("#contentTitle").html('Loading...')
  table.empty()
  $('#crash-download-container').empty()
  $('#crash-detail-stack').empty()

  var loadAvailableCrashTags = function (id) {

    $.ajax('/api/1/available_crash_tags', {
      success: function (rows) {
        var ul = $("#availableCrashTags")
        ul.empty()
        _.each(rows, function (row) {
          ul.append('<li><a href="#" data-tag="' + row.tag + '">' + row.tag + '</a></li>')
        })
        $("#availableCrashTags a").on('click', function (e) {
          var tag = $(e.target).attr('data-tag')
          $.ajax({
            method: "POST",
            url: "/api/1/crashes/" + req.params.id + '/tags/' + tag,
            success: function (results) {
              loadCrashTags(id)
            }
          })
        })
      }
    })
  }

  var loadCrashTags = function (id) {
    $.ajax('/api/1/crashes/' + id + '/tags', {
      success: function (rows) {
        var buf = ''
        _.each(rows, function (row) {
            buf = buf + '<span class="label label-info tag">' + row.tag + ' <i class="fa fa-trash pointer" data-tag="' + row.tag + '"></i></span> '
        })
        $("#crash-tags").html(buf)
        $("#crash-tags i").on("click", function (e) {
          var i = $(this)
          $.ajax({
            method: 'DELETE',
            url: '/api/1/crashes/' + id + '/tags/' + i.attr('data-tag'),
            success: function (results) {
              i.parent().remove()
            }
          })
        })
      }
    })
  }

  $.ajax('/api/1/crash_report?id=' + req.params.id, {
    success: function(crash) {
      $("#controls").hide()
      $("#contentTitle").html("Crash Report " + req.params.id)
      console.log(crash)
      table.empty()
      loadAvailableCrashTags(req.params.id)
      loadCrashTags(req.params.id)
      var info = _.extend(_.clone(crash.crash.contents), crash.crash.contents.metadata || {})
      _.each(_.keys(info).sort(), function (k) {
        if (!_.isObject(info[k])) {
          table.append('<tr><td>' + k + '</td><td>' + info[k] + '</td></tr>')
        }
      })
      $('#crash-detail-stack').html(crash.crash_report)
      $('#crash-download-container').html("<a class='btn btn-primary' href='/download/crash_report/" + req.params.id + "'>Download Binary Dump</a>")
    }
  })
})

// Display a list of crash reports
router.get('crash_list/:platform/:version/:days/:crash_reason/:cpu/:signature', function(req) {
  pageState.currentlySelected = 'mnTopCrashes'
  // Show and hide sub-sections
  $('#top-crash-table').hide()
  $('#crash-detail').hide()
  $('#crash-list-table').show()

  var params = $.param({
    platform: req.params.platform,
    version: req.params.version,
    days: req.params.days,
    crash_reason: req.params.crash_reason,
    cpu: req.params.cpu,
    signature: req.params.signature
  })

  $.ajax('/api/1/crash_report_details?' + params, {
    success: function(crashes) {
      $("#contentTitle").html("Crash Reports")
      var table = $('#crash-list-table tbody')
      table.empty()
      _.each(crashes, function(crash) {
        var buf = '<tr>'
        buf = buf + '<td><a href="#crash/' + crash.id + '">' + crash.id + '</a></td>'
        buf = buf + '<td nowrap>' + crash.ymd + '<br/><span class="ago">' + crash.ago + '</span></td>'
        buf = buf + '<td>' + crash.version + '<br/><span class="ago">' + crash.electron_version + '</span></td>'
        buf = buf + '<td>' + crash.platform + '<br/><span class="ago">' + crash.operating_system_name + '</span></td>'
        buf = buf + '<td>' + crash.cpu + '</td>'
        buf = buf + '<td>' + crash.crash_reason + '<br/>' + crash.signature + '</td>'
        buf = buf + '</tr>'
        table.append(buf)
      })
    }
  })
})

// build platform button handlers
_.forEach(platformKeys, function(id) {
  $("#btn-filter-" + id).on('change', function() {
    pageState.platformFilter[id] = this.checked
    refreshData()
  })
})

// build channel button handlers
_.forEach(channelKeys, function(id) {
  $("#btn-channel-" + id).on('change', function() {
    pageState.channelFilter[id] = this.checked
    refreshData()
  })
})

$("#btn-show-today").on('change', function() {
  pageState.showToday = this.checked
  refreshData()
})

var linksSearchInputHandler = function (e) {
  filterLinksOn(this.value)
}

var filterLinksOn = function (text) {
  text = (text || '').toLowerCase()
  if (text) {
    $(".sidebar li a").each(function (idx, elem) {
      if (elem.text.toLowerCase().match(new RegExp(text))) {
        $(elem).closest('li').show('fast')
      } else {
        $(elem).closest('li').hide('fast')
      }
    })
  } else {
    $(".sidebar li a").each(function (idx, elem) {
      $(elem).closest('li').show('fast')
    })
  }
}

$("#filterMAU").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('MAU')
  filterLinksOn('MAU')
})

$("#filterDAU").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('DAU')
  filterLinksOn('DAU')
})

$("#filterLedger").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('Ledger')
  filterLinksOn('Ledger')
})

$("#filterCrashes").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('Crash')
  filterLinksOn('Crash')
})

$("#filterPublisher").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('Publisher')
  filterLinksOn('Publisher')
})

$("#filterTelemetry").on('click', function (evt) {
  evt.preventDefault()
  $("#searchLinks").val('Telemetry')
  filterLinksOn('Telemetry')
})

var searchInputHandler = function (e) {
  var q = this.value
  var table = $("#search-results-table tbody")
  if (!q) {
    $("#searchComments").hide()
    table.empty()
    return
  }
  $("#searchComments").html("Loading...")
  $.ajax('/api/1/search?query=' + encodeURIComponent(q), {
    success: function (results) {
      table.empty()
      if (results.rowCount === 0) {
        $("#searchComments").hide()
      } else {
        $("#searchComments").show()
      }
      if (results.rowCount > results.limit) {
        $("#searchComments").html("Showing " + results.limit + ' of ' + results.rowCount + ' crashes')
      } else {
        $("#searchComments").html("Showing " + results.rowCount + ' crashes')
      }
      var crashes = results.crashes
      _.each(crashes, function (crash, idx) {
        var rowClass = ""
        if (crash.contents.node_env == 'development') {
          rowClass = 'warning'
        }
        table.append(tr([
          td(idx + 1),
          td('<a href="#crash/' + crash.id + '">' + crash.id + '</a>'),
          td(crash.contents.ver),
          td(crash.contents._version),
          td(crash.contents.year_month_day),
          td(crash.contents.platform + ' ' + crash.contents.metadata.cpu),
          td(crash.contents.metadata.operating_system_name),
          td(_.map(crash.tags, function (tag) { return '<span class="label label-info">' + tag + '</span>'}).join(' '))
        ], { "classes": rowClass }
        ))
        table.append(tr([td(), '<td colspan="7">' + crash.contents.metadata.signature + '</td>'], { "classes": rowClass }))
      })
    }
  })
}

$("#searchText").on('input', _.debounce(searchInputHandler, 500))

$("#searchLinks").on('input', _.debounce(linksSearchInputHandler, 250))

$("#clearSearchLinks").on('click', function () {
  $("#searchLinks").val('')
  filterLinksOn(null)
  $("#searchLinks").focus()
})

$("#searchComments").hide()
$("#searchLinks").focus()

$("#monthly-averages-whats-this").on('click', function (e) {
  e.preventDefault()
  $("#monthly-averages-instructions").show("slow")
})
