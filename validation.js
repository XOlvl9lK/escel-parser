const Logger = require('./logger')

const possibleKeys = [
  'lastName',
  'firstName',
  'middleName',
  'gender',
  'birthDate',
  'policyNumber',
  'diagnoses',
  'pdnStartDate'
]

const possibleGender = [
  'M',
  'm',
  'F',
  'f'
]

const diagnosesRegexp = /\D\d\d\.\d/i

const differenceInKeys = (arr, arrToCompare) => {
  const missingProperties = arr.filter(i => !arrToCompare.includes(i))
  const unexpectedProperties = arrToCompare.filter(i => !arr.includes(i))
  missingProperties.length && Logger.warn(`В исходном файле отсутствуют столбцы: ${missingProperties.join(', ')}`, 'Validation')
  unexpectedProperties.length && Logger.warn(`В исходном файле присутствуют лишние столбцы: ${unexpectedProperties.join(', ')}`, 'Validation')
}

const diagnosesValidation = (diagnoses) => {
  if (diagnoses) {
    const diagnosesArr = diagnoses.split(';')
    for (let diagnose of diagnosesArr) {
      if (diagnose.match(diagnosesRegexp)?.[0]?.length !== diagnose.length) {
        console.log(diagnose.match(diagnosesRegexp))
        Logger.warn(`Не удалось обработать диагноз пациента: ${diagnose}`, 'Validation');
      }
    }
  }
}

module.exports = (obj) => {
  Logger.log(`Валидация сообщения: ${JSON.stringify(obj)}`, 'Validation')
  const keys = Object.keys(obj)
  differenceInKeys(possibleKeys, keys)
  !obj['lastName'] && Logger.warn('Фамилия пациента не указана', 'Validation');
  !obj['firstName'] && Logger.warn('Имя пациента не указана', 'Validation');
  !obj['middleName'] && Logger.warn('Отчество пациента не указана', 'Validation');
  !possibleGender.includes(obj['gender']) && Logger.warn(`Неизвестное значение в столбце gender: ${obj['gender']}`, 'Validation');
  !obj['birthDate'] && Logger.warn('Дата рождения не указана', 'Validation');
  !obj['policyNumber'] && Logger.warn('Полис ОМС не указан', 'Validation');
  !obj['diagnoses'] && Logger.warn('Диагнозы не указаны', 'Validation');
  diagnosesValidation(obj['diagnoses'])
  !obj['pdnStartDate'] && Logger.warn('Дата начала действия ПДН не указана', 'Validation');
  obj.key = obj['policyNumber']
  obj.timestamp = Date.now()
  Logger.log('Валидация сообщения завершена', 'Validation')
}