import {ExcelRow, Row} from "./excel.service";
import {LoggerService, LogLine} from "./logger.service";

export interface ValidatedRow extends Row {
  key?: string;
  timestamp: number;
  diagnoses?: string[];
  errors: string[]
}

export interface RowForSending {
  patientData: string
  message: string
  errors: string[]
  key?: string
}

export class ValidationService {
  private possibleKeys = [
    'lastName',
    'firstName',
    'middleName',
    'gender',
    'birthDate',
    'policyNumber',
    'diagnoses',
    'pdnStartDate'
  ]
  private possibleGender = [
    'M',
    'm',
    'F',
    'f'
  ]
  private diagnosesRegexp = /\D\d\d\.\d/i
  private dateRegexp = /\d{2}\.\d{2}\.\d{4}/i
  private logger
  private errors: string[] = []

  constructor(pathToLogs: string) {
    this.logger = LoggerService.getInstance(pathToLogs)
  }

  validateRow(row: ExcelRow): ValidatedRow {
    this.differenceInKeys(Object.keys(row))
    !row.lastName && this.errors.push('Фамилия пациента не указана')
    !row.firstName && this.errors.push('Имя пациента не указано')
    !this.possibleGender.includes(row.gender || '') && this.errors.push(`Пол не определён: ${row.gender}`)
    !row.birthDate && this.errors.push('Дата рождения не указана')
    row.birthDate && this.dateFormatValidation(row.birthDate, 'Дата рождения')
    row.birthDate = this.convertDateFormat(row.birthDate)
    !row.policyNumber && this.errors.push('Полис ОМС не указан')
    !row.diagnoses && this.errors.push('Диагнозы не указаны')
    row.diagnoses && this.diagnosesValidation(row.diagnoses)
    !row.pdnStartDate && this.errors.push('Дата начала действия ПДН не передана')
    row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate, 'Дата начала действия ПДН')
    row.pdnStartDate = this.convertDateFormat(row.pdnStartDate)

    const validatedRow = {
      ...row,
      diagnoses: this.diagnosesToArray(row.diagnoses || ''),
      key: row.policyNumber,
      timestamp: Date.now(),
      errors: this.errors
    }

    return validatedRow
  }

  prepareForSending(rows: ValidatedRow[]): RowForSending[] {
    return rows.map(row => {
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
      return {
        patientData,
        message,
        errors: row.errors,
        key: row.policyNumber
      }
    }).filter(row => {
      if (row.errors.length) {
        const logLine = LogLine.getUnsuccessfulLine(row.patientData, row.message, row.errors.join('. '))
        this.logger.writeLine(logLine)
        return false
      } else {
        return true
      }
    })
  }

  private differenceInKeys(keys: string[]) {
    const unexpectedProperties = keys.filter(i => !this.possibleKeys.includes(i))
    unexpectedProperties.length && this.errors.push(`В исходном файле присутствуют лишние столбцы: ${unexpectedProperties.join(', ')}`)
  }

  private diagnosesValidation(diagnoses: string) {
    const diagnosesArr = this.diagnosesToArray(diagnoses)
    for (let diagnose of diagnosesArr) {
      if (diagnose.match(this.diagnosesRegexp)?.[0]?.length !== diagnose.length) {
        this.errors.push(`Не удалось обработать диагноз пациента: ${diagnose}`)
      }
    }
  }

  private dateFormatValidation(date: string, context: string) {
    if (date) {
      const match = date.match(this.dateRegexp)
      if (!match) return this.errors.push(`${context}. Не соответствует формат данных: ${date}`)
      match?.index !== 0 && this.errors.push(`${context}. Не соответствует формат данных: ${date}`)
      return
    }
    return this.errors.push(`${context}. Не соответствует формат данных`)
  }

  private convertDateFormat(date?: string) {
    if (date) {
      if (date?.match(this.dateRegexp)) {
        return date.split('.').reverse().join('-')
      } else {
        return date
      }
    }
  }

  private diagnosesToArray(diagnoses: string) {
    return diagnoses.split(';')
  }
}