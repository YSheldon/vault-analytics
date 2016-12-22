(function () {
  // Standard configuration object for line graphs
  var standardYAxisOptions = {
    tooltips: {
      mode: 'x',
      position: 'nearest'
    },
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }

  var safeDivide = function (n, d, def) {
    def = def || 0
    if (!d || d === 0) return def
    return n / d
  }
  
  window.STATS.COMMON = {
    standardYAxisOptions: standardYAxisOptions,
    safeDivide: safeDivide
  }
})()
