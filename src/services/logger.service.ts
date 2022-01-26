import {join} from "path";
import {appendFileSync, existsSync, readFileSync, unlinkSync, writeFileSync} from 'fs'
import {EOL} from 'os'

export class LogLine {
  status: string;
  patientData: string;
  errors?: string;
  message: string;
  date: Date;

  private constructor(status: string, patientData: string, date: Date, message: string, errors?: string) {
    this.status = status
    this.patientData = patientData
    this.date = date
    this.message = message
    this.errors = errors
  }

  static getSuccessfulLine(patientData: string, message: string) {
    return new LogLine('Отправлено в ЕСУ', patientData, new Date, message)
  }

  static getUnsuccessfulLine(patientData: string, message: string, errors?: string) {
    return new LogLine('Не отправлено в ЕСУ', patientData, new Date(), message, errors)
  }
}

export class LoggerService {
  private static instance: LoggerService
  private readonly pathToFile: string

  private constructor(pathToLogs: string) {
    this.pathToFile = pathToLogs
    if (!existsSync(this.pathToFile)) {
      const firstLine = 'Статус;Данные Пациента;Причина ошибки;Запись;Дата и время записи'
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
    appendFileSync(this.pathToFile, `${EOL}${line.status};${line.patientData};${line.errors || ''};${line.message};${line.date.toISOString()}`)
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