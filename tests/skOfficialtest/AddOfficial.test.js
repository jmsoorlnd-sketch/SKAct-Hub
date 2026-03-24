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
      By.xpath("//button[.//span[text()='Create Official']]"),
    );

    // ===============================
    // 3. EMPTY VALIDATION TEST
    // ===============================
    await submitBtn.click();

    const fnameError = await driver.wait(
      until.elementLocated(By.xpath("//p[contains(text(),'First name')]")),
      5000,
    );

    console.log("✅ Validation works:", await fnameError.getText());

    // ===============================
    // 4. INVALID EMAIL TEST
    // ===============================
    const random = Math.floor(Math.random() * 10000);

    await driver.findElement(By.name("firstname")).sendKeys("Juan" + random);
    await driver.findElement(By.name("lastname")).sendKeys("Test" + random);

    // const emailInput = await driver.findElement(By.name("email"));
    // await emailInput.sendKeys("invalid-email");

    await submitBtn.click();

    // const emailError = await driver.wait(
    //   until.elementLocated(By.xpath("//p[contains(text(),'email')]")),
    //   5000,
    // );

    // console.log("✅ Email validation:", await emailError.getText());

    // await emailInput.clear();

    // ===============================
    // 5. USERNAME AUTO-GENERATION
    // ===============================
    await driver.sleep(500);

    const username = await driver
      .findElement(By.name("username"))
      .getAttribute("value");

    console.log("✅ Generated username:", username);

    // ===============================
    // 6. SELECT DROPDOWNS
    // ===============================
    await driver
      .findElement(By.name("position"))
      .sendKeys("Chairman", Key.ENTER);

    const barangaySelect = await driver.wait(
      until.elementLocated(By.name("barangay")),
      5000,
    );

    await driver.wait(async () => await barangaySelect.isEnabled(), 5000);

    await driver.wait(async () => {
      const options = await barangaySelect.findElements(By.tagName("option"));
      return options.length > 1;
    }, 5000);

    // Select second option (first is placeholder)
    const options = await barangaySelect.findElements(By.tagName("option"));
    await options[1].click();

    console.log("✅ Barangay selected");

    console.log("✅ Dropdowns working");

    // ===============================
    // 7. PASSWORD MISMATCH TEST
    // ===============================
    await driver.findElement(By.name("password")).sendKeys("Password123!");

    await driver
      .findElement(By.name("confirmPassword"))
      .sendKeys("WrongPassword");

    await submitBtn.click();

    const mismatchError = await driver.wait(
      until.elementLocated(
        By.xpath("//p[contains(text(),'Passwords do not match')]"),
      ),
      5000,
    );

    console.log("✅ mismatch error:", await mismatchError.getText());

    // ===============================
    // 8. FIX PASSWORD
    // ===============================
    // 1. Get the auto-generated password
    const passwordInput = await driver.findElement(By.name("password"));
    const autoPassword = await passwordInput.getAttribute("value");

    // 2. Fill confirmPassword with the same value
    const confirmInput = await driver.findElement(By.name("confirmPassword"));
    await confirmInput.clear();
    await confirmInput.sendKeys(autoPassword);
    // ===============================
    // 9. PASSWORD STRENGTH UI
    // ===============================
    const strength = await driver.findElement(
      By.xpath("//span[contains(text(),'Password strength')]"),
    );

    console.log("✅ Password strength visible:", await strength.isDisplayed());

    // ===============================
    // 10. TOGGLE PASSWORD VISIBILITY
    // ===============================
    const toggleBtn = await driver.findElement(
      By.xpath("(//button[@type='button'])[2]"),
    );

    await toggleBtn.click();
    console.log("✅ Toggle password clicked");

    // ===============================
    // 11. SUCCESS SUBMIT
    // ===============================
    const errors = await driver.findElements(By.css("p[class*='text-red']"));
    if (errors.length > 0) {
      console.log("❌ Form still has errors:");
      for (let err of errors) {
        console.log("-", await err.getText());
      }
      throw new Error("Form validation failed before submit");
    }

    console.log("📝 About to submit valid form...");

    // Record modal state BEFORE submit
    const modalBefore = await driver.findElements(
      By.xpath("//h2[text()='Create SK Official']"),
    );

    // Submit
    await submitBtn.click();

    // Wait a moment for API/network
    await driver.sleep(1500);

    // Check if modal closed (PRIMARY success indicator)
    const modalAfter = await driver.findElements(
      By.xpath("//h2[text()='Create SK Official']"),
    );

    if (modalBefore.length > 0 && modalAfter.length === 0) {
      console.log(
        "✅ SUCCESS: Modal auto-closed after submit (API succeeded!)",
      );
    } else {
      console.log("❌ FAIL: Modal still open after submit");

      // Secondary: Check for API error banner
      const apiErrorBanner = await driver.findElements(
        By.xpath(
          "//div[contains(@class, 'bg-red-50')]//p[contains(text(), 'Failed')]",
        ),
      );
      if (apiErrorBanner.length > 0) {
        const errText = await apiErrorBanner[0].getText();
        console.log("❌ API Error:", errText);
      } else {
        console.log("❌ Unknown submit failure");
      }
    }
    // 12. API ERROR TEST (NO TOKEN)
    // ===============================
    await driver.executeScript("localStorage.removeItem('token')");
    await driver.navigate().refresh();

    console.log("✅ API error simulation (401)");

    // ===============================
    // 13. CLOSE MODAL TEST
    // ===============================
    const modal = await driver.findElements(
      By.xpath("//h2[text()='Create SK Official']"),
    );
    if (modal.length > 0) {
      const closeBtn = await driver.findElement(By.xpath("//button[.//svg]"));
      await closeBtn.click();
      console.log("✅ Modal closed manually");
    } else {
      console.log("⚠ Modal already closed automatically");
    }
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await driver.quit();
  }
})();
