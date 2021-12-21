const exec = require('child_process').exec;

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('input')
  input.addEventListener('change', (event) => {
    console.log(input.files[0].path)
    const path = document.getElementById('path')
    if (input.files[0].path) path.innerText = 'Путь до файла: ' + input.files[0].path
  })

  const button = document.getElementById('ping')
  button.addEventListener('click', () => {
    exec('ping yandex.ru', function (error, stdout, stderr) {
      const other = document.getElementById('other')
      other.innerText = `${error} - ${stdout} - ${stderr}`
    })
  })
})