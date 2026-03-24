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

// 🔥 SCROLL HELPERS
async function scrollModalTop(driver) {
  const modal = await driver.findElement(By.css("div.overflow-y-auto"));
  await driver.executeScript("arguments[0].scrollTop = 0;", modal);
}

async function scrollToElement(driver, element) {
  await driver.executeScript(
    "arguments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });",
    element,
  );
}

(async function testCreateEventModal() {
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

    await driver.wait(until.urlContains("/admin/events"), 10000);
    console.log("✅ Login success");

    // ===============================
    // 2. OPEN MODAL
    // ===============================
    const addBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[.//text()[contains(., 'Create Event')]]"),
      ),
      10000,
    );
    await driver.executeScript("arguments[0].click();", addBtn);

    await driver.wait(
      until.elementLocated(By.xpath("//h3[contains(text(),'Add New Event')]")),
      5000,
    );
    console.log("✅ Modal opened");

    // ===============================
    // 3. GET ELEMENTS
    // ===============================
    const titleInput = await driver.findElement(
      By.xpath("//input[@type='text']"),
    );
    const descTextarea = await driver.findElement(By.tagName("textarea"));
    const dateInputs = await driver.wait(
      until.elementsLocated(By.css("input[type='datetime-local']")),
      5000,
    );

    if (dateInputs.length < 2) {
      throw new Error(
        "Expected 2 datetime inputs but found: " + dateInputs.length,
      );
    }

    const startDate = dateInputs[0];
    const endDate = dateInputs[1];

    const submitBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[contains(@class, 'border-t-2')]//button[.//text()[contains(., 'Create Event')]]",
        ),
      ),
      5000,
    );

    // ===============================
    // 4. VALIDATION (EMPTY SUBMIT)
    // ===============================
    await submitBtn.click();

    await scrollModalTop(driver);

    const titleValidation = await driver.executeScript(
      "return arguments[0].validationMessage;",
      titleInput,
    );

    console.log("✅ Title validation:", titleValidation);

    // ===============================
    // 5. FILL FORM
    // ===============================
    await scrollToElement(driver, titleInput);

    await titleInput.sendKeys("Test Event");
    await descTextarea.sendKeys("This is a test event");

    await startDate.sendKeys("2026-12-01T10:00");
    await endDate.sendKeys("2026-12-01T12:00");

    console.log("✅ Basic fields filled");

    // ===============================
    // 6. SELECT VISIBILITY (SPECIFIC)
    // ===============================
    const specificRadio = await driver.findElement(
      By.xpath("//input[@value='specific']"),
    );

    await driver.executeScript("arguments[0].click();", specificRadio);

    // wait for barangay select to appear
    const barangaySelect = await driver.wait(
      until.elementLocated(By.tagName("select")),
      5000,
    );

    await scrollToElement(driver, barangaySelect);

    // wait for options
    await driver.wait(async () => {
      const opts = await barangaySelect.findElements(By.tagName("option"));
      return opts.length > 1;
    }, 5000);

    const options = await barangaySelect.findElements(By.tagName("option"));

    if (options.length > 1) {
      await driver.executeScript("arguments[0].click();", options[1]);
    }

    console.log("✅ Barangay selected");

    // ===============================
    // 7. SUBMIT FORM
    // ===============================
    await submitBtn.click();

    // scroll up to see message
    await scrollModalTop(driver);

    // wait for success or error message
    const message = await driver.wait(
      until.elementLocated(By.css("div.mb-4")),
      10000,
    );

    const msgText = await message.getText();
    console.log("✅ Submission message:", msgText);

    // ===============================
    // 8. CLOSE MODAL
    // ===============================
    const cancelBtn = await driver.findElement(
      By.xpath("//button[text()='Cancel']"),
    );

    await cancelBtn.click();

    await driver.wait(async () => {
      const modals = await driver.findElements(
        By.xpath("//h3[contains(text(),'Create New Event')]"),
      );
      return modals.length === 0;
    }, 5000);

    console.log("✅ Modal closed");
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await driver.quit();
  }
})();
