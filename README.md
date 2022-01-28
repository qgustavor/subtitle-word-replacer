# Better Anime Subtitles

Formerly "Subtitle Word Replacer". A WebExtension that improves anime subtitles.

## Installing

XPI files can be downloaded [in the releases page](https://github.com/qgustavor/subtitle-word-replacer/releases/).

## How to use

This extension intercepts requests to subtitles and modify them. The main feature of this extension is replacing text. Here is some examples:

* To use fancy quotes replace `/"([^"]+)"/g` with `“$1”`
* To use fancy ellipsis replace `/\.{3}/g` with `…` (or just `...` with `…`)
* To fix [broken characters](https://i.imgur.com/956XIRN.png) replace `/([☆★♡]+)/g` with `{\fnArial Unicode MS}$1{\r}`

This extension also supports changing text scale (just the font size on styles are scaled).

You can also make hidden comments visible. Those are often left in subtitles as notes for the staff and can work as translation notes.

By default this extension also hides the play button and overlay when paused so you can pause the video to read things (like those fast Bakemonogatari texts) without having to wait that huge button to disappear.

## Compatibility

It only works in Firefox, because it's the only browser that supports
[request filtering](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData).

At the moment it only works in [Crunchyroll](https://www.crunchyroll.com/) because is probably the only anime website that use the [Advanced SubStation Alpha](https://en.wikipedia.org/wiki/SubStation_Alpha#Advanced_SubStation_Alpha) subtitle format (other legal websites use WebVTT, pirate websites use hardsub). If you know other website that use ASS and want it to be supported then open an issue.

## Credits

The extension icon was created by [Candy Design](https://www.iconfinder.com/icons/5243667/).
