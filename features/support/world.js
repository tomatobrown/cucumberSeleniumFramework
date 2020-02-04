const Promise = require(`bluebird`);
const { setWorldConstructor } = require(`cucumber`);
const _ = require(`lodash`);
const rp = require(`request-promise`);
const webdriver = require(`selenium-webdriver`);
const { checkedLocator } = require(`selenium-webdriver/lib/by`);
const {
  PLATFORM,
  ENVIRONMENT,
  SELENIUM_GRID_IP,
} = require(`../../environment`);
const { retry } = require(`../../utils`);
const { ResourceLoader } = require(`../../utils/resource`);
const { buildDriver, isMobileEmulation } = require(`../../utils/driver`);
const { getAppUrlForEnv } = require(`../../utils/url`);

// share a resource loader instance unless overridden
const resourceLoader = new ResourceLoader();

const privateProperties = new WeakMap();

class World {
  constructor({
                attach, environment = ENVIRONMENT, parameters, platform = PLATFORM,
              }) {
    privateProperties.set(this, {
      env: environment,
      platform,
    });

    // browser driver instance
    this.driver = buildDriver(platform);

    // attaching screenshots to report
    this.attach = attach;
    this.parameters = parameters;

    // project-specific setting holder
    // loaded and set during Before hook
    this.settings = {};

    this.resourceLoader = resourceLoader;

    // make gherkin text available throughout test
    this.scenario = null;
  }

  get env() {
    return privateProperties.get(this).env;
  }

  get environment() {
    return this.env;
  }

  get featureFile() {
    const uri = _.get(this.scenario, `sourceLocation.uri`);
    if (!uri) {
      throw new Error(`Cucumber Scenario is not defined`);
    }
    return uri.match(/\w+\./)[0].slice(0, -1);
  }

  get appUrl() {
    return getAppUrlForEnv(this.env);
  }

  get isBrowser() {
    return _.isFunction(this.driver.manage);
  }

  get platform() {
    return privateProperties.get(this).platform;
  }

  /**
   * Get a JSON resource object
   */
  loadResource(location) {
    return this.resourceLoader.loadResource(location);
  }

  /**
   * Get a path of resource file
   */
  getResourcePath(location) {
    return this.resourceLoader.getResourcePath(location);
  }

  /**
   * Easy switch browser tabs
   */
  async switchTab(tabNum = `1`) {
    if (!this.isBrowser) {
      throw new Error(`Platform set to NONE, no browser no tabs`);
    }
    return this.safelyGetWindowHandles()
      .then(handles => this.driver.switchTo()
        .window(handles[tabNum]));
  }

  /**
   * Wait for an element using a Selenium wait function
   * @param {string|object} locator - element to wait for
   *   If the locator is a string it is converted to a locator object.
   *   XPath will be used if it starts with "//".
   *   Non-strings will be passed to the `criteria` function unaltered.
   * @param {string|function} [criteria] - function or method name to use to create a wait Condition
   *   A string will be used to resolve a method on `webdriver.until`. Default is "elementsLocated".
   * @param {number} [timeoutMs] - milliseconds to wait for the condition to be satisfied
   * @return {object|object[]} Promise for element(s) found
   */
  waitFor(locator, { criteria, timeoutMs } = {}) {
    timeoutMs = timeoutMs > 0 ? timeoutMs : this.defaultWaitForTimeout;
    if (!this.isBrowser) {
      throw new Error(`Tests are not running on a web browser, no webElements to wait for`);
    }
    return Promise.try(() => {
      if (_.isString(locator)) {
        if (locator.indexOf(`//`) === 0 || locator.indexOf(`(//`) === 0) {
          locator = checkedLocator({ xpath: locator });
        } else {
          locator = checkedLocator({ css: locator });
        }
      }
      if (_.isString(criteria)) {
        const fn = webdriver.until[criteria] || World.waitConditions[criteria];
        if (_.isFunction(fn)) {
          criteria = fn;
        } else {
          throw new Error(`${criteria} is not a method on \`webdriver.until\` or \`World.waitConditions\``);
        }
      } else if (!_.isFunction(criteria)) {
        criteria = webdriver.until.elementsLocated;
      }
      return this.driver.wait(criteria(locator), timeoutMs);
    });
  }

  retry(action, timeoutMs, intervalMs) {
    const { retryTimeoutMs, retryIntervalMs } = this.settings;
    timeoutMs = timeoutMs || retryTimeoutMs || 15000;
    intervalMs = intervalMs || retryIntervalMs || 100;
    return retry(action, timeoutMs, intervalMs);
  }

  isMobileEmulation() {
    return isMobileEmulation(this.platform);
  }

  getSessionId() {
    return this.driver.getSession()
      .then(session => session.getId());
  }

  async getBrowserVersion() {
    const session = await this.driver.getSession();
    const version = await session.getCapability(`version`) || await session.getCapability(`browserVersion`);
    return version;
  }

  async getChromedriverVersion() {
    const session = await this.driver.getSession();
    const capabilities = await session.getCapability(`chrome`);
    if (!capabilities) {
      throw new Error(`Chromedriver not found for platform "${this.platform}"`);
    }
    return capabilities.chromedriverVersion;
  }

  async getProxyId() {
    const sessionQuery = await rp({
      uri: `${SELENIUM_GRID_IP}/grid/api/testsession?session=${await this.getSessionId()}`,
      method: `GET`,
      json: true,
    });
    return sessionQuery.proxyId;
  }

  async safelyGetWindowHandles(delay) {
    // getAllWindowHandles can hang Selenium if called before new tab initializes
    delay = delay || this.settings.windowHandlesDelay || 2000;
    await Promise.delay(delay);
    return this.driver.getAllWindowHandles();
  }
}

World.waitConditions = Object.freeze({
  elementNotLocated: locator => new webdriver.Condition(
    `for element not to be located ${locator}`,
    driver => driver.findElements(locator)
      .then(els => els.length === 0),
  ),
  elementIsClickable: element => new webdriver.WebElementCondition(
    `until element is clickable`,
    () => element.click()
      .then(() => element)
      .catch(() => null),
  ),
});

setWorldConstructor(World);

module.exports = World;
