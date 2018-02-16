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

    var totalDownloads = _.reduce(results.platform_summary, (memo, summary) => { return memo + summary.downloads }, 0)

    var summaryTable = $("#overview-referral-promo-summary")
    summaryTable.append(`<tr><td>Participating Publishers</td><td><strong>${results.owner_summary.length}</strong></td></tr>`)
    summaryTable.append(`<tr><td>Total Downloads</td><td><strong>${totalDownloads}</strong></td></tr>`)

    var platformTable = $("#overview-referral-promo-platform tbody")
    let sortedPlatforms = results.platform_summary.sort((a, b) => {
      return (b.downloads || 0) - (a.downloads || 0)
    })
    sortedPlatforms.forEach((summary) => {
      let finalizationPercentage = summary.downloads > 0 ?
        parseInt(summary.finalized / summary.downloads * 100) :
        0
      let platformPercentage = parseInt(summary.downloads / totalDownloads * 100)
      platformTable.append(`
        <tr>
          <td>${platformIconImg(summary.platform)}</td>
          <td>${platformTitle(summary.platform)}</td>
          <td class='text-right'>${summary.downloads} <span class='subvalue'>${platformPercentage}%</span></td>
          <td class='text-right'>${summary.finalized} <span class='subvalue'>${finalizationPercentage}%</span><td>
        </tr>
      `)
    })
    platformTable.append(`
      <tr>
        <td></td>
        <td></td>
        <td class='text-right'><strong>${totalDownloads}</strong></td>
        <td class='text-right'></td>
      </tr>
    `)

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
      tbl.append(`<tr><td>${summary.title || summary.channel}</td><td>${platformIconImg(summary.platform)}</td><td>${platformTitle(summary.platform)}</td><td class='text-right'>${summary.downloads}</td><td class='text-right'>${summary.finalized} <span class='subvalue'>${finalizationPercentage}%</span><td></tr>`)
    })
  }

  window.REFERRAL = {
    referralSummaryStatsRetriever
  }
})()

