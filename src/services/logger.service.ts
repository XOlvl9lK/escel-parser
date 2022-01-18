import path from "path";
import { writeFileSync, existsSync, appendFileSync } from 'fs'
import { EOL } from 'os'

export class LogLine {
  status: 'Запись обработана успешно' | 'Запись не обработана';
  patientData: string;
  errors?: string;
  date: Date;

  private constructor(status: 'Запись обработана успешно' | 'Запись не обработана', patientData: string, date: Date, errors?: string) {
    this.status = status
    this.patientData = patientData
    this.date = date
    this.errors = errors
  }

  static getSuccessfulLine(patientData: string) {
    return new LogLine('Запись обработана успешно', patientData, new Date)
  }

  static getUnsuccessfulLine(patientData: string, errors?: string) {
    return new LogLine('Запись не обработана', patientData, new Date(), errors)
  }
}

export class LoggerService {
  private static instance: LoggerService
  private pathToFile = path.join(__dirname, 'logs.csv')

  private constructor() {
    if (!existsSync(this.pathToFile)) {
      const firstLine = 'Статус;Данные Пациента;Текст ошибки;Дата и время записи'
      writeFileSync(this.pathToFile, firstLine)
    }
  }

  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService()
    }
    return LoggerService.instance
  }

  writeLine(line: LogLine) {
    appendFileSync(this.pathToFile, `${EOL}${line.status};${line.patientData};${line.errors || ''};${line.date.toISOString()}`)
  }
}