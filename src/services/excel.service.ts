import { readFile, utils } from 'xlsx'
import * as ExcelJs from 'exceljs'

export interface Row {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  gender?: 'M' | 'm' | 'F' | 'f';
  birthDate?: string;
  policyNumber?: string;
  pdnStartDate?: string;
}

export interface ExcelRow extends Row {
  diagnoses?: string;
}

export class ExcelService {

  static async convertToJSON(path: string): Promise<ExcelRow[]> {
    const worksheet = await ExcelService.readFile(path)

    const rows: ExcelRow[] = []
    let i = 2
    // @ts-ignore
    while (worksheet.getRow(i).values.length) {
      const rowValues = worksheet.getRow(i).values as any as Array<any>
      rows.push({
        lastName: rowValues[1],
        firstName: rowValues[2],
        middleName: rowValues[3],
        gender: rowValues[4],
        birthDate: rowValues[5],
        policyNumber: rowValues[6],
        diagnoses: rowValues[7],
        pdnStartDate: rowValues[8]
      })
      i++
    }

    return rows
  }

  private static async readFile(path: string) {
    const format = path.split('.')[1]
    const workbook = new ExcelJs.Workbook()
    let worksheet
    if (format === 'csv') {
      worksheet = await workbook.csv.readFile(path, { parserOptions: { delimiter: ';', encoding: 'utf8' }})
    } else {
      await workbook.xlsx.readFile(path)
      worksheet = workbook.getWorksheet('Лист1')
    }
    return worksheet
  }
}
