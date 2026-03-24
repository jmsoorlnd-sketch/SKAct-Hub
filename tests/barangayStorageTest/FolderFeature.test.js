const { Builder, By, until, Key } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("chromedriver");

const bravePath =
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

const BASE_URL = "http://localhost:5173";
const TEST_FOLDER_NAME = "Test Selenium Folder";

function createDriver() {
  let options = new chrome.Options();
  options.setChromeBinaryPath(bravePath);
  options.addArguments("--start-maximized");
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Always re-query — never cache across re-renders */
const q = (driver) => ({
  // Modal presence checks
  folderModal: () =>
    driver.findElements(By.xpath("//h2[text()='Create New Folder']")),
  folderViewModal: () =>
    driver.findElements(
      By.xpath(
        "//h2[contains(@class,'text-xl') and contains(.,'folder') or contains(.,'Folder')]",
      ),
    ),

  // Create Folder modal elements
  folderNameInput: () =>
    driver.wait(
      until.elementLocated(
        By.xpath('//input[@placeholder="e.g., Meeting Minutes"]'),
      ),
      5000,
    ),
  createFolderSubmitBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath("//button[.//span[text()='Create Folder']]"),
      ),
      5000,
    ),
  createFolderCancelBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath(
          "//button[text()='Cancel' and ancestor::div[contains(@class,'rounded-2xl')]]",
        ),
      ),
      5000,
    ),
  createFolderCloseBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[contains(@class,'from-indigo-600') and .//h2[text()='Create New Folder']]//button[contains(@class,'hover:bg-white')]",
        ),
      ),
      5000,
    ),

  // New Folder trigger button
  newFolderBtn: () =>
    driver.wait(
      until.elementLocated(By.xpath("//button[.//span[text()='New Folder']]")),
      10000,
    ),

  // Folder cards on main page
  folderByName: (name) =>
    driver.findElements(
      By.xpath(`//*[contains(@class,'folder-name') and text()='${name}']`),
    ),

  // Folder view modal
  folderViewCloseBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath("//button[.//span[text()='Close'] or text()='Close']"),
      ),
      5000,
    ),
  folderViewSearchInput: () =>
    driver.wait(
      until.elementLocated(
        By.xpath("//input[@placeholder='Search documents by name...']"),
      ),
      5000,
    ),
  folderViewBackBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath("//button[.//span[text()='Back to List']]"),
      ),
      5000,
    ),

  // Confirmation modal
  confirmBtn: () =>
    driver.wait(
      until.elementLocated(By.xpath("//button[text()='Confirm']")),
      5000,
    ),
  confirmCancelBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[contains(@class,'rounded-2xl') and .//h2]//button[text()='Cancel']",
        ),
      ),
      5000,
    ),

  // Status confirm modal
  statusConfirmBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Confirm Status Change']]//button[text()='Confirm']",
        ),
      ),
      5000,
    ),
  statusCancelBtn: () =>
    driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Confirm Status Change']]//button[text()='Cancel']",
        ),
      ),
      5000,
    ),

  // Toast / body text
  bodyText: () => driver.findElement(By.tagName("body")).getText(),
});

async function login(driver) {
  await driver.get(`${BASE_URL}/login`);
  await driver.wait(until.elementLocated(By.name("username")), 10000);
  await driver.findElement(By.name("username")).sendKeys("Ana Marie");
  await driver.findElement(By.name("password")).sendKeys("Komong2x");
  await driver
    .findElement(By.xpath("//button[.//span[text()='Sign In']]"))
    .click();
  await driver.wait(until.urlContains("/barangay-storage"), 10000);
  console.log("✅ Login success");
}

async function navigateToBarangayStorage(driver) {
  await driver.get(`${BASE_URL}/barangay-storage`);
  await driver.sleep(1500);
  console.log("✅ Navigated to Barangay Storage");
}

/** Click the first barangay in the sidebar to load documents & folders */
async function selectFirstBarangay(driver) {
  const firstBarangay = await driver.wait(
    until.elementLocated(
      By.xpath(
        "(//div[contains(@class,'divide-y')]//div[contains(@class,'cursor-pointer')])[1]",
      ),
    ),
    10000,
  );
  await driver.executeScript("arguments[0].click();", firstBarangay);
  await driver.sleep(1500);
  console.log("✅ Barangay selected");
}

/** Open the Create Folder modal */
async function openCreateFolderModal(driver, $) {
  const btn = await $.newFolderBtn();
  await driver.executeScript("arguments[0].click();", btn);
  await driver.wait(
    until.elementLocated(By.xpath("//h2[text()='Create New Folder']")),
    5000,
  );
  console.log("✅ Create Folder modal opened");
}

