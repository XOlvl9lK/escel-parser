import yargs, { Arguments } from "yargs";
import { existsSync } from "fs";
import { ValidationService } from "./services/validation.service";
import { ExcelService } from "./services/excel.service";
import { LogsPath } from "./services/logger.service";
import { KafkaService, KafkaSettings } from "./services/kafka.service";
import { hideBin } from "yargs/helpers";
import { join } from 'path';
//@ts-ignore
require('./services/config.txt')

const CHUNK_SIZE = 4000

async function start() {
  console.log('App started')
  const argv = yargs(hideBin(process.argv)).argv as Arguments<{ path?: string, settings?: string }>
  let path: string | undefined
  let settings: string | undefined
  if (process.platform === 'linux') {
    const [pathArg, settingsArg] = argv._ as string[]
    path = pathArg?.split('=')?.[1]
    settings = settingsArg?.split('=')?.[1]
  } else {
    path = argv.path
    settings = argv.settings
  }
  let kafkaSettings: KafkaSettings
  if (settings && ['test', 'ppak'].includes(settings.toLowerCase())) {
    console.log(`Creating ${settings} settings`)
    kafkaSettings = settings.toLowerCase() === 'test' ? KafkaSettings.createTestSettings() : KafkaSettings.createPPAKSettings()
  } else {
    console.log(`Creating PPAK settings`)
    kafkaSettings = KafkaSettings.createPPAKSettings()
  }

  try {
    if (path) {
      if (!existsSync(path)) {
        console.log('File not found')
        console.log('Exit app')
      } else {

        const validation = new ValidationService()
        const messagesArr = await ExcelService.convertToJSON(path)
        console.log(messagesArr)
        const validatedRows = messagesArr.map(m => validation.validateRow(m))
        const rowsForSending = validation.prepareForSending(validatedRows)
        const kafka = KafkaService.getInstance(
          kafkaSettings
        )
        for (let i = 0; i < rowsForSending.length; i += CHUNK_SIZE) {
          const chunk = rowsForSending.slice(i, i + CHUNK_SIZE)
          await kafka.sendMessage('dnPatient', chunk)
        }

        console.log('Messages sent')
        console.log('Logs available at')
        console.log(join(process.cwd(), 'logs.csv'))
        console.log('Exit app')

      }
    } else {
      console.log('Path not specified')
      console.log('Exit App')
    }
  } catch (e) {
    console.log('App crash')
    console.log(e)
    console.log('Exit App')
  }
}

start()