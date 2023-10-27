import { Kafka, Partitioners, Producer } from 'kafkajs';
import {LoggerService, LogLine} from "./logger.service";
import { RowForSending } from "./validation.service";

export type TopicType = 'dnPatient' | 'dnPatientV2'

export class KafkaService {
  private static instance: KafkaService
  private logger;
  private kafka: Kafka
  private producer: Producer

  private constructor(settings: KafkaSettings) {
    this.logger = LoggerService.getInstance()
    this.kafka = new Kafka(settings.getSettings())
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner })
  }

  static getInstance(settings: KafkaSettings): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService(settings)
    }
    return KafkaService.instance
  }

  async sendMessage(topic: TopicType, rows: RowForSending[]): Promise<void> {
    const messages = rows.map(r => ({
      value: r.message,
      key: r.key
    }))
    try {
      await this.producer.connect()
      await this.producer.send({
        topic,
        messages
      })
      rows.forEach(r => {
        const logLine = LogLine.getSuccessfulLine(r.fileId, r.patientData, r.message)
        this.logger.writeLine(logLine)
      })
    } catch (e: any) {
      rows.forEach(r => {
        const logLine = LogLine.getUnsuccessfulLine(r.fileId, r.patientData, JSON.stringify(r.message), 'Техническая ошибка при отправке сообщения' + ' ' + (e?.message || '') + ' ' + (e?.stack || ''))
        this.logger.writeLine(logLine)
      })
    }
  }
}

export class KafkaSettings {
  clientId: string
  brokers: string[]

  constructor(clientId: string, brokers: string[]) {
    this.clientId = clientId
    this.brokers = brokers
  }

  getSettings() {
    return {
      clientId: this.clientId,
      brokers: this.brokers
    }
  }
}
