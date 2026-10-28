# Changelog

## [0.1.0] - 2026-10-28

Initial release of Midnight Neon, a fork of Synthwave '84 (0.1.20) by Robb Owen with the colour scheme from Cyber 77 by Code Reviewer 14.

### Changed from Synthwave '84

- Colour scheme from Cyber 77: near-black navy background with pastel neon syntax colours.
- Fixed a rule without a scope that turned the default editor text green.
- UI colours tuned for the dark background: brighter line numbers, cyan find-match highlight and border, visible focus border, button hover, quick-open match highlight, peek view, suggest widget, tab bar, active indent guide.
- Terminal ANSI colours matched to the theme palette.
- Syntax tweaks: neutral punctuation and variables in JSX, Markdown headings/lists/quotes/links, diff colours, Go `func` and Rust `fn` keywords.
- Neon Dreams glow colours and editor chrome (tab and badge accents) updated to the new palette.
- Commands renamed to `Midnight Neon : Enable Neon Dreams` / `Disable Neon Dreams`; settings renamed to `midnightNeon.brightness` and `midnightNeon.disableGlow`.
- The glow now uses its own script file and markers, so it no longer conflicts with Synthwave '84 when both are installed.
- Enabling and then disabling the glow now leaves VS Code's workbench file exactly as it was.
- Removed the legacy Custom CSS files.
- New icon, banner and screenshot.

### Credits

Based on [Synthwave '84](https://github.com/robb0wen/synthwave-vscode) and [Cyber 77](https://github.com/CodeReviewer14/Cyber-77-Synthwave-VSCode), both MIT licensed.
