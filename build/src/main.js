"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const main_1 = require("@electron/remote/main");
(0, main_1.initialize)();
const createWindow = () => {
    const window = new electron_1.BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: (0, path_1.join)(__dirname, 'preload.js')
        }
    });
    (0, main_1.enable)(window.webContents);
    window.loadFile((0, path_1.join)(__dirname, '../index.html'));
};
electron_1.app.whenReady().then(() => {
    createWindow();
    console.log(electron_1.app.getAppPath());
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
        console.log(electron_1.app.getAppPath());
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
