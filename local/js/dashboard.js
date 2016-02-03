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

// Build a handler for a successful API request
var buildSuccessHandler = function (x, y, x_label, y_label) {
  return function(rows) {

    var table = $('#usageDataTable tbody')
    table.empty()
    rows.forEach(function(row) {
      table.append('<tr><td>' + row[x] + '</td><td>' + (row[y] || 'All') + '</td><td class="text-right">' + row.count + '</td></tr>')
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

    var ctx = document.getElementById("usageChart").getContext("2d");
    var myChart = new Chart(ctx).Line(data, {scaleBeginAtZero: true })
  }
}

// Data type success handlers
var usagePlatformHandler = buildSuccessHandler('ymd', 'platform', 'Date', 'Platform')
var usageVersionHandler = buildSuccessHandler('ymd', 'version', 'Date', 'Version')

// Array of content panels
var contents = [
  "usageContent",
  "crashesContent",
  "overviewContent"
]

// Object of menu item meta data
var menuItems = {
  "mnOverview": {
    show: "overviewContent",
    title: "Overview"
  },
  "mnUsage": {
    show: "usageContent",
    title: "Usage by Platform"
  },
  "mnUsageAgg": {
    title: "Usage (Aggregated)",
    show: "usageContent"
  },
  "mnVersions": {
    title: "Versions",
    show: "usageContent"
  },
  "mnCrashes": {
    title: "Crashes",
    show: "crashesContent"
  }
}

// Mutable page state
var pageState = {
  currentlySelected: null
}

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

// Setup menu handler routes
var router = new Grapnel()

router.get('|overview', function(req) {
  pageState.currentlySelected = 'mnOverview'
  updatePageUIState()
})

router.get('versions', function(req) {
  pageState.currentlySelected = 'mnVersions'
  updatePageUIState()
  $.ajax('/api/1/versions', {
    success: usageVersionHandler
  })
})

router.get('usage', function(req) {
  pageState.currentlySelected = 'mnUsage'
  updatePageUIState()
  $.ajax('/api/1/dau_platform', {
    success: usagePlatformHandler
  })
})

router.get('usage_agg', function(req) {
  pageState.currentlySelected = 'mnUsageAgg'
  updatePageUIState()
  $.ajax('/api/1/dau', {
    success: usagePlatformHandler
  })
})

router.get('crashes_agg', function(req) {
  pageState.currentlySelected = 'mnCrashes'
  updatePageUIState()
  // TODO - aggregate crash data and build API
})
