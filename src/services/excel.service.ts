import { readFile, utils } from 'xlsx'

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

  static convertToJSON(path: string): ExcelRow[] {
    const workbook = this.readFile(path)
    const sheetNameList = workbook.SheetNames
    return utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])
  }
}
