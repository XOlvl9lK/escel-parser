"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsPath = exports.LoggerService = exports.LogLine = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const os_1 = require("os");
class LogLine {
    constructor(status, patientData, date, message, errors) {
        this.status = status;
        this.patientData = patientData;
        this.date = date;
        this.message = message;
        this.errors = errors;
    }
    static getSuccessfulLine(patientData, message) {
        return new LogLine('Отправлено в ЕСУ', patientData, new Date, message);
    }
    static getUnsuccessfulLine(patientData, message, errors) {
        return new LogLine('Не отправлено в ЕСУ', patientData, new Date(), message, errors);
    }
}
exports.LogLine = LogLine;
class LoggerService {
    constructor(pathToLogs) {
        this.pathToFile = pathToLogs;
        if (!(0, fs_1.existsSync)(this.pathToFile)) {
            const firstLine = 'Статус;Данные Пациента;Причина ошибки;Запись;Дата и время записи';
            (0, fs_1.writeFileSync)(this.pathToFile, firstLine);
        }
    }
    static getInstance(pathToLogs) {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService(pathToLogs);
        }
        return LoggerService.instance;
    }
    writeLine(line) {
        (0, fs_1.appendFileSync)(this.pathToFile, `${os_1.EOL}${line.status};${line.patientData};${line.errors || ''};${line.message};${line.date.toISOString()}`);
    }
}
exports.LoggerService = LoggerService;
class LogsPath {
    constructor(path) {
        this.pathToConfig = (0, path_1.join)(__dirname, 'config.txt');
        this.slash = process.platform === 'linux' || process.platform === 'darwin' ? '/' : '\\';
        if (!(0, fs_1.existsSync)(this.pathToConfig)) {
            (0, fs_1.writeFileSync)(this.pathToConfig, path + this.slash + 'logs.csv');
        }
        this.pathToLogs = path + 'logs.csv';
    }
    changePath(path) {
        (0, fs_1.unlinkSync)(this.pathToConfig);
        (0, fs_1.writeFileSync)(this.pathToConfig, path + this.slash + 'logs.csv');
    }
    getPath() {
        return (0, fs_1.readFileSync)(this.pathToConfig, 'utf8');
    }
}
exports.LogsPath = LogsPath;
