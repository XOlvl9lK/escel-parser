import * as ExcelJs from 'exceljs'
import { Converter, ExcelServiceV1, ExcelServiceV2 } from './excel.service';
import { Validator, ValidationServiceV1, ValidationServiceV2 } from './validation.service';
import { TopicType } from './kafka.service';

type FileFormat = 'V1' | 'V2'

export interface ConverterConstructor {
  new (worksheet: ExcelJs.Worksheet): Converter
}

export class Factory {
  private fileFormat: FileFormat
  private readonly path: string

  constructor(path: string) {
    this.path = path
  }

  async decideWhatFormatIs(onError: (message: string) => void) {
    const workbook = new ExcelJs.Workbook()
    await workbook.xlsx.readFile(this.path)
    const worksheet = workbook.getWorksheet('Лист1')
    const firstRow = worksheet.getRow(1).values as any as Array<any>
    if (firstRow[1] === 'lastName') {
      this.fileFormat = 'V1'
    } else if (firstRow[1] === 'emiasId') {
      this.fileFormat = 'V2'
    } else {
      onError('Unknown format')
    }
    return worksheet
  }

  async getInstances(onError: (message: string) => void): Promise<{ converter: Converter, validator: Validator, topic: TopicType }> {
    const worksheet = await this.decideWhatFormatIs(onError)
    if (this.fileFormat === 'V1') {
      return {
        validator: new ValidationServiceV1(),
        converter: this.createConverter(ExcelServiceV1, worksheet),
        topic: 'dnPatient'
      }
    } else {
      return {
        validator: new ValidationServiceV2(),
        converter: this.createConverter(ExcelServiceV2, worksheet),
        topic: 'dnPatientV2'
      }
    }
  }

  private createConverter(converterConstructor: ConverterConstructor, worksheet: ExcelJs.Worksheet): Converter {
    return new converterConstructor(worksheet)
  }
}