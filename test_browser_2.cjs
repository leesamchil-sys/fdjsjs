const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000');
  
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Opening settings modal...');
  try {
    // We can evaluate some script in browser to click the settings button.
    // It's the button with the Settings icon.
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const settingsButton = buttons.find(b => b.innerHTML.includes('lucide-settings') || b.innerHTML.includes('Settings'));
      if (settingsButton) {
        settingsButton.click();
      } else {
        console.log('Settings button not found by lucide-settings, trying anything with icon...');
        const possible = buttons.find(b => b.className.includes('settings') || b.innerHTML.includes('설정'));
        if (possible) possible.click();
      }
    });
  } catch (e) {
    console.error('Click error:', e);
  }
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
