(function () {
  var currentlySelectedPlatform = "publisher"

  var providerLogo = (provider) => {
    if (!provider) return ''
    var icon = {
      uphold: '/local/img/provider-icons/uphold.png'
    }[provider] || ''
    return icon
  }

  var publisherLabel = (publisher) => {
    if (publisher.platform === 'publisher') {
      return publisher.publisher
    } else {
      return publisher.name
    }
  }

  var overviewPublisherHandlerDetails = async function (publishers, platform) {
    if (!publishers.length) return
    var i, publisher, createdWhen, details, grouped, selectedPublishers
    var buf = ""
    $("#details-publishers-table").fadeOut(250, () => {
      details = $("#details-publishers-table tbody")
      details.empty()
      grouped = _.groupBy(publishers, (publisher) => { return publisher.platform })
      selectedPublishers = grouped[platform]
      if (!selectedPublishers || !selectedPublishers.length) {
        $("#details-publishers-table").fadeIn(500)
        return
      }
      for (i = details.children().length; i < selectedPublishers.length; i++) {
        publisher = selectedPublishers[i]
        createdWhen = moment(publisher.created_at)
         buf += tr([
          td(`<img height=24 src="${providerLogo(publisher.provider)}"/>`, 'right'),
          td("<a href='" + publisher.url +"'>" + ellipsify(publisherLabel(publisher), 30) + "</a><br><span class='subvalue'>" + createdWhen.format("MMM DD, YYYY") + " " + createdWhen.fromNow() + "</span>"),
          td(st(publisher.alexa_rank || publisher.audience || 0), "right"),
          td(publisher.verified ? '<i class="fa fa-check"></i>' : '', "center"),
          td(publisher.authorized ? '<i class="fa fa-check"></i>' : '', "center")
        ])
      }
      details.append(buf)
      setTimeout(() => {
        $("#details-publishers-table").fadeIn(400)
      })
    })
  }

  var overviewPublisherHandlerPlatforms = function (categories) {
    var i, cls
    var nav = $("#publisher-platforms-nav-container")
    nav.empty()
    for (i = 0; i < categories.length; i++) {
      cls = categories[i].platform === 'publisher' ? 'active' : ''
      nav.append(`<li role="presentation" data-platform="${categories[i].platform}" class="${cls}"><a class="publisher-platform-nav-item" href="#" data-platform="${categories[i].platform}" id="publisher-platform-nav-item-${categories[i].platform}"><img src='/local/img/publisher-icons/${categories[i].icon_url}' height="24"/> ${categories[i].label}</a></li>`) 
    }
  }

  var overviewPublisherHandler = function (overview, buckets, publishers, publisherCategories) {
    var val, per, buf

    var overviewTable = $("#overview-publishers-table tbody")
    overviewTable.empty()

    var grouped = _.groupBy(publishers, (publisher) => { return publisher.platform })
    var platformIds = _.keys(grouped)
    console.log(publisherCategories)

    buf = ""
    buf += "<tr>"
    buf += "<td></td>"
    buf += "<td></td>"
    buf += "<td></td>"
    publisherCategories.forEach((platform) => {
      buf += `<th colspan="2" style="text-align: center;"><img src="/local/img/publisher-icons/${platform.icon_url}" height="16"/></th>`
    })
    buf += "</tr>"
    overviewTable.append(buf)

    buf = "<tr>"
    buf += td("Publishers"),
    buf += td(st(publishers.length), "right") + td()
    publisherCategories.forEach((platform) => {
      if (grouped[platform.platform]) {
        buf += td(st(grouped[platform.platform].length), 'right') + td()
      } else {
        buf += td("-") + td("")
      }
    })
    buf += "</tr>"
    overviewTable.append(buf)

    buf = "<tr>"
    buf += td("Verified")
    buf += tdsv(st(overview.verified), overview.verified / overview.total)
    publisherCategories.forEach((platform) => {
      if (grouped[platform.platform]) {
        val = grouped[platform.platform].filter((publisher) => { return publisher.verified }).length
        per = val / grouped[platform.platform].length
        buf += tdsv(st(val), per)
      } else {
        buf += td("-") + td("")
      }
    })
    overviewTable.append(buf)

    buf = "<tr>"
    buf += td("Authorized")
    buf += tdsv(st(overview.authorized), overview.authorized / overview.total)
    publisherCategories.forEach((platform) => {
      if (grouped[platform.platform]) {
        val = grouped[platform.platform].filter((publisher) => { return publisher.authorized }).length
        per = val / grouped[platform.platform].length
        buf += tdsv(st(val), per)
      } else {
        buf += td("-") + td("")
      }
    })
    overviewTable.append(buf)

    // insert an initial set of top publishers
    overviewPublisherHandlerPlatforms(publisherCategories)
    overviewPublisherHandlerDetails(publishers, currentlySelectedPlatform)

    // setup platfrom nav click handlers
    $("#publisher-platforms-nav-container").delegate("a.publisher-platform-nav-item").click((evt, tg) => {
      var li = $(evt.target).closest("li")
      evt.preventDefault()
      evt.stopPropagation()
      var savedPlatform = currentlySelectedPlatform
      var platform = li.data("platform")

      if (savedPlatform === platform) return

      currentlySelectedPlatform = platform
      li.parent().children().each((idx) => {
        var sli  = $(li.parent().children()[idx])
        if (sli.data("platform") === currentlySelectedPlatform) {
          sli.addClass("active")
        } else {
          sli.removeClass("active")
        }
      })

      if (currentlySelectedPlatform) {
        overviewPublisherHandlerDetails(publishers, currentlySelectedPlatform)
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
