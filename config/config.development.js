if (!process.env.PORT) process.env.PORT = 8193

module.exports = {
  port: process.env.PORT,
  slack: {
    webhook: process.env.SLACK_WEBHOOK,
    channel: process.env.SLACK_CHANNEL,
    icon_url: process.env.SLACK_ICON_URL
  }
}
