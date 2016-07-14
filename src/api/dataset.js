var _ = require('underscore')

/*
  Combine records for a group (ymd) that have a combined value of less than limit

  This function is useful for combining the values of a set of records into a single
  accumulate record. As an example we may want to combine all records for a version
  within a day in which the combined total is less that 2% of the total for the entire
  time period.
*/
exports.condense = (dataset, groupBy, attrib, limit = 0.05, label = 'other') => {
  // Build a clone of the records
  var records = _.clone(dataset)

  // Build an object containing as its key the inspected attrib and the total count
  var sums = {}
  _.each(records, (record) => {
    sums[record[attrib]] = (sums[record[attrib]] || 0) + record.count
  })

  // Calculate the sum of all sums
  var sum = _.reduce(sums, (memo, value) => memo + value)

  // Build an object containing as its key the inspected attribute and its percentage of the total count
  var percentages = _.object(_.map(sums, (v, k) => [k, v / sum]))

  // Build an object containing as its key the attribute values that fall below a prescribed percentage
  var lessThanLimit = _.filter(_.keys(percentages), (k) => percentages[k] < limit)

  // Group the input records by the groupBy parameter
  var groups = _.groupBy(records, (record) => record[groupBy])

  // An object containing as its key the groupBy value and its value the sum of all counts from lessThanLimit records
  var extras = []
  _.each(groups, (v, k) => {
    // Calculate the sum of counts for values in lessThanLimit
    let extra = _.reduce(v, (memo, record) => {
      if (lessThanLimit.indexOf(record[attrib]) > -1) {
        return memo + record.count
      } else {
        return memo
      }
    }, 0)

    // Calculate the sum of count for the entire group
    let groupSum = _.reduce(v, (memo, record) => { return memo + record.count }, 0)

    // Build combined record
    let toInsert = {
      count: extra,
      daily_percentage: Math.round(extra / groupSum * 1000) / 10
    }
    toInsert[groupBy] = k
    toInsert[attrib] = label
    // Insert the combined record
    extras.push(toInsert)
  })

  // Remove all records that are in the the lessThanLimit list and append the extra records
  records = _.filter(records, (record) => lessThanLimit.indexOf(record[attrib]) === -1).concat(extras)

  // Re-sort by the groupBy and attrib
  records.sort((a, b) => (a[groupBy].localeCompare(b[groupBy]) * -1) || a[attrib].localeCompare(b[attrib]))

  return records
}
