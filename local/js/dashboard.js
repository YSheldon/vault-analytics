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

var topCrashHandler = function(rows) {
  var table = $('#top-crash-table tbody')
  table.empty()
  rows.forEach(function (row) {
    var params = [row.platform, row.version, pageState.days, encodeURIComponent(row.crash_reason), row.cpu, encodeURIComponent(row.signature)].join('/')
    var buf = '<tr>'
    buf = buf + '<td class="text-right"><a href="#crash_list/' + params + '">' + row.total + '</a></td>'
    buf = buf + '<td class="text-left">' + row.version + '</td>'
    buf = buf + '<td class="text-left">' + row.platform + '</td>'
    buf = buf + '<td class="text-left">' + row.cpu + '</td>'
    buf = buf + '<td class="text-left">' + row.crash_reason + '</td>'
    buf = buf + '<td class="text-left">' + row.signature + '</td>'
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
  "recentCrashContent"
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
    showToday: pageState.showToday
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

var recentCrashesRetriever = function() {
  $.ajax('/api/1/recent_crash_report_details?' + standardParams(), {
    success: function(crashes) {
      $("#contentTitle").html("Recent Crash Reports")
      var table = $('#recent-crash-list-table tbody')
      table.empty()
      _.each(crashes, function(crash) {
        table.append('<tr><td><a href="#crash/' + crash.id + '">' + crash.id + '</a></td><td nowrap>' + crash.ymd + '<br/><span class="ago">' + crash.ago + '</span></td><td>' + crash.version + '</td><td>' + crash.platform + '</td><td>' + crash.cpu + '</td><td>' + crash.crash_reason + '<br/>' + crash.signature + '</td></tr>')
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

// Object of menu item meta data
var menuItems = {
  "mnOverview": {
    show: "overviewContent",
    title: "Overview"
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
}

// Mutable page state
var pageState = {
  currentlySelected: null,
  days: 14,
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

$("#daysSelector").on('change', function (evt, value) {
  pageState.days = parseInt(this.value, 10)
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
}

// Load data for the selected item
var refreshData = function() {
  if (menuItems[pageState.currentlySelected]) {
    menuItems[pageState.currentlySelected].retriever()
  }
}

// Setup menu handler routes
var router = new Grapnel()

/*router.get('|overview', function(req) {
  console.log('overview')
  pageState.currentlySelected = 'mnOverview'
  updatePageUIState()
})*/

router.get('versions', function(req) {
  pageState.currentlySelected = 'mnVersions'
  updatePageUIState()
  refreshData()
})

router.get('usage', function(req) {
  pageState.currentlySelected = 'mnUsage'
  updatePageUIState()
  refreshData()
})

router.get('usage_returning', function(req) {
  pageState.currentlySelected = 'mnUsageReturning'
  updatePageUIState()
  refreshData()
})

router.get('usage_month', function(req) {
  pageState.currentlySelected = 'mnUsageMonth'
  updatePageUIState()
  refreshData()
})

router.get('usage_month_agg', function(req) {
  pageState.currentlySelected = 'mnUsageMonthAgg'
  updatePageUIState()
  refreshData()
})

router.get('daily_new', function(req) {
  pageState.currentlySelected = 'mnDailyNew'
  updatePageUIState()
  refreshData()
})

router.get('daily_usage_stats', function(req) {
  pageState.currentlySelected = 'mnDailyUsageStats'
  updatePageUIState()
  refreshData()
})

router.get('usage_agg', function(req) {
  pageState.currentlySelected = 'mnUsageAgg'
  updatePageUIState()
  refreshData()
})

router.get('top_crashes', function(req) {
  pageState.currentlySelected = 'mnTopCrashes'
  updatePageUIState()
  refreshData()
    // Show and hide sub-sections
  $('#top-crash-table').show()
  $('#crash-detail').hide()
  $('#crash-list-table').hide()
})

router.get('recent_crashes', function(req) {
  pageState.currentlySelected = 'mnRecentCrashes'
  updatePageUIState()
  refreshData()
})

router.get('crashes_platform_detail/:ymd/:platform', function(req) {
  pageState.currentlySelected = 'mnCrashesDetails'
  updatePageUIState()
  //refreshData()
})

router.get('crashes_platform_version', function(req) {
  pageState.currentlySelected = 'mnCrashesVersion'
  updatePageUIState()
  refreshData()
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

router.get('crashes_platform', function(req) {
  pageState.currentlySelected = 'mnCrashes'
  updatePageUIState()
  refreshData()
})

// Display a single crash report
router.get('crash/:id', function(req) {
  pageState.currentlySelected = 'mnTopCrashes'
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

  $.ajax('/api/1/crash_report?id=' + req.params.id, {
    success: function(crash) {
      $("#controls").hide()
      $("#contentTitle").html("Crash Report " + req.params.id)
      console.log(crash)
      table.empty()
      _.each(_.keys(crash.crash.contents).sort(), function (k) {
        if (!_.isObject(crash.crash.contents[k])) {
          table.append('<tr><td>' + k + '</td><td>' + crash.crash.contents[k] + '</td></tr>')
        }
      })
      $('#crash-detail-stack').html(crash.crash_report)
      $('#crash-download-container').html("<a class='btn btn-primary' href='/download/crash_report/" + req.params.id + "'>Download</a>")
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
        table.append('<tr><td><a href="#crash/' + crash.id + '">' + crash.id + '</a></td><td nowrap>' + crash.ymd + '<br/><span class="ago">' + crash.ago + '</span></td><td>' + crash.version + '</td><td>' + crash.platform + '</td><td>' + crash.cpu + '</td><td>' + crash.crash_reason + '<br/>' + crash.signature + '</td></tr>')
      })
    }
  })
})
