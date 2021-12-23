const { Kafka } = require('kafkajs')
const Logger = require('./logger')

module.exports = async (message, key) => {
  try {
    const kafka = new Kafka({
      clientId: 'EMIAS.DN.DNPDN',
      brokers: ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092']
    })

    const producer = kafka.producer()

    await producer.connect()
    await producer.send({
      topic: 'dnPatient',
      messages: [
        { value: message, key }
      ]
    })

    await producer.disconnect()
  } catch (e) {
    Logger.error(e.message, 'KafkaMessenger')
  }
}