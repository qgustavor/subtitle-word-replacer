/* global browser */

const newReplacementForm = document.querySelector('#new-replacement')
const replacementListElement = document.querySelector('#replacement-list')
const exampleReplacementsElement = document.querySelector('#example-replacements')
const textScaleElement = document.querySelector('#textScale')
const hidePausedOverlayElement = document.querySelector('#hidePausedOverlay')
const hiddenNotePatternElement = document.querySelector('#hiddenNotePattern')
const fromElement = document.querySelector('#from')
const toElement = document.querySelector('#to')

let replacementList = []
let textScale = 1
let hiddenNotePattern = '[NOTE: %]'
let hidePausedOverlay = true

function addNewReplacement (e) {
  replacementList.push({
    from: fromElement.value,
    to: toElement.value
  })
  updateSettingsView()
  browser.storage.sync.set({ replacementList })
  e.preventDefault()
}

function removeReplacement (entry) {
  replacementList.splice(replacementList.indexOf(entry), 1)
  updateSettingsView()
  browser.storage.sync.set({ replacementList })
}

function updateTextScale () {
  textScale = Math.round(textScaleElement.value / 100)
  browser.storage.sync.set({ textScale })
}

function updateHiddenNotePattern () {
  hiddenNotePattern = hiddenNotePatternElement.value
  browser.storage.sync.set({ hiddenNotePattern })
}

function updateHidePausedOverlay () {
  hidePausedOverlay = hidePausedOverlayElement.checked
  browser.storage.sync.set({ hidePausedOverlay })
}

async function loadSettings () {
  const settings = await browser.storage.sync.get({
    replacementList: [],
    textScale: 1,
    hiddenNotePattern: '[NOTE: %]',
    hidePausedOverlay: true
  })
  ;({ replacementList, textScale, hiddenNotePattern, hidePausedOverlay } = settings)

  updateSettingsView()
}

function updateSettingsView () {
  replacementListElement.innerHTML = ''

  for (const entry of replacementList) {
    const liWrapper = document.createElement('li')
    const fromEl = document.createElement('strong')
    fromEl.textContent = entry.from
    const toEl = document.createElement('strong')
    toEl.textContent = entry.to
    const removeEl = document.createElement('button')
    removeEl.textContent = 'Remove'
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
  
  if (!replacementList.length) {
    const emptyLi = document.createElement('li')
    emptyLi.textContent = 'No replacement set up'
    replacementListElement.appendChild(emptyLi)
  }

  textScaleElement.value = textScale * 100
  hiddenNotePatternElement.value = hiddenNotePattern
  hidePausedOverlayElement.checked = hidePausedOverlay
}

document.addEventListener('DOMContentLoaded', loadSettings)
newReplacementForm.addEventListener('submit', addNewReplacement)
textScaleElement.addEventListener('change', updateTextScale)
hiddenNotePatternElement.addEventListener('change', updateHiddenNotePattern)
hidePausedOverlayElement.addEventListener('change', updateHidePausedOverlay)

exampleReplacementsElement.addEventListener('click', evt => {
  const liEl = evt.target.closest('li')
  if (!liEl) return
  evt.preventDefault()
  const codeElements = liEl.querySelectorAll('code')
  fromElement.value = codeElements[0].textContent
  toElement.value = codeElements[1].textContent
})
