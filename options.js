/* global browser */

const replacementListElement = document.querySelector('#replacement-list')
let replacementList = []

function addNewReplacement (e) {
  replacementList.push({
    from: document.querySelector('#from').value,
    to: document.querySelector('#to').value
  })
  renderReplacementList()
  browser.storage.sync.set({ replacementList })
  e.preventDefault()
}

function removeReplacement (entry) {
  replacementList.splice(replacementList.indexOf(entry), 1)
  renderReplacementList()
  browser.storage.sync.set({ replacementList })
}

async function loadReplacementList () {
  const storedSetting = await browser.storage.sync.get('replacementList')
  const list = storedSetting.replacementList
  if (Array.isArray(list)) replacementList = list

  renderReplacementList()
}

function renderReplacementList () {
  replacementListElement.innerHTML = ''

  for (const entry of replacementList) {
    const liWrapper = document.createElement('li')
    const fromEl = document.createElement('strong')
    fromEl.textContent = entry.from
    const toEl = document.createElement('strong')
    toEl.textContent = entry.to
    const removeEl = document.createElement('button')
    removeEl.textContent = 'Remove replacement'
    removeEl.addEventListener('click', e => {
      removeReplacement(entry)
      e.preventDefault()
    })
    liWrapper.appendChild(fromEl)
    liWrapper.appendChild(document.createTextNode(' ⇒ '))
    liWrapper.appendChild(toEl)
    liWrapper.appendChild(document.createTextNode(' '))
    liWrapper.appendChild(removeEl)
    replacementListElement.appendChild(liWrapper)
  }
}

document.addEventListener('DOMContentLoaded', loadReplacementList)
document.querySelector('form').addEventListener('submit', addNewReplacement)
