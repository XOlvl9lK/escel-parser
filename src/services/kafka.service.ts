import {Kafka, Producer} from "kafkajs";
import {LoggerService, LogLine} from "./logger.service";
import {ValidatedRow} from "./validation.service";

export class KafkaService {
  private static instance: KafkaService
  private logger;
  private kafka: Kafka
  private producer: Producer

  private constructor(pathToLogs: string, settings: KafkaSettings) {
    this.logger = LoggerService.getInstance(pathToLogs)
    this.kafka = new Kafka(settings.getSettings())
    this.producer = this.kafka.producer()
  }

  static getInstance(pathToLogs: string, settings: KafkaSettings): KafkaService {
    if (!KafkaService.instance) {
      console.log(settings)
      KafkaService.instance = new KafkaService(pathToLogs, settings)
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
      pdnStartDate: row.pdnStartDate,
      diagnoses: row.diagnoses
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

export class KafkaSettings {
  clientId: string
  brokers: string[]

  private constructor(clientId: string, brokers: string[]) {
    this.clientId = clientId
    this.brokers = brokers
  }

  getSettings() {
    return {
      clientId: this.clientId,
      brokers: this.brokers
    }
  }

  static createPPAKSettings() {
    return new KafkaSettings('EMIAS.DN.PDN.A', ['srv-pesu-zk01:2181', 'srv-pesu-zk02:2181', 'srv-pesu-zk03:2181'])
  }

  static createTestSettings() {
    return new KafkaSettings('EMIAS.DN.PDN.A', ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092'])
  }
}

export enum KafkaSettingsEnum {
  TEST = 'тест',
  PPAK = 'ппак'
}