import {ExcelService} from "./services/excel.service";
import {ValidationService} from "./services/validation.service";
import { KafkaService, KafkaSettings, KafkaSettingsEnum } from "./services/kafka.service";
import { app, dialog } from '@electron/remote'
import {LogsPath} from "./services/logger.service";

window.addEventListener('DOMContentLoaded', () => {
  let path = ''
  let disabled = true
  let settings = KafkaSettings.createPPAKSettings()
  const pathObject = new LogsPath(app.getAppPath())

  const input = document.querySelector('#field__file-2') as HTMLInputElement
  const labelForInput = document.querySelector('.field__file-fake') as HTMLLabelElement
  const warning = document.querySelector('.warning') as HTMLDivElement
  const button = document.getElementById('json') as HTMLButtonElement
  const changeButton = document.querySelector('#change-logs-path') as HTMLButtonElement
  const pathToLogs = document.querySelector('#path-to-logs') as HTMLParagraphElement
  const settingsSelect = document.querySelector('#settings') as HTMLSelectElement

  pathToLogs.innerText = pathObject.getPath()
  const initialText = labelForInput?.innerText

  settingsSelect.addEventListener('change', (e: Event) => {
    const value = (e?.target as HTMLSelectElement).value as KafkaSettingsEnum
    switch (value) {
      case KafkaSettingsEnum.PPAK:
        settings = KafkaSettings.createPPAKSettings()
        break
      case KafkaSettingsEnum.TEST:
        settings = KafkaSettings.createTestSettings()
        break
      default:
        break
    }
  })

  changeButton.addEventListener('click', () => {
    dialog.showOpenDialog({
      title: 'Выберите папку',
      properties: ['openDirectory']
    }).then((folderPath) => {
      pathObject.changePath(folderPath.filePaths[0])
      pathToLogs.innerText = pathObject.getPath()
    })
  })

  input?.addEventListener('change', () => {
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
      }
    } else {
      labelForInput.innerText = initialText
    }
  })


  button.addEventListener('click', async () => {
    console.log(settings.getSettings())
    if (!disabled) {
      const messagesArr = ExcelService.convertToJSON(path)
      messagesArr.forEach(row => {
        const validation = new ValidationService(pathObject.getPath())
        const validatedRow = validation.validateRow(row)
        KafkaService.getInstance(
          pathObject.getPath(),
          settings
        ).sendMessage('dnPatient', validatedRow, validatedRow.key || '')
      })
    }
  })
})