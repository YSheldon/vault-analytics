(function () {
  // High contrast color palette
  // (https://github.com/mbostock/d3/wiki/Ordinal-Scales#categorical-colors)
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

    // Return an rgba(x, x, x, x) text string by label
  var colorForLabel = function (label, opacity) {
    return colorForIndex({
      'winx64': 5,
      'winia32': 4,
      'osx': 2,
      'linux': 3,
      'ios': 6,
      'android': 0,
      'Link Bubble': 0,
      'androidbrowser': 1,
      'Android Browser': 1
    }[label] || 0, opacity)
  }

  // Return an rgba(x, x, x, x) text string by index
  var colorForIndex = function (idx, opacity) {
    opacity = opacity || 1
    idx = idx % colors.length
    return 'rgba(' + colors[idx][0] + ', ' + colors[idx][1] + ', ' + colors[idx][2] + ', ' + opacity + ')'
  }

  window.STATS.COLOR = {
    colorForIndex: colorForIndex,
    colorForLabel: colorForLabel
  }
})()
