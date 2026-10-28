const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

// Centralise errors & info messages to keep activation code clean
const messages = {
	ACTIVATED: "Neon Dreams enabled. VS code must reload for this change to take effect. Code may display a warning that it is corrupted, this is normal. You can dismiss this message by choosing 'Don't show this again' on the notification.",
	DEACTIVATED: `Neon Dreams disabled. VS code must reload for this change to take effect`,
	REACTIVATED: "Neon dreams is already enabled. Reload to refresh JS settings.",
	NOT_RUNNING: `Neon dreams isn't running.`,
	ERROR_ACCESS_DENIED: "Neon Dreams was unable to modify the core VS code files needed to launch the extension. You may need to run VS code with admin privileges in order to enable Neon Dreams.",
	ERROR_WORKBENCH_NOT_FOUND: "Neon Dreams could not find the workbench HTML file. This is likely due to a change in VS Code's internal structure. Please open an issue at https://github.com/JaeHyeokee/midnight-neon-vscode/issues to report this.",
	ERROR_GENERIC: "Something went wrong when starting neon dreams"
};

const NEON_TAG = '<!-- MIDNIGHT NEON --><script src="midnightneon.js"></script><!-- MIDNIGHT NEON END -->';

function escapeRegExp(s) {
	return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

// Matches the tag line with optional leading tab and one trailing line break (CRLF or LF).
const NEON_TAG_RE = new RegExp('\\t?' + escapeRegExp(NEON_TAG) + '(?:\\r?\\n)?', 'g');

// The exact string inserted into the workbench HTML. Line ending follows the file's own.
function neonInject(html) {
	return '\t' + NEON_TAG + (html.includes('\r\n') ? '\r\n' : '\n');
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	this.extensionName = 'JaeHyeokee.midnight-neon-vscode';
	this.cntx = context;

	const config = vscode.workspace.getConfiguration("midnightNeon");

	let disableGlow = config && config.disableGlow ? !!config.disableGlow : false;

	let brightness = parseFloat(config.brightness) > 1 ? 1 : parseFloat(config.brightness);
	brightness = brightness < 0 ? 0 : brightness;
	brightness = isNaN(brightness) ? 0.45 : brightness;

	const parsedBrightness = Math.floor(brightness * 255).toString(16).toUpperCase();
	let neonBrightness = parsedBrightness;

	let disposable = vscode.commands.registerCommand('midnightNeon.enableNeon', function () {
		const appDir = path.dirname(vscode.env.appRoot);
		const base = path.join(appDir, 'app', 'out', 'vs', 'code');

		const workbenchPaths = resolveWorkbenchPaths(base);
		if (!workbenchPaths) {
			vscode.window.showErrorMessage(messages.ERROR_WORKBENCH_NOT_FOUND);
			return;
		}
		const [electronBase, workBenchFilename] = workbenchPaths;

		const htmlFile = path.join(base, electronBase, "workbench", workBenchFilename);
		const templateFile = path.join(base, electronBase, "workbench", "midnightneon.js");

		try {
			// generate production theme JS
			const chromeStyles = fs.readFileSync(__dirname + '/css/editor_chrome.css', 'utf-8');
			const jsTemplate = fs.readFileSync(__dirname + '/js/theme_template.js', 'utf-8');
			const themeWithGlow = jsTemplate.replace(/\[DISABLE_GLOW\]/g, disableGlow);
			const themeWithChrome = themeWithGlow.replace(/\[CHROME_STYLES\]/g, chromeStyles);
			const finalTheme = themeWithChrome.replace(/\[NEON_BRIGHTNESS\]/g, neonBrightness);
			fs.writeFileSync(templateFile, finalTheme, "utf-8");

			// modify workbench html
			const html = fs.readFileSync(htmlFile, "utf-8");

			// check if the tag is already there
			const isEnabled = html.includes("<!-- MIDNIGHT NEON -->");

			if (!isEnabled) {
				// insert the script tag line right before the closing </html> tag
				const inject = neonInject(html);
				const idx = html.lastIndexOf('</html>');
				const output = idx === -1
					? html + inject
					: html.slice(0, idx) + inject + html.slice(idx);

				fs.writeFileSync(htmlFile, output, "utf-8");

				vscode.window
					.showInformationMessage(messages.ACTIVATED, { title: "Restart editor to complete" })
					.then(function(msg) {
						vscode.commands.executeCommand("workbench.action.reloadWindow");
					});
			} else {
				vscode.window
					.showInformationMessage(messages.REACTIVATED, { title: "Restart editor to refresh settings" })
					.then(function(msg) {
						vscode.commands.executeCommand("workbench.action.reloadWindow");
					});
			}
		} catch (e) {
			if (/ENOENT|EACCES|EPERM/.test(e.code)) {
				vscode.window.showInformationMessage(messages.ERROR_ACCESS_DENIED);
				return;
			} else {
				vscode.window.showErrorMessage(messages.ERROR_GENERIC);
				return;
			}
		}
	});

	let disable = vscode.commands.registerCommand('midnightNeon.disableNeon', uninstall);

	context.subscriptions.push(disposable);
	context.subscriptions.push(disable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
	// ...
}

function uninstall() {
	const appDir = path.dirname(vscode.env.appRoot);
	const base = path.join(appDir, 'app', 'out', 'vs', 'code');

	const workbenchPaths = resolveWorkbenchPaths(base);
	if (!workbenchPaths) {
		vscode.window.showErrorMessage(messages.ERROR_WORKBENCH_NOT_FOUND);
		return;
	}
	const [electronBase, workBenchFilename] = workbenchPaths;

	const htmlFile = path.join(base, electronBase, "workbench", workBenchFilename);

	try {
		// modify workbench html
		const html = fs.readFileSync(htmlFile, "utf-8");

		// check if the tag is already there
		const isEnabled = html.includes("<!-- MIDNIGHT NEON -->");

		if (isEnabled) {
			// remove the tag line regardless of line-ending style
			const output = html.replace(NEON_TAG_RE, '');
			fs.writeFileSync(htmlFile, output, "utf-8");

			vscode.window
				.showInformationMessage(messages.DEACTIVATED, { title: "Restart editor to complete" })
				.then(function(msg) {
					vscode.commands.executeCommand("workbench.action.reloadWindow");
				});
		} else {
			vscode.window.showInformationMessage(messages.NOT_RUNNING);
		}
	} catch (e) {
		if (/ENOENT|EACCES|EPERM/.test(e.code)) {
			vscode.window.showInformationMessage(messages.ERROR_ACCESS_DENIED);
			return;
		} else {
			vscode.window.showErrorMessage(messages.ERROR_GENERIC);
			return;
		}
	}
}

// Find the workbench HTML file and electron base directory.
// Returns an array with the electron base directory and the workbench HTML filename.
// If not found, returns null.
function resolveWorkbenchPaths(base) {
	const electronBaseCandidates = [
		// v1.70-, v1.102+
		"electron-browser",
		// v1.70 ~ v1.102
		"electron-sandbox",
	]

	const htmlCandidates = [
		// v1.94.0
		"workbench.esm.html",
		// other
		"workbench.html",
	];

	for (const electronBase of electronBaseCandidates) {
		for (const htmlFile of htmlCandidates) {
			if (fs.existsSync(path.join(base, electronBase, "workbench", htmlFile))) {
				return [electronBase, htmlFile];
			}
		}
	}

	return null;
}

module.exports = {
	activate,
	deactivate
}
