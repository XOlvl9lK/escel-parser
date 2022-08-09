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
  static readFile(path: string) {
    return readFile(path, { type: 'file' })
  }

  static async convertToJSON(path: string): Promise<ExcelRow[]> {
    const workbook = new ExcelJs.Workbook()
    const worksheet = await workbook.csv.readFile(path)
    const rows: ExcelRow[] = []
    let i = 2
    // @ts-ignore
    while (worksheet.getRow(i).values[1]) {
      // @ts-ignore
      const split = worksheet.getRow(i).values[1].split(';')
      rows.push({
        lastName: split[0],
        firstName: split[1],
        middleName: split[2],
        gender: split[3],
        birthDate: split[4],
        policyNumber: split[5],
        diagnoses: split[6],
        pdnStartDate: split[7]
      })
      i++
    }
    return rows
  }
}
