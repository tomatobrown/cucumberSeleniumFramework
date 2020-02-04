const webdriver = require(`selenium-webdriver`);
const { SELENIUM_GRID_IP, GRID, CHROME_VERSION } = require(`../environment`);

function isMobileEmulation(platform) {
  switch (platform.toUpperCase()) {
    case `CHROME`:
    case `FIREFOX`:
    case `IE`:
    case `ANDROID`:
    case `BS-CHROME`:
    case `BS-IE`:
    case `NONE`:
      return false;
    default:
      return true;
  }
}

const buildAndroidDriver = function () {
  return new webdriver.Builder().usingServer(`http://localhost:4723/wd/hub`)
    .withCapabilities({
      platformName: `Android`,
      platformVersion: `4.4`,
      deviceName: `Android Emulator`,
      browserName: `Chrome`,
    })
    .build();
};

const buildChromeDriver = function (capabilities = webdriver.Capabilities.chrome(), settings = {}) {
  require(`chromedriver`); // eslint-disable-line global-require
  const chromeOptions = {
    w3c: false,
    args: [],
  };

  if (settings.userAgent) {
    chromeOptions.args.push(`--user-agent=${settings.userAgent}`);
  }
  if (process.env.HEADLESS === `true`) {
    chromeOptions.args.push(`--headless`);
    chromeOptions.args.push(`--disable-gpu`);
    chromeOptions.args.push(`--window-size=1400x1000`);
  }
  if (CHROME_VERSION !== null) {
    capabilities.set(`version`, CHROME_VERSION);
  }
  if (settings.chromeVersion) {
    // Override environment settings
    capabilities.set(`version`, settings.chromeVersion);
  }
  if (settings.applicationName) {
    capabilities.set(`applicationName`, settings.applicationName);
  }
  if (settings.mobileOptions) {
    let config;
    if (settings.mobileOptions.deviceName === `custom_mobile_emulation`) {
      config = {
        deviceMetrics: {
          width: parseInt(process.env.MOBILE_WIDTH, 10),
          height: parseInt(process.env.MOBILE_HEIGHT, 10),
        },
      };
    } else {
      config = settings.mobileOptions;
    }
    chromeOptions.mobileEmulation = config;
  }

  capabilities.set(`goog:chromeOptions`, chromeOptions);

  if (GRID === true) {
    return new webdriver.Builder()
      .usingServer(`${SELENIUM_GRID_IP}/wd/hub`)
      .withCapabilities(capabilities);
  }
  return new webdriver.Builder()
    .withCapabilities(capabilities);
};

const buildIEDriver = function (capabilities = webdriver.Capabilities.ie()) {
  capabilities.set(`ignoreProtectedModeSettings`, true);
  capabilities.set(`ie.ensureCleanSession`, true);
  capabilities.set(`enableElementCacheCleanup`, true);
  capabilities.set(`ignoreZoomSetting`, true);
  capabilities.set(`version`, `ie11`);

  if (GRID === true) {
    return new webdriver.Builder()
      .usingServer(`${SELENIUM_GRID_IP}/wd/hub`)
      .withCapabilities(capabilities);
  }
  return new webdriver.Builder()
    .withCapabilities(capabilities);
};

const buildFirefoxDriver = function (capabilities = webdriver.Capabilities.firefox()) {
  if (GRID === true) {
    return new webdriver.Builder()
      .usingServer(`${SELENIUM_GRID_IP}/wd/hub`)
      .withCapabilities(capabilities);
  }
  return new webdriver.Builder()
    .withCapabilities(capabilities);
};

const buildBSChromeDriver = function (capabilities = { ...win10Chrome70, ...bsKey }) {
  return new webdriver.Builder()
    .usingServer(`http://hub-cloud.browserstack.com/wd/hub`)
    .withCapabilities(capabilities)
    .build();
};

const buildBSIEDriver = function (capabilities = { ...win10IE11, ...bsKey }) {
  return new webdriver.Builder()
    .usingServer(`http://hub-cloud.browserstack.com/wd/hub`)
    .withCapabilities(capabilities)
    .build();
};

const buildDriver = function (platform) {
  if (isMobileEmulation(platform)) {
    const mobileOptions = { deviceName: platform };
    return buildChromeDriver(undefined, { mobileOptions });
  }

  const prefs = new webdriver.logging.Preferences();
  prefs.setLevel(webdriver.logging.Type.BROWSER, webdriver.logging.Level.ALL);
  let driverInstance = null;

  switch (platform.toUpperCase()) {
    case `ANDROID`:
      return buildAndroidDriver();
    case `CHROME`:
      driverInstance = buildChromeDriver();
      break;
    case `FIREFOX`:
      driverInstance = buildFirefoxDriver();
      break;
    case `IE`:
      driverInstance = buildIEDriver();
      break;
    case `BS-CHROME`:
      return buildBSChromeDriver();
    case `BS-IE`:
      return buildBSIEDriver();
    case `NONE`:
      return {};
    default:
      return {}; // assume restful tests
  }
  return driverInstance.setLoggingPrefs(prefs)
    .build();
};

module.exports = {
  buildAndroidDriver,
  buildChromeDriver,
  buildBSChromeDriver,
  buildIEDriver,
  buildFirefoxDriver,
  buildDriver,
  isMobileEmulation,
};
