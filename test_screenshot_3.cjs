const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));
  
  // click settings button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const settingsButton = buttons.find(b => b.className.includes('settings') || b.innerHTML.includes('lucide-settings') || b.innerHTML.includes('설정'));
    if (settingsButton) settingsButton.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click admin settings if it's there
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const adminBtn = buttons.find(b => b.innerHTML.includes('관리자 설정'));
    if(adminBtn) adminBtn.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // click daily info
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const dailyInfoTab = buttons.find(b => b.innerHTML.includes('일일 장소'));
    if (dailyInfoTab) dailyInfoTab.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await page.screenshot({ path: 'screenshot3.png' });
  await browser.close();
  console.log('Screenshot saved to screenshot3.png');
})();
