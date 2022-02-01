"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelService = void 0;
const xlsx_1 = require("xlsx");
class ExcelService {
    static readFile(path) {
        return (0, xlsx_1.readFile)(path, { type: 'file' });
    }
    static convertToJSON(path) {
        const workbook = this.readFile(path);
        const sheetNameList = workbook.SheetNames;
        return xlsx_1.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    }
}
exports.ExcelService = ExcelService;
