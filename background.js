/* global browser */

// Handles configuration button
function handleClick () {
  browser.runtime.openOptionsPage()
}

browser.browserAction.onClicked.addListener(handleClick)

// Handles replacement list loading
let replacementList = []

function loadReplacementList () {
  browser.storage.sync.get('replacementList').then(storedSetting => {
    const list = storedSetting.replacementList
    if (!Array.isArray(list)) return

    replacementList = list.map(e => {
      const from = handleExpression(e.from)
      return { from, to: e.to }
    })
  })
}

function handleExpression (e) {
  const regParts = e.match(/^\/(.*?)\/([gim]*)$/)
  if (regParts) return new RegExp(regParts[1], regParts[2])

  const escapedWord = e.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
  return new RegExp('\\b' + escapedWord + '\\b', 'g')
}

browser.storage.onChanged.addListener(loadReplacementList)
loadReplacementList()

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
    // Apply substitutions
    data = replaceAssText(data, text => {
      for (const replacement of replacementList) {
        text = text.replace(replacement.from, replacement.to)
      }
      return text
    })
    filter.write(encoder.encode(data))
    filter.disconnect()
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
      'https://a-vrv.akamaized.net/*.txt*'
    ],
    types
  },
  ['blocking']
)
