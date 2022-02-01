"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationService = void 0;
const logger_service_1 = require("./logger.service");
class ValidationService {
    constructor(pathToLogs) {
        this.possibleKeys = [
            'lastName',
            'firstName',
            'middleName',
            'gender',
            'birthDate',
            'policyNumber',
            'diagnoses',
            'pdnStartDate'
        ];
        this.possibleGender = [
            'M',
            'm',
            'F',
            'f'
        ];
        this.diagnosesRegexp = /\D\d\d\.\d/i;
        this.dateRegexp = /\d{2}\.\d{2}\.\d{4}/i;
        this.errors = [];
        this.logger = logger_service_1.LoggerService.getInstance(pathToLogs);
    }
    validateRow(row) {
        this.differenceInKeys(Object.keys(row));
        !row.lastName && this.errors.push('Фамилия пациента не указана');
        !row.firstName && this.errors.push('Имя пациента не указано');
        !this.possibleGender.includes(row.gender || '') && this.errors.push(`Пол не определён: ${row.gender}`);
        !row.birthDate && this.errors.push('Дата рождения не указана');
        row.birthDate && this.dateFormatValidation(row.birthDate, 'Дата рождения');
        row.birthDate = this.convertDateFormat(row.birthDate);
        !row.policyNumber && this.errors.push('Полис ОМС не указан');
        !row.diagnoses && this.errors.push('Диагнозы не указаны');
        row.diagnoses && this.diagnosesValidation(row.diagnoses);
        !row.pdnStartDate && this.errors.push('Дата начала действия ПДН не передана');
        row.pdnStartDate && this.dateFormatValidation(row.pdnStartDate, 'Дата начала действия ПДН');
        row.pdnStartDate = this.convertDateFormat(row.pdnStartDate);
        const validatedRow = Object.assign(Object.assign({}, row), { diagnoses: this.diagnosesToArray(row.diagnoses || ''), key: row.policyNumber, timestamp: Date.now(), errors: this.errors });
        return validatedRow;
    }
    differenceInKeys(keys) {
        const unexpectedProperties = keys.filter(i => !this.possibleKeys.includes(i));
        unexpectedProperties.length && this.errors.push(`В исходном файле присутствуют лишние столбцы: ${unexpectedProperties.join(', ')}`);
    }
    diagnosesValidation(diagnoses) {
        var _a, _b;
        const diagnosesArr = this.diagnosesToArray(diagnoses);
        for (let diagnose of diagnosesArr) {
            if (((_b = (_a = diagnose.match(this.diagnosesRegexp)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.length) !== diagnose.length) {
                this.errors.push(`Не удалось обработать диагноз пациента: ${diagnose}`);
            }
        }
    }
    dateFormatValidation(date, context) {
        const match = date.match(this.dateRegexp);
        if (!match)
            return this.errors.push(`${context}. Не соответствует формат данных: ${date}`);
        (match === null || match === void 0 ? void 0 : match.index) !== 0 && this.errors.push(`${context}. Не соответствует формат данных: ${date}`);
    }
    convertDateFormat(date) {
        if (date) {
            if (date.match(this.dateRegexp)) {
                return date.split('.').reverse().join('-');
            }
            else {
                return date;
            }
        }
    }
    diagnosesToArray(diagnoses) {
        return diagnoses.split(';');
    }
}
exports.ValidationService = ValidationService;
