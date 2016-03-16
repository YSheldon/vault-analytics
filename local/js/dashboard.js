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
    label: 'Windows',
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
var buildSuccessHandler = function (x, y, x_label, y_label) {
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
      buf = buf + '<td class="text-right">' + row.count + '</td>'
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

// Array of content panels
var contents = [
  "usageContent",
  "crashesContent",
  "overviewContent",
  "statsContent"
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

var crashesRetriever = function() {
  $.ajax('/api/1/dc_platform?' + standardParams(), {
    success: usagePlatformHandler
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
    title: "Usage by Platform",
    retriever: DAUPlatformRetriever
  },
  "mnDailyUsageStats": {
    show: "statsContent",
    title: "Daily Usage Stats",
    retriever: DUSRetriever
  },
  "mnDailyNew": {
    show: "usageContent",
    title: "Daily New Users",
    retriever: DNUPlatformRetriever
  },
  "mnUsageAgg": {
    title: "Usage (Aggregated)",
    show: "usageContent",
    retriever: DAURetriever
  },
  "mnVersions": {
    title: "Versions",
    show: "usageContent",
    retriever: versionsRetriever
  },
  "mnCrashes": {
    title: "Crashes by Platform",
    show: "usageContent",
    retriever: crashesRetriever
  },
  "mnCrashesVersion": {
    title: "Crashes by Platform / Version",
    show: "usageContent",
    retriever: crashesVersionRetriever
  }
}

// Mutable page state
var pageState = {
  currentlySelected: null,
  days: 14,
  platformFilter: {
    osx: false,
    winx64: false,
    ios: false,
    android: false
  },
  channelFilter: {
    dev: true,
    beta: false,
    stable: false
  },
  showToday: true
}

$("#daysSelector").on('change', function (evt, value) {
  pageState.days = parseInt(this.value, 10)
  refreshData()
})

// Update page based on current state
var updatePageUIState = function() {
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

var refreshData = function() {
  if (menuItems[pageState.currentlySelected]) {
    menuItems[pageState.currentlySelected].retriever()
  }
}

// Setup menu handler routes
var router = new Grapnel()

router.get('|overview', function(req) {
  pageState.currentlySelected = 'mnOverview'
  updatePageUIState()
})

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

router.get('crashes_platform', function(req) {
  pageState.currentlySelected = 'mnCrashes'
  updatePageUIState()
  refreshData()
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
