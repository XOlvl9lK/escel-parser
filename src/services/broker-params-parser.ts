export class BrokerParamsParser {
  static parse(): string[] {
    const argv = process.argv
    const brokersArg = argv.find(arg => arg.includes('brokers='))
    if (!brokersArg) {
      throw new Error('brokers arg not passed')
    }
    const brokers = brokersArg
      .replace('brokers=', '')
      .split(',')
      .map(broker => broker.trim())
      .filter(Boolean)

    return brokers.map(broker => {
      const hasPort = /:\d\d\d\d/.test(broker)
      if (!hasPort) {
        return broker.replace(/:([\s\S]*)$/, '').concat(':9092')
      }
      return broker
    })
  }
}
