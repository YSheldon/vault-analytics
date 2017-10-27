function setup () {
  var filterLinksOn = function (text) {
    text = (text || '').toLowerCase()
    if (text) {
      $(".sidebar li a").each(function (idx, elem) {
        if (elem.text.toLowerCase().match(new RegExp(text))) {
          $(elem).closest('li').show('fast')
        } else {
          $(elem).closest('li').hide('fast')
        }
      })
    } else {
      $(".sidebar li a").each(function (idx, elem) {
        $(elem).closest('li').show('fast')
      })
    }
  }

  var menuFilters = [
    ['filterMAU', 'MAU'],
    ['filterDAU', 'DAU'],
    ['filterLedger', 'Ledger'],
    ['filterCrashes', 'Crash'],
    ['filterPublisher', 'Publisher'],
    ['filterTelemetry', 'Telemetry']
  ]

  menuFilters.forEach((pair) => {
    $("#" + pair[0]).on('click', function (evt) {
      evt.preventDefault()
      $("#searchLinks").val(pair[1])
      filterLinksOn(pair[1])
    })
  })

  var linksSearchInputHandler = function (e) {
    filterLinksOn(this.value)
  }

  $("#searchLinks").on('input', _.debounce(linksSearchInputHandler, 250))

  $("#clearSearchLinks").on('click', function () {
    $("#searchLinks").val('')
    filterLinksOn(null)
    $("#searchLinks").focus()
  })

  $("#searchLinks").focus()
}

window.SEARCH_LINKS = {
  setup
}
