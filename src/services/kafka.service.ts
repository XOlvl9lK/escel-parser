import {Kafka, Producer} from "kafkajs";
import {LoggerService, LogLine} from "./logger.service";
import {ValidatedRow} from "./validation.service";

export class KafkaService {
  private static instance: KafkaService
  private logger;
  private kafka: Kafka
  private producer: Producer

  private constructor(pathToLogs: string) {
    this.logger = LoggerService.getInstance(pathToLogs)
    this.kafka = new Kafka({
      clientId: 'EMIAS.DN.DNPDN',
      brokers: ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092']
    })
    this.producer = this.kafka.producer()
  }

  static getInstance(pathToLogs: string): KafkaService {
    if (!KafkaService.instance) {
      KafkaService.instance = new KafkaService(pathToLogs)
    }
    return KafkaService.instance
  }

  async sendMessage(topic: string, row: ValidatedRow, key: string): Promise<void> {
    const patientData = row.policyNumber || row.lastName + ' ' + row.firstName + ' ' + row.middleName
    const message = JSON.stringify({
      lastName: row.lastName,
      firstName: row.firstName,
      middleName: row.middleName,
      gender: row.gender,
      birthDate: row.birthDate,
      policyNumber: row.policyNumber,
      pdnStartDate: row.pdnStartDate
    })
    if (row.errors.length) {
      const logLine = LogLine.getUnsuccessfulLine(patientData, message, row.errors.join('. '))
      this.logger.writeLine(logLine)
      return
    }
    try {
      await this.producer.connect()
      await this.producer.send({
        topic,
        messages: [
          { value: message, key }
        ]
      })
      const logLine = LogLine.getSuccessfulLine(patientData, message)
      this.logger.writeLine(logLine)
    } catch (e: any) {
      const logLine = LogLine.getUnsuccessfulLine(patientData, JSON.stringify(message), 'Техническая ошибка при отправке сообщения' + ' ' + (e?.message || '') + ' ' + (e?.stack || ''))
      this.logger.writeLine(logLine)
    }
  }
}