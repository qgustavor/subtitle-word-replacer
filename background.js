/* global browser */

// Handles configuration button
function handleClick () {
  browser.runtime.openOptionsPage()
}

browser.browserAction.onClicked.addListener(handleClick)

// Settings
let replacementList = []
let textScale = 1
let hiddenNotePattern = '[NOTE: %]'
let hidePausedOverlay = true

async function loadSettings () {
  const settings = await browser.storage.sync.get({
    replacementList: [],
    textScale: 1,
    hiddenNotePattern: '[NOTE: %]',
    hidePausedOverlay: true
  })
  ;({ replacementList, textScale, hiddenNotePattern, hidePausedOverlay } = settings)

  replacementList = replacementList.map(e => {
    const from = handleExpression(e.from)
    return { from, to: e.to }
  })
}

function handleExpression (e) {
  const regParts = e.match(/^\/(.*?)\/([gim]*)$/)
  if (regParts) return new RegExp(regParts[1], regParts[2])

  const escapedWord = e.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  return new RegExp('\\b' + escapedWord + '\\b', 'g')
}

browser.storage.onChanged.addListener(loadSettings)
loadSettings()

// Handles actual subtitle replacement
// At the moment only works on Crunchyroll
function crunchyrollSubtitleHandler (details) {
  const filter = browser.webRequest.filterResponseData(details.requestId)
  const decoder = new TextDecoder('utf-8')
  const encoder = new TextEncoder()

  // Load entire subtitle
  let data = ''
  filter.ondata = event => {
    data += decoder.decode(event.data)
  }

  filter.onstop = () => {
    const tlStyleName = 'hidden_note_' + Math.random().toString(36).substr(2)

    // Apply substitutions
    data = replaceAssText(data, text => {
      for (const replacement of replacementList) {
        text = text.replace(replacement.from, replacement.to)
      }
      return text
    }).replace(/^(Style: [^,]+,[^,]+,)(\d+)/gm, (all, prefix, size) => {
      return prefix + (parseFloat(size) * textScale)
    }).replace(/^Style:.*/m, style => {
      if (!hiddenNotePattern) return style

      // Create style for hidden notes
      const parts = style.split(',')
      parts[0] = 'Style: ' + tlStyleName
      parts[2] = (parseFloat(parts[2]) * 0.75).toFixed(0)
      parts[18] = 8

      return style + '\r\n' + parts.join(',')
    }).replace(/^Dialogue:.*\{[^}\\]+\}.*/gm, dialogue => {
      if (!hiddenNotePattern) return dialogue

      const parts = dialogue.split(',')
      const matches = parts
        .slice(9).join(',')
        .match(/\{[^}\\]+\}/g)
      if (!matches) return dialogue

      parts[3] = tlStyleName
      const noteContent = matches.map(e => e.slice(1, -1).trim()).join('; ').trim().replace(/%/g, '%%%%')
      let newText = hiddenNotePattern.replace('%', noteContent)
      if (newText === hiddenNotePattern) newText = hiddenNotePattern + ' ' + noteContent

      const newDialogue = parts.slice(0, 9).concat(newText).join(',')
      return dialogue + '\r\n' + newDialogue
    })

    filter.write(encoder.encode(data))
    filter.disconnect()

    if (hidePausedOverlay) {
      browser.tabs.insertCSS({
        allFrames: true,
        code: '[data-testid="vilos-large_play_pause_button"],#velocity-controls-package>:not([id]){display:none!important}'
      })
    }
  }

  return {}
}

function replaceAssText (source, replacerFn) {
  // Detect all non-dialogue tokens and mark those with null characters
  const lines = source.replace(/\0/g, '').split('\n')
  const nonReplaceableTokens = []
  const replaceableTokens = []
  let nonTextAccumulator = ''

  for (const line of lines) {
    if (!line.startsWith('Dialogue: ')) {
      nonTextAccumulator += line + '\n'
      continue
    }

    const lineParts = line.split(',')
    const nonTextLine = lineParts.slice(0, 9).join(',')
    nonTextAccumulator += nonTextLine + ','
    nonReplaceableTokens.push(nonTextAccumulator)
    nonTextAccumulator = ''

    const dialogueText = lineParts.slice(9).join(',')
    const nonTextTokens = dialogueText.match(/\{.*?\}|\\N/g)
    const textTokens = dialogueText.split(/\{.*?\}|\\N/g)
    if (nonTextTokens) {
      for (const token of textTokens) replaceableTokens.push(token)
      for (const token of nonTextTokens) nonReplaceableTokens.push(token)
    } else {
      replaceableTokens.push(dialogueText)
    }
    replaceableTokens[replaceableTokens.length - 1] += '\n'
  }

  nonReplaceableTokens.push(nonTextAccumulator)
  let replaceableText = '\0' + replaceableTokens.join('\0') + '\0'

  // Replace text with null characters using the replacer function
  replaceableText = replacerFn(replaceableText)

  // Sanity check: return source if user provides a buggy regular expression
  const nullCount = replaceableText.split('\0').length - 1
  if (nullCount !== nonReplaceableTokens.length) {
    console.error('Could not replace text in subtitle: token count changed.')
    return source
  }

  // Place back the non-dialogue tokens
  let replaceIndex = 0
  return replaceableText.replace(/\0/g, () => nonReplaceableTokens[replaceIndex++])
}

// List of all request types the extension works with
const types = 'main_frame media object object_subrequest script sub_frame xmlhttprequest xslt other'.split(/\s/g)

// NOTE: the extension NEEDS permission from the main frame
browser.webRequest.onBeforeRequest.addListener(
  crunchyrollSubtitleHandler,
  {
    urls: [
      'https://v.vrv.co/*.txt*'
    ],
    types
  },
  ['blocking']
)
