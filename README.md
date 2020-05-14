# Subtitle Word Replacer

A WebExtension that replaces words and expressions in subtitles.

![Screenshot of how the WebExtension works.](https://i.imgur.com/xBS3uix.png)

## Installing

XPI files can be downloaded [in the releases page](https://github.com/qgustavor/subtitle-word-replacer/releases/).

## How it works

It intercepts requests to the subtitle and replaces the expressions. This step is almost
the same thing as the stream filter example in MDN web docs.

To allow replacing text with formatting it and even between lines it does the following steps:

* All formatting tokens are replaced with null characters;
* Replacements are applied using [String.prototype.replace](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace);
* Null characters are replaced back with the original formatting tokens.

When using regular expressions be sure to not remove nor add null characters. If that happens the
entire replacement operation will be stopped and the original subtitle will be used.

## Regular Expression Examples

* To use fancy quotes replace `/"([^"]+)"/g` with `“$1”`
* To use fancy ellipsis replace `/\.{3}/g` with `…` (or just `...` with `…`)
* To fix [broken characters](https://i.imgur.com/956XIRN.png) replace `/([☆★♡]+)/g` with `{\fnArial Unicode MS}$1{\r}`

## Compatibility

It only works in Firefox, because it's the only browser that supports
[request filtering](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData),
and at the moment it only works in [Crunchyroll](https://www.crunchyroll.com/).

If you want other websites to be supported please send a pull request.

## Credits

Tower of God, as shown in the screenshot, is a work of Lee Jong-hui / SIU, Crunchyroll, and Webtoon.
The screenshot is used just to show how the extension works.

The extension icon was created by [Candy Design](https://www.iconfinder.com/icons/5243667/).
