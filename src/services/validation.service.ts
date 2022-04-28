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

  constructor(pathToLogs: string) {
    this.logger = LoggerService.getInstance(pathToLogs)
  }

  validateRow(row: ExcelRow): ValidatedRow {
    const errors: string[] = []
    this.differenceInKeys(Object.keys(row), errors)
    !row.lastName && errors.push('Фамилия пациента не указана')
    !row.firstName && errors.push('Имя пациента не указано')
    if (!this.possibleGender.includes(row.gender || '')) {
      errors.push(`Пол не определён: ${row.gender}`)
    }
    !row.birthDate && errors.push('Дата рождения не указана')
    row.birthDate && this.dateFormatValidation(row.birthDate, 'Дата рождения', errors)
    row.birthDate = this.convertDateFormat(row.birthDate)
    !row.policyNumber && errors.push('Полис ОМС не указан')
    !row.diagnoses && errors.push('Диагнозы не указаны')
    row.diagnoses && this.diagnosesValidation(row.diagnoses, errors)
    !row.pdnStartDate && errors.push('Дата начала действия ПДН не передана')
    row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate, 'Дата начала действия ПДН', errors)
    row.pdnStartDate = this.convertDateFormat(row.pdnStartDate)

    const validatedRow = {
      ...row,
      diagnoses: this.diagnosesToArray(row.diagnoses || ''),
      key: row.policyNumber,
      timestamp: Date.now(),
      errors: errors
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

  private differenceInKeys(keys: string[], errors: string[]) {
    const unexpectedProperties = keys.filter(i => !this.possibleKeys.includes(i))
    unexpectedProperties.length && errors.push(`В исходном файле присутствуют лишние столбцы: ${unexpectedProperties.join(', ')}`)
  }

  private diagnosesValidation(diagnoses: string, errors: string[]) {
    const diagnosesArr = this.diagnosesToArray(diagnoses)
    for (let diagnose of diagnosesArr) {
      if (diagnose.match(this.diagnosesRegexp)?.[0]?.length !== diagnose.length) {
        errors.push(`Не удалось обработать диагноз пациента: ${diagnose}`)
      }
    }
  }

  private dateFormatValidation(date: string | number, context: string, errors: string[]) {
    const dateString = date + ''
    if (date) {
      const match = dateString.match(this.dateRegexp)
      if (!match) return errors.push(`${context}. Не соответствует формат данных: ${dateString}`)
      match?.index !== 0 && errors.push(`${context}. Не соответствует формат данных: ${dateString}`)
      return
    }
    return errors.push(`${context}. Не соответствует формат данных`)
  }

  private convertDateFormat(date?: string | number) {
    if (date) {
      const dateSting = date + ''
      if (dateSting?.match(this.dateRegexp)) {
        return dateSting.split('.').reverse().join('-')
      } else {
        return date + ''
      }
    }
  }

  private diagnosesToArray(diagnoses: string) {
    return diagnoses.split(';')
  }
}