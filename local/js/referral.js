(function () {
  var platformTitle = (platform) => {
    if (platform === 'android') return 'Android Browser'
    return platform
  }

  var platformIconImg = (platform) => {
    if (platform === 'android') platform = 'Android Browser'
    return `<img src="/local/img/platform-icons/${platform}.png" height="18">`
  }

  var sparklineOptions = { width: "200px", height: "55px", disableInteraction: true, fillColor: "#efefef", lineColor: "#999999" }

  var referralSummaryStatsRetriever = async () => {
    var results = await $.ajax("/api/1/referral/stats/summary")
    console.log(results)

    var platformTable = $("#overview-referral-promo-platform tbody")
    results.platform_summary.forEach((summary) => {
      let finalizationPercentage = summary.downloads > 0 ?
        parseInt(summary.finalized / summary.downloads * 100) :
        0
      console.log(finalizationPercentage)
      platformTable.append(`<tr><td>${platformIconImg(summary.platform)}</td><td>${platformTitle(summary.platform)}</td><td class='text-right'>${summary.downloads}</td><td class='text-right'>${summary.finalized} <span class='subvalue'>${finalizationPercentage}%</span><td></tr>`)
    })

    let sparkData = _.pluck(results.ymd_summary, 'downloads')
    console.log(sparkData)

    $("#overview-referral-promo-sparkline").sparkline(sparkData, sparklineOptions)

    let sortedChannels = results.owner_summary.sort((a, b) => {
      return (b.downloads || 0) - (a.downloads || 0)
    })
    if (sortedChannels.length > 9) { sortedChannels = sortedChannels.slice(0, 10) }

    var tbl = $("#overview-referral-promo-top-channels tbody")
    sortedChannels.forEach((summary) => {
      let finalizationPercentage = summary.downloads > 0 ?
        parseInt(summary.finalized / summary.downloads * 100) :
        0
      tbl.append(`<tr><td>${summary.channel}</td><td>${platformIconImg(summary.platform)}</td><td>${platformTitle(summary.platform)}</td><td class='text-right'>${summary.downloads}</td><td class='text-right'>${summary.finalized} <span class='subvalue'>${finalizationPercentage}%</span><td></tr>`)
    })
  }

  window.REFERRAL = {
    referralSummaryStatsRetriever
  }
})()

