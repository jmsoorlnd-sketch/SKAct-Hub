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

(async function testEditOfficialModal() {
  const driver = createDriver();

  async function clickMoreEdit() {
    const moreBtn = await driver.wait(
      until.elementLocated(By.xpath("(//button[contains(@class,'p-1')])[3]")),
      10000,
    );
    await driver.executeScript("arguments[0].click();", moreBtn);

    const editBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[.//p[text()='Edit']]")),
      5000,
    );
    await driver.executeScript("arguments[0].click();", editBtn);

    await driver.wait(
      until.elementLocated(By.xpath("//h2[text()='Edit Official']")),
      5000,
    );
  }

  async function waitForModalClose() {
    await driver.wait(async () => {
      const modals = await driver.findElements(
        By.xpath("//h2[text()='Edit Official']"),
      );
      return modals.length === 0;
    }, 5000);
  }

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

    await driver.sleep(1000); // wait for table render

    // ===============================
    // 2. OPEN EDIT MODAL
    // ===============================
    await clickMoreEdit();
    console.log("✅ Edit modal opened");

    // Re-query inputs after modal opens
    const firstNameInput = await driver.findElement(By.name("firstname"));
    const lastNameInput = await driver.findElement(By.name("lastname"));
    const positionSelect = await driver.findElement(By.name("position"));
    const barangaySelect = await driver.findElement(By.name("barangay"));
    const submitBtn = await driver.findElement(
      By.xpath("//button[contains(text(),'Save Changes')]"),
    );

    // ===============================
    // 3. VALIDATIONS
    // ===============================
    await firstNameInput.clear();
    await submitBtn.click();
    let fnameValidation = await driver.executeScript(
      "return arguments[0].validationMessage;",
      firstNameInput,
    );
    console.log("✅ Firstname validation:", fnameValidation);

    await lastNameInput.clear();
    await submitBtn.click();
    let lnameValidation = await driver.executeScript(
      "return arguments[0].validationMessage;",
      lastNameInput,
    );
    console.log("✅ Lastname validation:", lnameValidation);

    await positionSelect.sendKeys("", Key.ENTER);
    await submitBtn.click();
    let positionValidation = await driver.executeScript(
      "return arguments[0].validationMessage;",
      positionSelect,
    );
    console.log("✅ Position validation:", positionValidation);

    await barangaySelect.sendKeys("", Key.ENTER);
    await submitBtn.click();
    let barangayValidation = await driver.executeScript(
      "return arguments[0].validationMessage;",
      barangaySelect,
    );
    console.log("✅ Barangay validation:", barangayValidation);

    // ===============================
    // 4. EDIT FIELDS
    // ===============================
    await firstNameInput.clear();
    await firstNameInput.sendKeys("EditedName");
    await lastNameInput.clear();
    await lastNameInput.sendKeys("EditedLast");
    await positionSelect.sendKeys("", Key.ENTER);

    await driver.wait(async () => {
      const opts = await barangaySelect.findElements(By.tagName("option"));
      return opts.length > 1;
    }, 5000);
    const options = await barangaySelect.findElements(By.tagName("option"));
    //  Click the second option safely
    if (options.length > 1) {
      await driver.executeScript("arguments[0].click();", options[1]);
    } else {
      throw new Error("Expected at least 2 options in barangay select");
    }
    console.log("✅ Fields updated");
    // ===============================
    // 5. PASSWORD RESET SCENARIOS
    // ===============================
    const resetBtn = await driver.findElement(
      By.xpath("//button[contains(text(),'Reset Password')]"),
    );
    await resetBtn.click();

    const passwordInput = await driver.findElement(By.name("password"));
    const confirmInput = await driver.findElement(By.name("confirmPassword"));

    // PASSWORD MISMATCH
    await passwordInput.clear();
    await confirmInput.clear();
    await passwordInput.sendKeys("TestPass123!");
    await confirmInput.sendKeys("Mismatch123!");
    await submitBtn.click();

    // Wait for the error alert container to appear
    // After submitting the password mismatch

    // Wait for the error element to appear
    const mismatchError = await driver.wait(
      until.elementLocated(
        By.xpath("//span[contains(text(),'Passwords do not match')]"),
      ),
      10000,
    );

    // Ensure it's visible
    await driver.wait(until.elementIsVisible(mismatchError), 5000);

    // Now you can safely read it
    const text = await mismatchError.getText();
    console.log("✅ Password mismatch:", text);
    await confirmInput.clear();
    await confirmInput.sendKeys("TestPass123!");

    // ===============================
    // 6. SUCCESSFUL SUBMISSION
    // ===============================
    await submitBtn.click();
    await waitForModalClose();
    console.log("✅ Modal submitted and closed successfully");

    // ===============================
    // 7. MODAL CANCEL / CLOSE
    // ===============================
    await clickMoreEdit();
    const cancelBtn = await driver.findElement(
      By.xpath("//button[text()='Cancel']"),
    );
    await cancelBtn.click();
    await waitForModalClose();
    console.log("✅ Cancel closes modal");

    // await clickMoreEdit();
    // const closeBtn = await driver.findElement(
    //   By.xpath("//button[.//svg[@data-icon='X']]"),
    // );
    // await closeBtn.click();
    // await waitForModalClose();
    // console.log("✅ X button closes modal");
  } catch (err) {
    console.error("❌ Test failed:", err);
  } finally {
    await driver.quit();
  }
})();
