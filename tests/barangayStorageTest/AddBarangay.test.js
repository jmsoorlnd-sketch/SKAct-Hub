const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("chromedriver");

const bravePath =
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

function createDriver() {
  let options = new chrome.Options();
  options.setChromeBinaryPath(bravePath);
  options.addArguments("--start-maximized");
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

(async function testCreateOfficialModal() {
  const driver = createDriver();

  try {
    // ===============================
    // 1. LOGIN
    // ===============================
    await driver.get("http://localhost:5173/login");

    await driver
      .wait(until.elementLocated(By.name("username")), 10000)
      .sendKeys("admin");

    await driver.findElement(By.name("password")).sendKeys("admin");

    await driver
      .findElement(By.xpath("//button[.//span[text()='Sign In']]"))
      .click();

    await driver.wait(until.urlContains("/admin/sk-officials"), 10000);
    console.log("✅ Login success");

    // ===============================
    // 2. OPEN MODAL
    // ===============================
    const addBtn = await driver.wait(
      until.elementLocated(By.xpath("//span[text()='Add Official']/..")),
      10000,
    );

    await driver.executeScript("arguments[0].click();", addBtn);

    await driver.wait(
      until.elementLocated(By.xpath("//h2[text()='Create SK Official']")),
      5000,
    );

    console.log("✅ Modal opened");

    const submitBtn = await driver.findElement(
      By.xpath("//button[.//span[text()='Add Barangay']]"),
    );
