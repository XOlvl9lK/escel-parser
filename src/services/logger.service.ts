import {join} from "path";
import {appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs'
import {EOL} from 'os'

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
  private readonly pathToFile: string

  private constructor(pathToLogs: string) {
    this.pathToFile = pathToLogs
    if (!existsSync(this.pathToFile)) {
      const firstLine = 'Статус;Данные Пациента;Текст ошибки;Дата и время записи'
      writeFileSync(this.pathToFile, firstLine)
    }
  }

  static getInstance(pathToLogs: string): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(pathToLogs)
    }
    return LoggerService.instance
  }

  writeLine(line: LogLine) {
    console.log(this.pathToFile)
    appendFileSync(this.pathToFile, `${EOL}${line.status};${line.patientData};${line.errors || ''};${line.date.toISOString()}`)
  }
}

export class LogsPath {
  private pathToLogs: string;
  private readonly pathToConfig: string = join(__dirname, 'config.txt')
  private slash = process.platform === 'linux' || process.platform === 'darwin' ? '/' : '\\'

  constructor(path: string) {
    if (!existsSync(this.pathToConfig)) {
      writeFileSync(this.pathToConfig, path + this.slash + 'logs.csv')
    }
    this.pathToLogs = path + 'logs.csv'
  }

  changePath(path: string) {
    unlinkSync(this.pathToConfig)
    writeFileSync(this.pathToConfig, path + this.slash + 'logs.csv')
  }

  getPath() {
    return readFileSync(this.pathToConfig, 'utf8')
  }
}