const exec = require('child_process').exec;
const xlsx = require('xlsx')


window.addEventListener('DOMContentLoaded', () => {
  let path = '';
  let disabled = true;

  const input = document.querySelector('#field__file-2')
  const labelForInput = document.querySelector('.field__file-fake')
  const warning = document.querySelector('.warning')
  const initialText = labelForInput.innerText

  input.addEventListener('change', (event) => {
    if (input?.files?.[0]?.path) {
      path = input.files[0].path
      const pathArr = input.files[0].path.split('\\')
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

  const button = document.getElementById('json')
  button.addEventListener('click', () => {
    if (!disabled) {
      const workbook = xlsx.readFile(path, { type: "file" })
      let sheet_name_list = workbook.SheetNames;
      console.log(xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]))
    }
  })
})