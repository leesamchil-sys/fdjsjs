const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 2000));

  console.log('App loaded successfully');
  await browser.close();
})();
