// High contrast color palette (https://github.com/mbostock/d3/wiki/Ordinal-Scales#categorical-colors)
var colors = [
  [31, 119, 180],  // 1f77b4
  [255, 127, 14],  // ff7f0e
  [44, 160, 44],   // 2ca02c
  [214, 39, 40],   // d62728
  [148, 103, 189], // 9467bd
  [140, 86, 75],   // 8c564b
  [227, 119, 194], // e377c2
  [127, 127, 127], // 7f7f7f
  [188, 189, 34],  // bcbd22
  [23, 190, 207]   // 17becf
]

// Build graph styles
var styles = _.map(colors, function(color) {
  return {
    fillColor: "rgba(" + color.join(', ') + ", 0.1)",
    strokeColor: "rgba(" + color.join(', ') + ", 0.4)",
    pointColor: "rgba(" + color.join(', ') + ", 0.4)",
    pointStrokeColor: "#fff",
    pointHighlightFill: "#fff",
    pointHighlightStroke: "rgba(" + color.join(', ') + ", 0.4)"
  }
})

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
  android: {
    id: 'android',
    label: 'Android',
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

var tr = function (tds, opts) {
  tds = tds || []
  opts = opts || {}
  var buf = '<tr>' + tds.join('') + '</tr>'
  return buf
}

// standard integer number format i.e. 123,456
var st = function (num) {
  return numeral(num).format('0,0')
}

var b = function(text) { return '<strong>' + text + "</strong>" }

var overviewHandler = function (rows) {
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
  table.append(tr([td(), td(b(st(sumOfDesktop)), 'right'), td(numeral(sumOfDesktop / sumOfAll).format('0.0%'), 'right'), td()]))

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
  table.append(tr([td(), td(b(st(sumOfMobile)), 'right'), td(numeral(sumOfMobile / sumOfAll).format('0.0%'), 'right'), td()]))
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
      }, styles[idx])
    })
  }

  var container = $("#statsChartContainer")
  container.empty()
  container.append("<canvas id='statsChart' height='300' width='800'></canvas>")

  var statsChart = document.getElementById("statsChart")
  var ctx = statsChart.getContext("2d")
  var myChart = new Chart(ctx).Line(data)
  $("#statsChartLegend").html(myChart.generateLegend())

}

// Build a handler for a successful API request
var buildSuccessHandler = function (x, y, x_label, y_label, count_link_func) {
  if (!count_link_func) {
    count_link_func = function(row, count) {
      return count
    }
  }

  return function(rows) {

    var table = $('#usageDataTable tbody')
    table.empty()
    var ctrl = rows[x]
    var ctrlClass = ''
    rows.forEach(function(row) {
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
      buf = buf + '<td class="text-right">' + count_link_func(row, row.count) + '</td>'
      if (row.daily_percentage !== undefined) {
        buf = buf + '<td class="text-right">' + row.daily_percentage + '%</td>'
      }
      buf = buf + '</tr>'
      table.append(buf)
    })

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

    var data = {
      labels: labels,
      datasets: _.map(datasets, function(dataset, idx) {
        return _.extend({
          label: ys[idx],
          data: dataset
        }, styles[idx])
      })
    }

    var container = $("#usageChartContainer")
    container.empty()
    container.append("<canvas id='usageChart' height='300' width='800'></canvas>")

    var usageChart = document.getElementById("usageChart")
    var ctx = usageChart.getContext("2d")
    var myChart = new Chart(ctx).Line(data, {scaleBeginAtZero: true })
    $("#usageChartLegend").html(myChart.generateLegend())
  }
}

// Data type success handlers
var usagePlatformHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform')
var usageVersionHandler = buildSuccessHandler('ymd', 'version', 'Date', 'Version')
var usageCrashesHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform', function(row, count) {
  return "<a href='#crashes_platform_detail/" + row.ymd + "/" + row.platform + "'>" + count + "</a>"
})

// Array of content panels
var contents = [
  "usageContent",
  "crashesContent",
  "overviewContent",
  "statsContent",
  "topCrashContent",
  "recentCrashContent",
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
        var buf = '<tr>'
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
  $.ajax('/api/1/dau_platform_first_summary', {
    success: overviewHandler
  })
}

var eyeshadeRetriever = function() {
  $.ajax('/api/1/eyeshade_wallets?' + standardParams(), {
    success: usagePlatformHandler
  })
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
    retriever: eyeshadeRetriever
  },
}

// Mutable page state
var pageState = {
  currentlySelected: null,
  days: 14,
  version: null,
  platformFilter: {
    osx: false,
    winx64: false,
    winia32: false,
    ios: false,
    android: false
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
    ios: true,
    android: true
  }
}

var enableAllPlatforms = function () {
  viewState.platformEnabled = {
    osx: true,
    winx64: true,
    winia32: true,
    ios: true,
    android: true
  }
}

var disableAllPlatforms = function () {
  viewState.platformEnabled = {
    osx: false,
    winx64: false,
    winia32: false,
    ios: false,
    android: false
  }
}

var enableDesktopPlatforms = function () {
  viewState.platformEnabled.osx = true
  viewState.platformEnabled.winia32 = true
  viewState.platformEnabled.winx64 = true
}

var disableDesktopPlatforms = function () {
  viewState.platformEnabled.osx = true
  viewState.platformEnabled.winia32 = true
  viewState.platformEnabled.winx64 = true
}

var enableMobilePlatforms = function () {
  viewState.platformEnabled.ios = true
  viewState.platformEnabled.android = true
}

var disableMobilePlatforms = function () {
  viewState.platformEnabled.ios = false
  viewState.platformEnabled.android = false
}

$("#daysSelector").on('change', function (evt, value) {
  pageState.days = parseInt(this.value, 10)
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

var searchInputHandler = function (e) {
  var q = this.value
  console.log(q)
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
      console.log(results)
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
        table.append(tr([
          td(idx + 1),
          td('<a href="#crash/' + crash.id + '">' + crash.id + '</a>'),
          td(crash.contents.ver),
          td(crash.contents._version),
          td(crash.contents.year_month_day),
          td(crash.contents.platform + ' ' + crash.contents.metadata.cpu),
          td(crash.contents.metadata.operating_system_name),
          td(_.map(crash.tags, function (tag) { return '<span class="label label-info">' + tag + '</span>'}).join(' '))
          ]
        ))
        table.append(tr([td(), '<td colspan="7">' + crash.contents.metadata.signature + '</td>']))
      })
    }
  })
}

$("#searchText").on('input', _.debounce(searchInputHandler, 500))

$("#searchComments").hide()
