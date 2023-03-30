import { ExcelRowV1, Row, ExcelRowV2 } from './excel.service';
import { LoggerService, LogLine } from './logger.service';
import { v4 as uuidv4 } from 'uuid';

export interface Validator {
  validateRow: (row: any) => ValidatedRow
  prepareForSending: (rows: ValidatedRow[]) => RowForSending[]
}

export interface ValidatedRow extends Row {
  key?: string;
  timestamp: number;
  diagnoses?: string
  errors: string[]
  fileId: string
}

export interface RowForSending {
  patientData: string
  message: string
  errors: string[]
  key?: string
  fileId: string
}

class ValidationServiceBase {
  protected logger
  protected dateRegexp = /\d{2}\.\d{2}\.\d{4}/i
  protected fileId = uuidv4()

  constructor() {
    this.logger = LoggerService.getInstance()
  }

  protected dateFormatValidation(date: string | number, context: string, errors: string[]) {
    const dateString = date + ''
    if (date) {
      const match = dateString.match(this.dateRegexp)
      if (!match) return errors.push(`${context}. Не соответствует формат данных: ${dateString}`)
      match?.index !== 0 && errors.push(`${context}. Не соответствует формат данных: ${dateString}`)
      return
    }
    return errors.push(`${context}. Не соответствует формат данных`)
  }

  protected convertDateFormat(date?: string | number) {
    if (date) {
      const dateSting = date + ''
      if (dateSting?.match(this.dateRegexp)) {
        return dateSting.split('.').reverse().join('-')
      } else {
        return date + ''
      }
    }
  }
}

export class ValidationServiceV1 extends ValidationServiceBase implements Validator {
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


  constructor() {
    super()
  }

  validateRow(row: ExcelRowV1): ValidatedRow {
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
    !row.pdnStartDate && errors.push('Дата начала действия ПДН не передана')
    row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate, 'Дата начала действия ПДН', errors)
    row.pdnStartDate = this.convertDateFormat(row.pdnStartDate)

    return {
      ...row,
      key: row.policyNumber,
      timestamp: Date.now(),
      errors: errors,
      fileId: this.fileId
    }
  }

  prepareForSending(rows: ValidatedRow[]): RowForSending[] {
    return rows.map(r => {
      const patientData = r.policyNumber || r.lastName + ' ' + r.firstName + ' ' + r.middleName
      const message = JSON.stringify({
        lastName: r.lastName,
        firstName: r.firstName,
        middleName: r.middleName,
        gender: r.gender,
        birthDate: r.birthDate,
        policyNumber: String(r.policyNumber),
        pdnStartDate: r.pdnStartDate,
        diagnoses: r.diagnoses,
        fileId: r.fileId
      })
      return {
        patientData,
        message,
        errors: r.errors,
        key: String(r.policyNumber),
        fileId: r.fileId
      }
    }).filter(r => {
      if (r.errors.length) {
        const logLine = LogLine.getUnsuccessfulLine(r.fileId, r.patientData, r.message, r.errors.join('. '))
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
}

export class ValidationServiceV2 extends ValidationServiceBase implements Validator {
  constructor() {
    super()
  }

  validateRow(row: ExcelRowV2): ValidatedRow {
    const errors: string[] = []
    !row.emiasId && errors.push('ИД пациента не указан')
    !row.pdnStartDate && errors.push('Дата начала действия ПДН не передана')
    row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate, 'Дата начала действия ПДН', errors)
    row.pdnStartDate = this.convertDateFormat(row.pdnStartDate)

    return {
      ...row,
      key: row.emiasId,
      timestamp: Date.now(),
      errors: errors,
      fileId: this.fileId
    }
  }

  prepareForSending(rows: ValidatedRow[]): RowForSending[] {
    return rows.map(r => {
      const message = JSON.stringify({
        emiasId: String(r.emiasId),
        pdnStartDate: r.pdnStartDate,
        fileId: r.fileId
      })
      return {
        patientData: r.emiasId!,
        message,
        errors: r.errors,
        key: String(r.emiasId),
        fileId: r.fileId
      }
    }).filter(r => {
      if (r.errors.length) {
        const logLine = LogLine.getUnsuccessfulLine(r.fileId, r.patientData, r.message, r.errors.join('. '))
        this.logger.writeLine(logLine)
        return false
      } else {
        return true
      }
    })
  }
}
