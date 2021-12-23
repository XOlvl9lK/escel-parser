const xlsx = require('xlsx')
const Logger = require('./logger')
const sendMessageToKafka = require('./kafka')
const validateMessage = require('./validation')


window.addEventListener('DOMContentLoaded', () => {
  let path = ''
  let disabled = true

  const input = document.querySelector('#field__file-2')
  const labelForInput = document.querySelector('.field__file-fake')
  const warning = document.querySelector('.warning')
  const initialText = labelForInput.innerText

  input.addEventListener('change', () => {
    if (input?.files?.[0]?.path) {
      path = input.files[0].path
      let pathArr
      if (process.platform === 'linux' || process.platform === 'darwin') {
        pathArr = input.files[0].path.split('/')
      } else {
        pathArr = input.files[0].path.split('\\')
      }
      const fileName = pathArr[pathArr.length - 1]
      labelForInput.innerText = fileName
      if (fileName?.split('.')?.[1] === 'xls' || fileName?.split('.')?.[1] === 'xlsx') {
        disabled = false
        warning.innerText = ''
      } else {
        disabled = true
        warning.innerText = 'Расширение файла должно быть xls или xlsx'
        Logger.warn('Расширение файла должно быть xls или xlsx', 'FileInput')
      }
    } else {
      labelForInput.innerText = initialText
    }
  })

  const button = document.getElementById('json')
  button.addEventListener('click', async () => {
    if (!disabled) {
      const workbook = xlsx.readFile(path, { type: "file" })
      const sheet_name_list = workbook.SheetNames

      const messagesArr = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]])
      for (let message of messagesArr) {
        validateMessage(message)
      }

      Logger.log('Отправка сообщений')
      await Promise.all(messagesArr.map(message => sendMessageToKafka(JSON.stringify(message), message.key)))
      Logger.log('Отправка сообщений завершена')
    }
  })
})