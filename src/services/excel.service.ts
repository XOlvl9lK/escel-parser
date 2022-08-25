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
      const split = worksheet.getRow(i).values as any as Array<any>
      rows.push({
        lastName: split[1],
        firstName: split[2],
        middleName: split[3],
        gender: split[4],
        birthDate: split[5],
        policyNumber: split[6],
        diagnoses: split[7],
        pdnStartDate: split[8]
      })
      i++
    }
    return rows
  }
}
