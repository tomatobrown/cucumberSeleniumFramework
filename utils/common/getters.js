const { expect } = require(`chai`);
const { By } = require(`selenium-webdriver`);
const _ = require(`lodash`);
const xPathToCss = require(`xpath-to-css`);

module.exports = {

  async getElementText(world, locator, index = 0) {
    return world.retry(async () => {
      const element = await world.waitFor(locator, { timeoutMs: 3000 });
      const actualText = await element[index].getText();
      expect(actualText.length).to.be.above(0);
      return actualText;
    });
  },

  async getSelectedText(world, locator) {
    const css = await xPathToCss(locator);
    const [element] = await world.waitFor(`${css} option:checked`);
    return element.getText();
  },

  async getElementAttribute(world, locator, attribute, index = 0) {
    return world.retry(async () => {
      const element = await world.waitFor(locator, { timeoutMs: 3000 });
      return element[index].getAttribute(attribute);
    });
  },
  async getElementsLength(world, locator) {
    const elements = await world.driver.findElements(By.xpath(locator));
    return elements.length;
  },
  async getProject(world, alias) {
    return _.filter(world.testData.projects, x => x.alias.includes(alias))[0];
  },
  async getClient(world, alias) {
    return _.filter(world.testData.clients, x => x.alias.includes(alias))[0];
  },
  async getTemplate(world, alias) {
    const tName = Object.keys(world.testData.raw).filter(x => x.includes(alias));
    return world.testData.raw[tName];
  },
  async getUser(world, alias) {
    return _.filter(world.testData.users, x => x.alias.includes(alias))[0];
  },
  async getWorkOrderTitle(world, alias) {
    const wo = _.filter(world.testData.workorders, x => x.alias.includes(alias))[0];
    return wo.workorder.service_title;
  },
  async getWorkOrderIdFromUrl(world) {
    const url = await world.driver.getCurrentUrl();
    const pieces = url.split(`/`);
    return pieces[pieces.length - 1].split(`?`)[0];
  },
};
