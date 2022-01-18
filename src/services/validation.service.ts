import {ExcelRow, Row} from "./excel.service";
import {LoggerService, LogLine} from "./logger.service";

export interface ValidatedRow extends Row {
  key?: string;
  timestamp: number;
  diagnoses?: string[]
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
  private dateRegexp = /\d{4}(-)\d{2}(-)\d{2}/i
  private logger = LoggerService.getInstance()
  private errors: string[] = []

  constructor() {}

  validateRow(row: ExcelRow): ValidatedRow {
    this.differenceInKeys(Object.keys(row))
    !row.lastName && this.errors.push('Фамилия пациента не указана')
    !row.firstName && this.errors.push('Имя пациента не указано')
    !this.possibleGender.includes(row.gender || '') && this.errors.push(`Пол не определён: ${row.gender}`)
    !row.birthDate && this.errors.push('Дата рождения не указана')
    row.birthDate && this.dateFormatValidation(row.birthDate)
    !row.policyNumber && this.errors.push('Полис ОМС не указан')
    !row.diagnoses && this.errors.push('Диагнозы не указаны')
    row.diagnoses && this.diagnosesValidation(row.diagnoses)
    !row.pdnStartDate && this.errors.push('Дата начала действия ПДН не передана')
    row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate)

    const validatedRow = {
      ...row,
      diagnoses: this.diagnosesToArray(row.diagnoses || ''),
      key: row.policyNumber,
      timestamp: Date.now()
    }

    this.logger.writeLine(this.convertToLogLine(validatedRow))

    return validatedRow
  }

  anyErrors() {
    return !!this.errors.length
  }

  convertToLogLine(row: ValidatedRow): LogLine {
    const patientData = row.policyNumber || row.lastName + ' ' + row.firstName + ' ' + row.middleName
    if (this.anyErrors()) {
      return LogLine.getUnsuccessfulLine(patientData, this.errors.join('. '))
    } else {
      return LogLine.getSuccessfulLine(patientData)
    }
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

  private dateFormatValidation(date: string) {
    !date.match(this.dateRegexp) && this.errors.push(`Дата рождения. Не соответствует формат данных: ${date}`)
  }

  private diagnosesToArray(diagnoses: string) {
    return diagnoses.split(';')
  }
}