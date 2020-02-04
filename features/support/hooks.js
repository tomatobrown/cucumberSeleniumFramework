/* eslint-disable no-console */
const _ = require(`lodash`);
const {Before, After, Status} = require(`cucumber`);
const {ENVIRONMENT, PLATFORM} = require(`../../environment`);
const {getRandomString} = require(`../../utils`);

console.log(`running against environment "${ENVIRONMENT}"`);
console.log(`testing on platform "${PLATFORM}"`);

Before(async function (scenario) {
  console.log(`Running: ${scenario.pickle.name}`);
  process.env.runningFeatureUri = scenario.sourceLocation.uri;

  const reuseDataFlag = _.filter(scenario.pickle.tags, x => x.name === `@reuseData`).length > 0;
  if (process.env.currentFeatureUri
    && process.env.runningFeatureUri === process.env.currentFeatureUri && reuseDataFlag) {
    this.randomString = process.env.randomString;
    if (process.env.testData !== `false`) {
      this.testData = JSON.parse(process.env.testData);
    }
  } else {
    process.env.currentFeatureUri = process.env.runningFeatureUri;
    this.randomString = await getRandomString(16);
    process.env.randomString = this.randomString;
  }

  this.scenario = scenario;
  this.defaultWaitForTimeout = this.settings.waitForTimeoutMs
    ? this.settings.waitForTimeoutMs : 30000;

  await this.driver.manage().window().maximize();

  // setting os variable
  this.os = process.platform;
});

After(async function ({result = {}, status}) {
  /**
   * Cucumber 2: https://github.com/cucumber/cucumber-js/blob/2.x/src/models/scenario_result.js
   *   {duration, failureException, scenario, status, stepResults}
   * Cucumber 3: https://github.com/cucumber/cucumber-js/blob/master/docs/support_files/api_reference.md#afteroptions-fn
   *   {sourceLocation: {line, uri}, result: {duration, status}, pickle}
   */
  status = result.status || status; // Cucumber 3 || 2
  if (this.isBrowser) { // account for non-selenium tests
    try {
      if (status === Status.FAILED) {
        if (process.env.VERBOSITY === `HIGH`) {
          // Attaching browser log to report
          await this.attach(`Browser Logs: ${JSON.stringify(browserLogs, 0, 2)}`);
          if (this.reportData && Object.keys(this.reportData).length > 0) {
            await this.attach(`TDG info: ${JSON.stringify(this.reportData, 0, 2)}`);
          }
        }
        // Attaching screenshot to report
        const screenshot = await this.driver.takeScreenshot();
        await this.attach(screenshot, `image/png`);
      }
      if (!process.env.testData || process.env.testData === `false` || process.env.currentFeatureUri !== process.env.runningFeatureUri) {
        if (this.testData && Object.keys(this.testData).length > 0) {
          process.env.testData = JSON.stringify(this.testData);
          process.env.randomString = this.randomString;
        } else {
          process.env.testData = false;
        }
      }
      await this.driver.manage().deleteAllCookies();
    } catch (error) {
      console.error(error);
    }
    await this.driver.quit();
  }
});
