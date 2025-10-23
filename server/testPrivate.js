const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Hape faqen e login
  await page.goto("https://17061968.netlify.app/signin", { waitUntil: "networkidle0" });

  // Shkruaj kredencialet
  await page.waitForSelector('input[name="email"]', { visible: true });
  await page.type('input[name="email"]', "ledioon.2022@gmail.com");

  await page.waitForSelector('input[name="password"]', { visible: true });
  await page.type('input[name="password"]', "Ledion123");

  // Kliko butonin e login
  await page.click('button[type="submit"]');

  // Navigo direkt te home pas login
  await page.goto("https://17061968.netlify.app/home", { waitUntil: "networkidle0" });

  // Lista e seksioneve që do testohen
  const seksionet = [
    "/home",
    "/translate",
    "/dictionary",
    "/listen",
    "/category",
    "/quizes",
    "/leaderboard",
    "/grammar",
    "/plan",
    "/pronunciation",
    "/tests",
    "/account",
  ];

  console.log("🚀 Testimi i performancës dhe screenshot-eve për seksionet:");

  for (let path of seksionet) {
    await page.goto(`https://17061968.netlify.app${path}`, { waitUntil: "networkidle0" });

    // Screenshot
    const fileName = `${path.replace("/", "") || "home"}.png`;
    await page.screenshot({ path: fileName, fullPage: true });

    // Metrics të lexueshme
    const metrics = await page.evaluate(() => {
      const t = window.performance.timing;
      return {
        FCP: t.domContentLoadedEventEnd - t.navigationStart,
        LCP: t.loadEventEnd - t.navigationStart,
        TTI: t.domInteractive - t.navigationStart,
      };
    });

    console.log(`📌 Seksioni: ${path}`);
    console.log(`   Screenshot: ${fileName}`);
    console.log(`   Metrics (ms): FCP=${metrics.FCP}, LCP=${metrics.LCP}, TTI=${metrics.TTI}`);
  }

  await browser.close();
  console.log("✅ Testimi përfundoi!");
})();
