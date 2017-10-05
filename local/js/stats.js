window.STATS = {};

(function () {
  var secondOrder = (d) => {
    var points = [0]
    for (var i = 1; i < d.length; i += 1) {
      points.push(d[i] - d[i - 1])
    }
    return points
  }

  var perc = (d2, d1) => {
    var points = []
    for (var i = 0; i < d1.length - 1; i += 1) {
      points.push(d2[i+1] / d1[i])
    }
    return points
  }

  var sum = (d) => {
    return d.reduce((memo, value) => { return memo + value }, 0)
  }

  var avg = (d) => {
    return sum(d) / d.length
  }

  var subArray = (d, start, length) => {
    var points = []
    for (var i = 0; i < length; i += 1) {
      points.push(d[start + i])
    }
    return points
  }

  var smooth = (d, size=3) => {
    var points = []
    var start, realSize
    var deltaBack = Math.floor(points / 2)
    for (var i = 0; i <= d.length - 1; i += 1) {
      start = i - deltaBack
      if (start < 0) start = 0
      if (i < size) realSize = i + 1
      if (d.length - i < size) realSize = d.length - i
      console.log(start, realSize)
      console.log(subArray(d, start, realSize))
      points.push(avg(subArray(d, start, realSize)))
    }
    return points
  }
  window.STATS.STATS = {
    secondOrder: secondOrder,
    perc: perc,
    sum: sum,
    avg: avg,
    subArray: subArray,
    smooth: smooth
  }
})()
