"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const excel_service_1 = require("./services/excel.service");
const validation_service_1 = require("./services/validation.service");
const kafka_service_1 = require("./services/kafka.service");
const remote_1 = require("@electron/remote");
const logger_service_1 = require("./services/logger.service");
window.addEventListener('DOMContentLoaded', () => {
    let path = '';
    let disabled = true;
    let settings = kafka_service_1.KafkaSettings.createPPAKSettings();
    const pathObject = new logger_service_1.LogsPath(remote_1.app.getAppPath());
    const input = document.querySelector('#field__file-2');
    const labelForInput = document.querySelector('.field__file-fake');
    const warning = document.querySelector('.warning');
    const button = document.getElementById('json');
    const changeButton = document.querySelector('#change-logs-path');
    const pathToLogs = document.querySelector('#path-to-logs');
    const settingsSelect = document.querySelector('#settings');
    pathToLogs.innerText = pathObject.getPath();
    const initialText = labelForInput === null || labelForInput === void 0 ? void 0 : labelForInput.innerText;
    settingsSelect.addEventListener('change', (e) => {
        const value = (e === null || e === void 0 ? void 0 : e.target).value;
        switch (value) {
            case kafka_service_1.KafkaSettingsEnum.PPAK:
                settings = kafka_service_1.KafkaSettings.createPPAKSettings();
                break;
            case kafka_service_1.KafkaSettingsEnum.TEST:
                settings = kafka_service_1.KafkaSettings.createTestSettings();
                break;
            default:
                break;
        }
    });
    changeButton.addEventListener('click', () => {
        remote_1.dialog.showOpenDialog({
            title: 'Выберите папку',
            properties: ['openDirectory']
        }).then((folderPath) => {
            pathObject.changePath(folderPath.filePaths[0]);
            pathToLogs.innerText = pathObject.getPath();
        });
    });
    input === null || input === void 0 ? void 0 : input.addEventListener('change', () => {
        var _a, _b, _c, _d;
        if ((_b = (_a = input === null || input === void 0 ? void 0 : input.files) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.path) {
            path = input.files[0].path;
            let pathArr;
            if (process.platform === 'linux' || process.platform === 'darwin') {
                pathArr = input.files[0].path.split('/');
            }
            else {
                pathArr = input.files[0].path.split('\\');
            }
            const fileName = pathArr[pathArr.length - 1];
            labelForInput.innerText = fileName;
            if (((_c = fileName === null || fileName === void 0 ? void 0 : fileName.split('.')) === null || _c === void 0 ? void 0 : _c[1]) === 'xls' || ((_d = fileName === null || fileName === void 0 ? void 0 : fileName.split('.')) === null || _d === void 0 ? void 0 : _d[1]) === 'xlsx') {
                disabled = false;
                warning.innerText = '';
            }
            else {
                disabled = true;
                warning.innerText = 'Расширение файла должно быть xls или xlsx';
            }
        }
        else {
            labelForInput.innerText = initialText;
        }
    });
    button.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log(settings.getSettings());
        if (!disabled) {
            const messagesArr = excel_service_1.ExcelService.convertToJSON(path);
            messagesArr.forEach(row => {
                const validation = new validation_service_1.ValidationService(pathObject.getPath());
                const validatedRow = validation.validateRow(row);
                kafka_service_1.KafkaService.getInstance(pathObject.getPath(), settings).sendMessage('dnPatient', validatedRow, validatedRow.key || '');
            });
        }
    }));
});
