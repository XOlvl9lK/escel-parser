import * as ExcelJs from 'exceljs'

export interface Row {
  lastName?: string;
  firstName?: string;
  middleName?: string;
  gender?: 'M' | 'm' | 'F' | 'f';
  birthDate?: string;
  policyNumber?: string;
  pdnStartDate?: string;
  emiasId?: string
}

export interface ExcelRowV1 extends Row {
  diagnoses?: string;
}

export interface Converter {
  convertToJSON: () => any[]
}

export class ExcelServiceV1 implements Converter {
  private worksheet: ExcelJs.Worksheet

  constructor(worksheet: ExcelJs.Worksheet) {
    this.worksheet = worksheet
  }

  convertToJSON(): ExcelRowV1[] {
    const rows: ExcelRowV1[] = []
    let i = 2
    // @ts-ignore
    while (this.worksheet.getRow(i).values.length) {
      const rowValues = this.worksheet.getRow(i).values as any as Array<any>
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
}

export interface ExcelRowV2 extends Row {
}

export class ExcelServiceV2 implements Converter {
  private worksheet: ExcelJs.Worksheet

  constructor(worksheet: ExcelJs.Worksheet) {
    this.worksheet = worksheet
  }

  convertToJSON(): ExcelRowV2[] {
    const rows: ExcelRowV2[] = []
    let i = 2
    // @ts-ignore
    while (this.worksheet.getRow(i).values.length) {
      const rowValues = this.worksheet.getRow(i).values as any as Array<any>
      rows.push({
        emiasId: rowValues[1],
        pdnStartDate: rowValues[2],
      })
      i++
    }

    return rows
  }
}
