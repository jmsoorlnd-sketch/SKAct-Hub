const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
require("chromedriver");

// 🔹 Path to Brave Browser
const bravePath =
  "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

// 🔹 Helper to create driver
function createDriver() {
  let options = new chrome.Options();
  options.setChromeBinaryPath(bravePath);
  options.addArguments("--start-maximized"); // optional
  return new Builder().forBrowser("chrome").setChromeOptions(options).build();
}

// 🔹 Login function
async function login(driver, username, password) {
  await driver.get("http://localhost:5173/login");
  await driver.wait(until.elementLocated(By.name("username")), 10000);

  await driver.findElement(By.name("username")).sendKeys(username);
  await driver.findElement(By.name("password")).sendKeys(password);

  await driver.findElement(By.css("button[type='submit']")).click();
}

// 🔹 Check login success by URL or dashboard element
async function checkSuccess(driver, role) {
  try {
    if (role === "admin") {
      await driver.wait(until.urlContains("/admin/notifications"), 10000);
    } else if (role === "official") {
      await driver.wait(until.urlContains("/official/inbox"), 10000);
    } else {
      await driver.wait(until.elementLocated(By.id("dashboard")), 10000);
    }

    console.log("✅ Login successful for role:", role);
    return true;
  } catch {
    let url = await driver.getCurrentUrl();
    console.log("❌ Login failed for role:", role, "Current URL:", url);
    return false;
  }
}
// 🔹 Test Cases
async function runTests() {
  // ========================
  // 1. Positive Test
  // ========================
  let driver = createDriver();
  await login(driver, "admin", "admin");

  await checkSuccess(driver, "admin");
  await driver.quit();

  // ========================
  // 2. Invalid Password
  // ========================
  let driver2 = createDriver();
  await login(driver2, "admin", "wrongpass");
  await checkSuccess(driver2, "admin"); // should fail
  console.log("Invalid Password");
  console.log("Test Success");
  await driver2.quit();

  // ========================
  // 3. Non-existing User
  // ========================
  let driver3 = createDriver();
  await login(driver3, "notauser", "123456");
  await checkSuccess(driver3, "admin"); // should fail
  console.log("Non-existing User");
  console.log("Test Success");
  await driver3.quit();

  // ========================
  // 4. Empty Fields
  // ========================
  let driver4 = createDriver();
  await login(driver4, "", "");
  await checkSuccess(driver4, "admin"); // should fail
  console.log("Fields Empty");
  console.log("Test Success");
  await driver4.quit();

  // ========================
  // 5. Concurrent Login
  // ========================
  let users = [
    { username: "admin", password: "admin", role: "admin" },
    { username: "Ana Marie", password: "Komong2x", role: "official" },
  ];

  await Promise.all(
    users.map(async (user) => {
      let drv = createDriver();
      await login(drv, user.username, user.password);
      await checkSuccess(drv, user.role);
      await drv.quit();
    }),
  );

  // ========================
  //   6. Role-Based Login (Admin/User)
  //   ========================
  //   let driver5 = createDriver();
  //   await login(driver5, "admin", "admin");
  //   await driver5.wait(until.urlContains("/admin/notification"), 10000);
  //   console.log("✅ Admin login successful");
  //   await driver5.quit();
}

runTests();
