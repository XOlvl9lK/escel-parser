const fs = require('fs')
const path = require('path')
const { EOL } = require('os')

module.exports = class Logger {
  static pathToLogs = path.join(__dirname, 'logs.txt')
  static totalLines = 0

  static error(message, context) {
    this.totalLines > 10000 && this.clearLogs()

    console.log(message)
    fs.appendFileSync(
      this.pathToLogs,
      `${EOL}ERROR - ${new Date()} - ${context ? `[${context}]: ` : ''} ${message}`
    )

    this.totalLines++
  }

  static warn(message, context) {
    this.totalLines > 10000 && this.clearLogs()

    fs.appendFileSync(
      this.pathToLogs,
      `${EOL}WARN  - ${new Date()} - ${context ? `[${context}]: ` : ''} ${message}`
    )

    this.totalLines++
  }

  static log(message, context) {
    this.totalLines > 10000 && this.clearLogs()

    fs.appendFileSync(
      this.pathToLogs,
      `${EOL}LOG   - ${new Date()} - ${context ? `[${context}]: ` : ''} ${message}`
    )

    this.totalLines++
  }


  static clearLogs() {
    fs.unlinkSync(this.pathToLogs)
  }
}