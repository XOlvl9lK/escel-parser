import { app } from 'electron'
import yargs, { Arguments } from "yargs";
import { existsSync } from "fs";
import { ValidationService } from "./services/validation.service";
import { ExcelService } from "./services/excel.service";
import { LogsPath } from "./services/logger.service";
import { KafkaService, KafkaSettings } from "./services/kafka.service";
import { hideBin } from "yargs/helpers";

app.whenReady().then(async () => {
  console.log('App started')
  const argv = yargs(hideBin(process.argv)).argv as Arguments<{ path?: string, settings?: string }>
  const path = argv.path
  const settings = argv.settings
  let kafkaSettings: KafkaSettings
  if (settings && ['test', 'ppak'].includes(settings.toLowerCase())) {
    console.log(`Creating ${settings} settings`)
    kafkaSettings = settings.toLowerCase() === 'test' ? KafkaSettings.createTestSettings() : KafkaSettings.createPPAKSettings()
  } else {
    console.log(`Creating PPAK settings`)
    kafkaSettings = KafkaSettings.createPPAKSettings()
  }

  if (path) {
    if (!existsSync(path)) {
      console.log('File not found')
      console.log('Exit app')
      app.quit()
    } else {
      console.log('File found')
      const pathObject = new LogsPath(app.getAppPath())
      const chunkSize = 4000
      const validation = new ValidationService(pathObject.getPath())
      const messagesArr = ExcelService.convertToJSON(path)
      const validatedRows = messagesArr.map(m => validation.validateRow(m))
      const rowsForSending = validation.prepareForSending(validatedRows)
      const kafka = KafkaService.getInstance(
        pathObject.getPath(),
        kafkaSettings
      )
      for (let i = 0; i < rowsForSending.length; i += chunkSize) {
        const chunk = rowsForSending.slice(i, i + chunkSize)
        await kafka.sendMessage('dnPatient', chunk)
      }
      console.log('Messages sent')
      console.log('Logs available at')
      console.log(pathObject.getPath())
      console.log('Exit app')
      app.quit()
    }
  } else {
    console.log('Path not specified')
    console.log('Exit app')
    app.quit()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})