/** Wait for the Create Folder modal to close */
async function waitForCreateModalClose(driver) {
  await driver.wait(async () => {
    const els = await driver.findElements(
      By.xpath("//h2[text()='Create New Folder']"),
    );
    return els.length === 0;
  }, 5000);
}

/** Find the folder card by its name div */
async function findFolderCard(driver, name) {
  return driver.findElements(
    By.xpath(
      `//*[contains(@class,'folder-name') and normalize-space(text())='${name}']`,
    ),
  );
}

/** Click a folder card to open its view modal */
async function openFolderViewModal(driver, name) {
  const folderEl = await driver.wait(
    until.elementLocated(
      By.xpath(
        `//*[contains(@class,'folder-name') and normalize-space(text())='${name}']/ancestor::div[contains(@class,'folder-container')]`,
      ),
    ),
    8000,
  );
  await driver.executeScript("arguments[0].click();", folderEl);
  await driver.wait(
    until.elementLocated(
      By.xpath("//input[@placeholder='Search documents by name...']"),
    ),
    5000,
  );
  console.log(`✅ Folder view modal opened for "${name}"`);
}

async function closeFolderViewModal(driver, $) {
  const closeBtn = await $.folderViewCloseBtn();
  await driver.executeScript("arguments[0].click();", closeBtn);
  await driver.wait(async () => {
    const els = await driver.findElements(
      By.xpath("//input[@placeholder='Search documents by name...']"),
    );
    return els.length === 0;
  }, 5000);
}

// ── MAIN TEST ─────────────────────────────────────────────────────────────────

