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
      return {from, to: e.to}
    })
  })
}

function handleExpression (e) {
  const isRegex = e.startsWith('/')
  if (isRegex) {
    const regParts = e.match(/^\/(.*?)\/([gim]*)$/)
    return new RegExp(regParts[1], regParts[2])
  } else {
    const escapedWord = e.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
    return new RegExp('\\b' + escapedWord + '\\b', 'g')
  }
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
    const randId = '@@' + Math.random().toString(36).substring(2) + '@@'
    data = data.replace(/\\N/g, randId)
    for (let replacement of replacementList) {
      data = data.replace(replacement.from, replacement.to)
    }
    data = data.replace(new RegExp(randId, 'g'), '\\N')
    filter.write(encoder.encode(data))
    filter.disconnect()
  }

  return {}
}

// List of all request types the extension works with
const types = 'main_frame media object object_subrequest script sub_frame xmlhttprequest xslt other'.split(/\s/g)

// NOTE: the extension NEEDS permission from the main frame
browser.webRequest.onBeforeRequest.addListener(
  crunchyrollSubtitleHandler,
  {urls: [
    'https://a-vrv.akamaized.net/*.txt*',
  ], types},
  ['blocking']
)
