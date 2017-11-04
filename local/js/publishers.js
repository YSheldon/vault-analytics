(function () {
  var cachedPublishers
  var overviewPublisherHandlerDetails = function (publishers=[]) {
    var i, publisher, createdWhen
    var details = $("#details-publishers-table tbody")
    if (!cachedPublishers) cachedPublishers = publishers
    for (i = details.children().length; i < cachedPublishers.length; i++) {
      publisher = cachedPublishers[i]
      createdWhen = moment(publisher.created_at)
      details.append(tr([
        td("<a href='https://" + publisher.publisher + "'>" + publisher.publisher + "</a><br><span class='subvalue'>" + createdWhen.format("MMM DD, YYYY") + " " + createdWhen.fromNow() + "</span>"),
        td(publisher.alexa_rank || '-'),
        td(publisher.verified ? 'Yes' : '-'),
        td(publisher.authorized ? 'Yes' : '-')
      ]))
    }
  }

  var overviewPublisherHandler = function (overview, buckets, publishers=[]) {
    var overviewTable = $("#overview-publishers-table tbody")
    overviewTable.empty()

    overviewTable.append(tr([
      td("Publishers"),
      td(st(overview.total), "left")
    ]))
    overviewTable.append(tr([
      td("Verified"),
      ptd(st(overview.verified), numeral(overview.verified / overview.total).format('0.0%'), "left")
    ]))
    overviewTable.append(tr([
      td("Authorized"),
      ptd(st(overview.authorized), numeral(overview.authorized / overview.total).format('0.0%'), "left")
    ]))
    overviewTable.append(tr([
      td("IRS Forms"),
      ptd(st(overview.irs), numeral(overview.irs / overview.total).format('0.0%'), "left")
    ]))

    // insert an initial set of top publishers
    overviewPublisherHandlerDetails(publishers)

    var bucketTable = $("#overview-publishers-bucketed-table tbody")
    bucketTable.empty()

    buckets.forEach(function (bucket) {
      bucketTable.append(tr([
        td(bucket.days, "right"),
        td(st(bucket.total), "right"),
        ptd(st(bucket.verified), numeral(bucket.verified / bucket.total).format('0.0%'), "right"),
        ptd(st(bucket.authorized), numeral(bucket.authorized / bucket.total).format('0.0%'), "right"),
        ptd(st(bucket.irs), numeral(bucket.irs / bucket.total).format('0.0%'), "right")
      ]))
    })
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
      buf = buf + '<td>' + row.authorized + ' <span class="subvalue">' + numeral(window.STATS.COMMON.safeDivide(row.authorized, row.total)).format('0.0%') + '</span></td>'
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
      product[row.ymd].authorized = row.authorized
      product[row.ymd].irs = row.irs
    })

    var ys = ['total', 'verified', 'authorized', 'irs']

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
