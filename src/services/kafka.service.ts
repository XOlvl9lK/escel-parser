import {Kafka, Producer} from "kafkajs";
import {LoggerService, LogLine} from "./logger.service";
import {ValidatedRow} from "./validation.service";

export class KafkaService {
  private static instance: KafkaService
  private logger = LoggerService.getInstance()
  private kafka: Kafka
  private producer: Producer

  private constructor() {
    this.kafka = new Kafka({
      clientId: 'EMIAS.DN.DNPDN',
      brokers: ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092']
    })
    this.producer = this.kafka.producer()
  }

  static getInstance(): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService()
    }
    return KafkaService.instance
  }

  async sendMessage(topic: string, message: string, key: string): Promise<void> {
    try {
      await this.producer.connect()
      await this.producer.send({
        topic,
        messages: [
          { value: message, key }
        ]
      })
    } catch (e: any) {
      const row = JSON.parse(message) as ValidatedRow
      const patientData = row.policyNumber || row.lastName + ' ' + row.firstName + ' ' + row.middleName
      const logLine = LogLine.getUnsuccessfulLine(patientData, e.message || '')
      this.logger.writeLine(logLine)
    }
  }
}