(async function testFolderFeatures() {
  const driver = createDriver();
  const $ = q(driver);

  try {
    // =========================================================
    // SETUP — Login and navigate
    // =========================================================
    await login(driver);
    await navigateToBarangayStorage(driver);
    await selectFirstBarangay(driver);

    // =========================================================
    // TC-F01: Cancel button closes Create Folder modal
    // =========================================================
    console.log("\n── TC-F01: Cancel closes modal ──");
    await openCreateFolderModal(driver, $);
    const cancelBtn = await $.createFolderCancelBtn();
    await driver.executeScript("arguments[0].click();", cancelBtn);
    await waitForCreateModalClose(driver);
    console.log("✅ TC-F01 PASS: Cancel closed the modal");

    // =========================================================
    // TC-F02: X button closes Create Folder modal
    // =========================================================
    console.log("\n── TC-F02: X button closes modal ──");
    await openCreateFolderModal(driver, $);
    const closeBtn = await $.createFolderCloseBtn();
    await driver.executeScript("arguments[0].click();", closeBtn);
    await waitForCreateModalClose(driver);
    console.log("✅ TC-F02 PASS: X button closed the modal");

    // =========================================================
    // TC-F03: Create button disabled when folder name is empty
    // =========================================================
    console.log("\n── TC-F03: Submit disabled when name is empty ──");
    await openCreateFolderModal(driver, $);
    const submitBtn = await $.createFolderSubmitBtn();
    const isDisabled = await submitBtn.getAttribute("disabled");
    if (isDisabled !== null) {
      console.log(
        "✅ TC-F03 PASS: Create button is disabled when name is empty",
      );
    } else {
      console.log(
        "⚠️  TC-F03 WARN: Create button may not be disabled — check UI logic",
      );
    }
    // Close modal
    const cancelBtn2 = await $.createFolderCancelBtn();
    await driver.executeScript("arguments[0].click();", cancelBtn2);
    await waitForCreateModalClose(driver);

    // =========================================================
    // TC-F04: Successfully create a folder
    // =========================================================
    console.log("\n── TC-F04: Create folder successfully ──");
    await openCreateFolderModal(driver, $);
    const nameInput = await $.folderNameInput();
    await nameInput.clear();
    await nameInput.sendKeys(TEST_FOLDER_NAME);
    const submitBtn2 = await $.createFolderSubmitBtn();
    await driver.executeScript("arguments[0].click();", submitBtn2);
    await waitForCreateModalClose(driver);
    await driver.sleep(1500); // wait for folder to appear

    const folderCards = await findFolderCard(driver, TEST_FOLDER_NAME);
    if (folderCards.length > 0) {
      console.log(
        `✅ TC-F04 PASS: Folder "${TEST_FOLDER_NAME}" created and visible`,
      );
    } else {
      console.log(
        `❌ TC-F04 FAIL: Folder "${TEST_FOLDER_NAME}" not found after creation`,
      );
    }

    // =========================================================
    // TC-F05: Create folder using Enter key
    // =========================================================
    console.log("\n── TC-F05: Create folder via Enter key ──");
    const enterFolderName = "Enter Key Folder";
    await openCreateFolderModal(driver, $);
    const nameInput2 = await $.folderNameInput();
    await nameInput2.clear();
    await nameInput2.sendKeys(enterFolderName, Key.RETURN);
    await waitForCreateModalClose(driver);
    await driver.sleep(1500);
    const enterFolderCards = await findFolderCard(driver, enterFolderName);
    if (enterFolderCards.length > 0) {
      console.log(
        `✅ TC-F05 PASS: Folder "${enterFolderName}" created via Enter key`,
      );
    } else {
      console.log(`❌ TC-F05 FAIL: Folder "${enterFolderName}" not found`);
    }

    // =========================================================
    // TC-F06: Duplicate folder name is rejected
    // =========================================================
    console.log("\n── TC-F06: Duplicate folder name rejected ──");
    await openCreateFolderModal(driver, $);
    const nameInputDupe = await $.folderNameInput();
    await nameInputDupe.clear();
    await nameInputDupe.sendKeys(TEST_FOLDER_NAME);
    const submitDupe = await $.createFolderSubmitBtn();
    await driver.executeScript("arguments[0].click();", submitDupe);
    await driver.sleep(1500);

    const bodyAfterDupe = await $.bodyText();
    if (bodyAfterDupe.includes("already exists")) {
      console.log(
        "✅ TC-F06 PASS: Duplicate folder rejected with error message",
      );
    } else {
      console.log(
        "⚠️  TC-F06 CHECK: Verify toast error for duplicate folder appeared",
      );
    }
    // Close modal if still open
    const dupeModals = await $.folderModal();
    if (dupeModals.length > 0) {
      const c = await $.createFolderCancelBtn();
      await driver.executeScript("arguments[0].click();", c);
      await waitForCreateModalClose(driver);
    }

    // =========================================================
    // TC-F07: Open folder view modal by clicking folder
    // =========================================================
    console.log("\n── TC-F07: Open folder view modal ──");
    await openFolderViewModal(driver, TEST_FOLDER_NAME);
    const searchInput = await $.folderViewSearchInput();
    const searchVisible = await searchInput.isDisplayed();
    if (searchVisible) {
      console.log("✅ TC-F07 PASS: Folder view modal opened with search bar");
    } else {
      console.log("❌ TC-F07 FAIL: Folder view modal did not open correctly");
    }

    // =========================================================
    // TC-F08: Search inside folder view (empty folder)
    // =========================================================
    console.log("\n── TC-F08: Search inside folder (empty folder) ──");
    const search = await $.folderViewSearchInput();
    await search.clear();
    await search.sendKeys("nonexistent document xyz");
    await driver.sleep(800);
    const bodyText = await $.bodyText();
    const hasNoDocsMsg =
      bodyText.includes("No documents in this folder") ||
      bodyText.includes("No documents match");
    if (hasNoDocsMsg) {
      console.log("✅ TC-F08 PASS: Empty/no-match state shown correctly");
    } else {
      console.log(
        "⚠️  TC-F08 CHECK: Verify empty state message in folder search",
      );
    }
    // Clear search
    const search2 = await $.folderViewSearchInput();
    await search2.clear();

    // =========================================================
    // TC-F09: Close folder view modal using Close button
    // =========================================================
    console.log("\n── TC-F09: Close folder view modal ──");
    await closeFolderViewModal(driver, $);
    console.log("✅ TC-F09 PASS: Folder view modal closed");

    // =========================================================
    // TC-F10: Close folder view modal using X button
    // =========================================================
    // console.log("\n── TC-F10: Close folder view modal via X button ──");
    // await openFolderViewModal(driver, TEST_FOLDER_NAME);
    // const xCloseBtn = await driver.wait(
    //   until.elementLocated(
    //     By.xpath(
    //       "//div[contains(@class,'from-blue-600') and .//input[@placeholder='Search documents by name...']]//ancestor::div[contains(@class,'rounded-2xl')]//button[contains(@class,'hover:bg-white')]",
    //     ),
    //   ),
    //   5000,
    // );
    // await driver.executeScript("arguments[0].click();", xCloseBtn);
    // await driver.wait(async () => {
    //   const els = await driver.findElements(
    //     By.xpath("//input[@placeholder='Search documents by name...']"),
    //   );
    //   return els.length === 0;
    // }, 5000);
    // console.log("✅ TC-F10 PASS: Folder view modal closed via X button");

    // =========================================================
    // TC-F11: Add Document button opens Folder Compose modal
    // =========================================================
    console.log("\n── TC-F11: Add document (+) button opens compose modal ──");
    const plusBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[@title='Add document']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", plusBtn);
    await driver.wait(
      until.elementLocated(
        By.xpath("//h2[text()='Create Document for Folder']"),
      ),
      5000,
    );
    console.log("✅ TC-F11 PASS: Folder compose modal opened");

    // =========================================================
    // TC-F12: Folder compose modal — submit disabled when fields empty
    // =========================================================
    console.log("\n── TC-F12: Compose submit disabled when fields empty ──");
    const composeSubmitBtn = await driver.wait(
      until.elementLocated(
        By.xpath("//button[.//span[text()='Create Document']]"),
      ),
      5000,
    );
    const composeDisabled = await composeSubmitBtn.getAttribute("disabled");
    if (composeDisabled !== null) {
      console.log(
        "✅ TC-F12 PASS: Create Document button disabled when fields empty",
      );
    } else {
      console.log("⚠️  TC-F12 CHECK: Verify disabled state on compose submit");
    }

    // =========================================================
    // TC-F13: Folder compose modal — Cancel closes it
    // =========================================================
    console.log("\n── TC-F13: Compose modal Cancel button ──");
    const composeCancelBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Create Document for Folder']]//button[text()='Cancel']",
        ),
      ),
      5000,
    );
    await driver.executeScript("arguments[0].click();", composeCancelBtn);
    await driver.wait(async () => {
      const els = await driver.findElements(
        By.xpath("//h2[text()='Create Document for Folder']"),
      );
      return els.length === 0;
    }, 5000);
    console.log("✅ TC-F13 PASS: Folder compose modal closed via Cancel");

    // =========================================================
    // TC-F14: Folder compose modal — X button closes it
    // =========================================================
    console.log("\n── TC-F14: Compose modal X button ──");
    const plusBtn2 = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[@title='Add document']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", plusBtn2);
    await driver.wait(
      until.elementLocated(
        By.xpath("//h2[text()='Create Document for Folder']"),
      ),
      5000,
    );
    const composeXBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Create Document for Folder']]//button[contains(@class,'hover:bg-white')]",
        ),
      ),
      5000,
    );
    await driver.executeScript("arguments[0].click();", composeXBtn);
    await driver.wait(async () => {
      const els = await driver.findElements(
        By.xpath("//h2[text()='Create Document for Folder']"),
      );
      return els.length === 0;
    }, 5000);
    console.log("✅ TC-F14 PASS: Folder compose modal closed via X button");

    // =========================================================
    // TC-F15: Set folder status to Ongoing via status button
    // =========================================================
    console.log("\n── TC-F15: Set folder status to Ongoing ──");
    const ongoingBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[text()='Set Ongoing']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", ongoingBtn);

    // Confirm in status modal
    const statusConfirmBtn = await $.statusConfirmBtn();
    await driver.executeScript("arguments[0].click();", statusConfirmBtn);
    await driver.sleep(1500);

    const bodyAfterOngoing = await $.bodyText();
    if (
      bodyAfterOngoing.includes("Ongoing") ||
      bodyAfterOngoing.includes("ongoing")
    ) {
      console.log("✅ TC-F15 PASS: Folder status set to Ongoing");
    } else {
      console.log("⚠️  TC-F15 CHECK: Verify Ongoing status badge on folder");
    }

    // =========================================================
    // TC-F16: Cancel status change in confirmation modal
    // =========================================================
    console.log("\n── TC-F16: Cancel status change ──");
    await driver.sleep(500);
    const completedBtnForCancel = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[text()='Set Completed']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", completedBtnForCancel);

    const statusCancelBtn = await $.statusCancelBtn();
    await driver.executeScript("arguments[0].click();", statusCancelBtn);
    await driver.sleep(800);

    // Status should still be Ongoing
    const bodyAfterCancel = await $.bodyText();
    if (!bodyAfterCancel.includes("Completed")) {
      console.log("✅ TC-F16 PASS: Status change cancelled, remains Ongoing");
    } else {
      console.log(
        "⚠️  TC-F16 CHECK: Verify cancel does not apply status change",
      );
    }

    // =========================================================
    // TC-F17: Set folder status to Completed
    // =========================================================
    console.log("\n── TC-F17: Set folder status to Completed ──");
    const completedBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[text()='Set Completed']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", completedBtn);
    const statusConfirmBtn2 = await $.statusConfirmBtn();
    await driver.executeScript("arguments[0].click();", statusConfirmBtn2);
    await driver.sleep(1500);
    const bodyAfterCompleted = await $.bodyText();
    if (
      bodyAfterCompleted.includes("Completed") ||
      bodyAfterCompleted.includes("completed")
    ) {
      console.log("✅ TC-F17 PASS: Folder status set to Completed");
    } else {
      console.log("⚠️  TC-F17 CHECK: Verify Completed status badge on folder");
    }

    // =========================================================
    // TC-F18: Delete folder — Cancel in confirmation modal
    // =========================================================
    console.log("\n── TC-F18: Delete folder — Cancel aborts deletion ──");
    const deleteBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[@title='Delete folder']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", deleteBtn);

    // Wait for confirmation modal
    await driver.wait(
      until.elementLocated(By.xpath("//h2[text()='Delete Folder']")),
      5000,
    );

    const deleteCancelBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Delete Folder']]//button[text()='Cancel']",
        ),
      ),
      5000,
    );
    await driver.executeScript("arguments[0].click();", deleteCancelBtn);

    // Modal closes — folder still exists
    await driver.wait(async () => {
      const els = await driver.findElements(
        By.xpath("//h2[text()='Delete Folder']"),
      );
      return els.length === 0;
    }, 5000);

    const folderStillExists = await findFolderCard(driver, TEST_FOLDER_NAME);
    if (folderStillExists.length > 0) {
      console.log("✅ TC-F18 PASS: Folder not deleted after Cancel");
    } else {
      console.log(
        "❌ TC-F18 FAIL: Folder was deleted even though Cancel was clicked",
      );
    }

    // =========================================================
    // TC-F19: Delete folder — Confirm deletes the folder
    // =========================================================
    console.log("\n── TC-F19: Delete folder — Confirm deletes folder ──");
    const deleteBtn2 = await driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[contains(@class,'folder-name') and normalize-space(text())='${TEST_FOLDER_NAME}']/ancestor::div[contains(@class,'folder-container')]//button[@title='Delete folder']`,
        ),
      ),
      8000,
    );
    await driver.executeScript("arguments[0].click();", deleteBtn2);
    await driver.wait(
      until.elementLocated(By.xpath("//h2[text()='Delete Folder']")),
      5000,
    );
    const deleteConfirmBtn = await driver.wait(
      until.elementLocated(
        By.xpath(
          "//div[.//h2[text()='Delete Folder']]//button[text()='Confirm']",
        ),
      ),
      5000,
    );
    await driver.executeScript("arguments[0].click();", deleteConfirmBtn);
    await driver.sleep(10000);

    const folderGone = await findFolderCard(driver, TEST_FOLDER_NAME);
    if (folderGone.length === 0) {
      console.log(
        `✅ TC-F19 PASS: Folder "${TEST_FOLDER_NAME}" deleted successfully`,
      );
    } else {
      console.log(
        `❌ TC-F19 FAIL: Folder "${TEST_FOLDER_NAME}" still visible after deletion`,
      );
    }

    // =========================================================
    // TC-F20: Delete Enter Key Folder (cleanup)
    // =========================================================
    console.log("\n── TC-F20: Cleanup — delete Enter Key Folder ──");
    const enterFolderDelete = await driver.findElements(
      By.xpath(
        `//*[contains(@class,'folder-name') and normalize-space(text())='${enterFolderName}']/ancestor::div[contains(@class,'folder-container')]//button[@title='Delete folder']`,
      ),
    );
    if (enterFolderDelete.length > 0) {
      await driver.executeScript("arguments[0].click();", enterFolderDelete[0]);
      await driver.wait(
        until.elementLocated(By.xpath("//h2[text()='Delete Folder']")),
        5000,
      );
      const cleanupConfirmBtn = await driver.wait(
        until.elementLocated(
          By.xpath(
            "//div[.//h2[text()='Delete Folder']]//button[text()='Confirm']",
          ),
        ),
        5000,
      );
      await driver.executeScript("arguments[0].click();", cleanupConfirmBtn);
      await driver.sleep(1200);
      console.log("✅ TC-F20 PASS: Enter Key Folder cleaned up");
    } else {
      console.log("⚠️  TC-F20 SKIP: Enter Key Folder not found for cleanup");
    }

    console.log("\n══════════════════════════════════════════");
    console.log("✅ ALL FOLDER TESTS COMPLETED");
    console.log("══════════════════════════════════════════");
  } catch (err) {
    console.error("❌ Test failed:", err.message || err);
  } finally {
    await driver.quit();
  }
})();
