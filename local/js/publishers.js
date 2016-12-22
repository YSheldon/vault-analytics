(function () {
  var overviewPublisherHandler = function (overview) {
    var overviewTable = $("#overview-publishers-table tbody")
    overviewTable.empty()

    overviewTable.append(tr([
      td("Publishers"),
      td(st(overview.total), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("Verified"),
      td(st(overview.verified), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("Percentage of publishers verified"),
      td(numeral(overview.verified / overview.total).format('0.0%'), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("Bitcoin Address"),
      td(st(overview.address), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("Percentage of publishers with Bitcoin address"),
      td(numeral(overview.address / overview.total).format('0.0%'), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("IRS Forms"),
      td(st(overview.irs), "right"),
      td()
    ]))
    overviewTable.append(tr([
      td("Percentage of publishers with IRS forms"),
      td(numeral(overview.irs / overview.total).format('0.0%'), "right"),
      td()
    ]))
  }

  var publisherDailyRetriever = function () {
    $.ajax('/api/1/publishers/daily?' + standardParams(), {
      success: dailyPublisherHandler
    })
  }

  var dailyPublisherHandler = function (rows) {

    var table = $('#publisherDataTable tbody')
    table.empty()
    rows.forEach(function(row) {
      var buf = '<tr>'
      buf = buf + '<td>' + row.ymd + '</td>'
      buf = buf + '<td>' + row.total + '</td>'
      buf = buf + '<td>' + row.verified + ' <span class="subvalue">' + numeral(window.STATS.COMMON.safeDivide(row.verified, row.total)).format('0.0%') + '</span></td>'
      buf = buf + '<td>' + row.address + ' <span class="subvalue">' + numeral(window.STATS.COMMON.safeDivide(row.address, row.total)).format('0.0%') + '</span></td>'
      buf = buf + '<td>' + row.irs + ' <span class="subvalue">' + numeral(window.STATS.COMMON.safeDivide(row.irs, row.total)).format('0.0%') + '</span></td>'
      buf = buf + '</tr>'
      table.append(buf)
    })

    // Build a list of unique labels (ymd)
    var ymds = _.chain(rows)
        .map(function(row) { return row.ymd })
        .uniq()
        .sort()
        .value()

    // Associate the data
    var product = _.object(_.map(ymds, function(ymd) {
      return [ymd, {}]
    }))

    rows.forEach(function(row) {
      product[row.ymd].total = row.total
      product[row.ymd].verified = row.verified
      product[row.ymd].address = row.address
      product[row.ymd].irs = row.irs
    })

    var ys = ['total', 'verified', 'address', 'irs']

    // Build the Chart.js data structure
    var datasets = []
    _.each(ys, function (fld) {
      var dataset = []
      ymds.forEach(function(ymd) {
        dataset.push(product[ymd][fld] || 0)
      })
      datasets.push(dataset)
    })

    var colorer = window.STATS.COLOR.colorForIndex

    var data = {
      labels: ymds,
      datasets: _.map(datasets, function(dataset, idx) {
        return {
          label: ys[idx] || 'All',
          data: dataset,
          borderColor: colorer(idx, 1),
          pointColor: colorer(idx, 0.5),
          backgroundColor: colorer(idx, 0.05)
        }
      })
    }

    var container = $("#publisherChartContainer")
    container.empty()
    container.append("<canvas id='publisherChart' height='350' width='800'></canvas>")

    var usageChart = document.getElementById("publisherChart")
    new Chart.Line(
      usageChart.getContext("2d"),
      {
        data: data,
        options: window.STATS.COMMON.standardYAxisOptions
      }
    )
  }

  window.STATS.PUB = {
    overviewPublisherHandler: overviewPublisherHandler,
    dailyPublisherHandler: dailyPublisherHandler,
    publisherDailyRetriever: publisherDailyRetriever
  }
})()
