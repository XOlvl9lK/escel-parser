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
exports.KafkaSettingsEnum = exports.KafkaSettings = exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const logger_service_1 = require("./logger.service");
class KafkaService {
    constructor(pathToLogs, settings) {
        this.logger = logger_service_1.LoggerService.getInstance(pathToLogs);
        this.kafka = new kafkajs_1.Kafka(settings.getSettings());
        this.producer = this.kafka.producer();
    }
    static getInstance(pathToLogs, settings) {
        if (!KafkaService.instance) {
            KafkaService.instance = new KafkaService(pathToLogs, settings);
        }
        return KafkaService.instance;
    }
    sendMessage(topic, row, key) {
        return __awaiter(this, void 0, void 0, function* () {
            const patientData = row.policyNumber || row.lastName + ' ' + row.firstName + ' ' + row.middleName;
            const message = JSON.stringify({
                lastName: row.lastName,
                firstName: row.firstName,
                middleName: row.middleName,
                gender: row.gender,
                birthDate: row.birthDate,
                policyNumber: row.policyNumber,
                pdnStartDate: row.pdnStartDate
            });
            if (row.errors.length) {
                const logLine = logger_service_1.LogLine.getUnsuccessfulLine(patientData, message, row.errors.join('. '));
                this.logger.writeLine(logLine);
                return;
            }
            try {
                yield this.producer.connect();
                yield this.producer.send({
                    topic,
                    messages: [
                        { value: message, key }
                    ]
                });
                const logLine = logger_service_1.LogLine.getSuccessfulLine(patientData, message);
                this.logger.writeLine(logLine);
            }
            catch (e) {
                const logLine = logger_service_1.LogLine.getUnsuccessfulLine(patientData, JSON.stringify(message), 'Техническая ошибка при отправке сообщения' + ' ' + ((e === null || e === void 0 ? void 0 : e.message) || '') + ' ' + ((e === null || e === void 0 ? void 0 : e.stack) || ''));
                this.logger.writeLine(logLine);
            }
        });
    }
}
exports.KafkaService = KafkaService;
class KafkaSettings {
    constructor(clientId, brokers) {
        this.clientId = clientId;
        this.brokers = brokers;
    }
    getSettings() {
        return {
            clientId: this.clientId,
            brokers: this.brokers
        };
    }
    static createProdSettings() {
        return new KafkaSettings('PROD', ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092']);
    }
    static createPreProdSettings() {
        return new KafkaSettings('EMIAS.DN.DNPDN', ['10.2.172.24:9092', '10.2.172.25:9092', '10.2.172.26:9092']);
    }
}
exports.KafkaSettings = KafkaSettings;
var KafkaSettingsEnum;
(function (KafkaSettingsEnum) {
    KafkaSettingsEnum["PROD"] = "\u043F\u0440\u043E\u0434";
    KafkaSettingsEnum["PREPROD"] = "\u043F\u0440\u0435\u043F\u0440\u043E\u0434";
})(KafkaSettingsEnum = exports.KafkaSettingsEnum || (exports.KafkaSettingsEnum = {}));
