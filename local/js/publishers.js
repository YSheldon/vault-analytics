(function () {
  var providerLogo = (provider) => {
    if (!provider) return ''
    var icon = {
      uphold: '/local/img/provider-icons/uphold.png'
    }[provider] || ''
    console.log(icon)
    return icon
  }

  var publisherLabel = (publisher) => {
    if (publisher.platform === 'publisher') {
      return publisher.publisher
    } else {
      return publisher.name
    }
  }

  var overviewPublisherHandlerDetails = function (publishers, platform) {
    if (!publishers.length) return
    var i, publisher, createdWhen
    var details = $("#details-publishers-table tbody")
    details.empty()
    var grouped = _.groupBy(publishers, (publisher) => { return publisher.platform })
    var selectedPublishers = grouped[platform]
    if (!selectedPublishers.length) return
    for (i = details.children().length; i < selectedPublishers.length; i++) {
      publisher = selectedPublishers[i]
      createdWhen = moment(publisher.created_at)
      details.append(tr([
        td(`<img height=24 src="${providerLogo(publisher.provider)}"/>`, 'right'),
        td("<a href='" + publisher.url +"'>" + ellipsify(publisherLabel(publisher), 30) + "</a><br><span class='subvalue'>" + createdWhen.format("MMM DD, YYYY") + " " + createdWhen.fromNow() + "</span>"),
        td(st(publisher.alexa_rank || publisher.audience || 0)),
        td(publisher.verified ? 'Yes' : '-'),
        td(publisher.authorized ? 'Yes' : '-')
      ]))
    }
  }

  var overviewPublisherHandlerPlatforms = function (categories) {
    var i, cls
    var nav = $("#publisher-platforms-nav-container")
    for (i = 0; i < categories.length; i++) {
      cls = categories[i].platform === 'publisher' ? 'active' : ''
      nav.append(`<li role="presentation" data-platform="${categories[i].platform}" class="${cls}"><a class="publisher-platform-nav-item" href="#" data-platform="${categories[i].platform}" id="publisher-platform-nav-item-${categories[i].platform}"><img src='/local/img/publisher-icons/${categories[i].icon_url}' height="24"/> ${categories[i].label}</a></li>`) 
    }
  }

  var overviewPublisherHandler = function (overview, buckets, publishers, publisherCategories) {
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

    // insert an initial set of top publishers
    overviewPublisherHandlerPlatforms(publisherCategories)
    overviewPublisherHandlerDetails(publishers, 'publisher')

    // setup platfrom nav click handlers
    $("#publisher-platforms-nav-container").delegate("a.publisher-platform-nav-item").click((evt, tg) => {
      var li = $(evt.target).closest("li")
      evt.preventDefault()
      evt.stopPropagation()
      var platform = li.data("platform")

      li.parent().children().each((idx) => {
        var sli  = $(li.parent().children()[idx])
        if (sli.data("platform") === platform) {
          sli.addClass("active")
        } else {
          sli.removeClass("active")
        }
      })

      if (platform) {
        overviewPublisherHandlerDetails(publishers, platform)
      }
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
