import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { initialize, enable } from '@electron/remote/main'

initialize()

const createWindow = () => {
  const window = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    }
  })
  enable(window.webContents)

  //@ts-ignore
  window.openDevTools();

  window.loadFile(join(__dirname, '../index.html'))
}

app.whenReady().then(() => {
  createWindow()

  console.log(app.getAppPath())

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
    console.log(app.getAppPath())
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})