import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotPath = path.resolve(__dirname, '..', 'public', 'screenshots', 'wallet-options.png');
const PORT = process.env.PORT || '4173';
const BASE_URL = `http://localhost:${PORT}`;

fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function takeScreenshot() {
  console.log(`Launching browser targeting ${BASE_URL}...`);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  try {
    console.log('Navigating to OrbitSwap...');
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for React to render
    await sleep(3000);
    console.log('Page loaded, looking for Connect Wallet button...');

    console.log('Page title:', await page.title());
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('Body text preview:', bodyText.substring(0, 200));

    // Click the Connect Wallet button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const connectButton = buttons.find((btn) =>
        btn.textContent?.toLowerCase().includes('connect wallet'),
      );
      if (connectButton) {
        connectButton.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('Clicked "Connect Wallet" button.');
    } else {
      console.log('Searching for connect button by aria attributes...');
      const btnClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        for (const btn of buttons) {
          const aria = btn.getAttribute('aria-label') || '';
          const text = btn.textContent || '';
          if (
            aria.toLowerCase().includes('connect') ||
            text.toLowerCase().includes('connect') ||
            text.toLowerCase().includes('wallet')
          ) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (!btnClicked) {
        console.log('Could not find Connect Wallet button. Available buttons:');
        const buttonTexts = await page.evaluate(() =>
          Array.from(document.querySelectorAll('button')).map((b) => b.textContent?.trim()),
        );
        console.log(buttonTexts);
      }
    }

    // Wait for the modal/dialog to appear
    await sleep(2000);

    // Check if dialog is visible
    const dialogVisible = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return !!dialog;
    });
    console.log('Dialog visible:', dialogVisible);

    if (!dialogVisible) {
      await sleep(3000);
    }

    console.log('Taking screenshot...');
    await page.screenshot({
      path: screenshotPath,
      fullPage: false,
    });

    console.log(`Screenshot saved to: ${screenshotPath}`);
  } catch (error) {
    console.error('Error:', error.message);
    try {
      await sleep(1000);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Fallback screenshot saved to: ${screenshotPath}`);
    } catch (e) {
      console.error('Fallback also failed:', e.message);
    }
  } finally {
    await browser.close();
    console.log('Browser closed.');
  }
}

takeScreenshot().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
