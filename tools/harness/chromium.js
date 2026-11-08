// Where headless Chromium is: CHROMIUM_PATH, else the usual system locations (GitHub's Ubuntu runners have Chrome).
const fs = require('fs');
const CANDIDATES = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'];
function chromiumPath() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const found = CANDIDATES.find(p => fs.existsSync(p));
  if (!found) throw new Error('No Chrome or Chromium found: set CHROMIUM_PATH');
  return found;
}
module.exports = { chromiumPath };
