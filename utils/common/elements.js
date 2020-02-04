const Promise = require(`bluebird`);
const { expect } = require(`chai`);
const xPathToCss = require(`xpath-to-css`);
const { Key } = require(`selenium-webdriver`);

module.exports = {
  clickElement: async (world, selector, waitForMs = 6000, retryMs = 50) => {
    await world.retry(async () => {
      await world.waitFor(selector)
        .then(async ([el]) => expect(await world.waitFor(el, { criteria: `elementIsClickable` })).to.be.equal(el));
    }, waitForMs, retryMs);
  },

  clickStoppedElement: (world, selector, waitForMs = 3000, retryMs = 50) => {
    let prevLocation = {};
    return world.retry(async () => {
      const [el] = await world.waitFor(selector);
      const location = await el.getLocation();

      if (prevLocation.x !== location.x || prevLocation.y !== location.y) {
        prevLocation = location;
        throw new Error(`element is moving! try again`);
      }
      await Promise.delay(200);
      el.click();
    }, waitForMs, retryMs);
  },

  displayedElement: async element => element.isDisplayed(),

  scrollToElementAndClick: async (world, element) => {
    await world.driver.executeScript(`arguments[0].scrollIntoView()`, element);
    return element.click();
  },

  setCheckBox: async (world, locator, value) => {
    await world.retry(async () => {
      await world.waitFor(locator)
        .then(async ([checkBox]) => {
          const state = await checkBox.getAttribute(`checked`);
          if ((state === null && value === `checked`) || (state === true && value === `unchecked`)) {
            return checkBox.click();
          }
          return true;
        });
    });
  },

  setDateBox: async (world, locator, value) => {
    await world.retry(async () => {
      const elValue = await world.waitFor(locator).then(([el]) => el.getAttribute(`value`));
      await world.waitFor(locator)
        .then(async ([dateBox]) => {
          await dateBox.sendKeys(Key.END);
          await dateBox.sendKeys(Key.BACK_SPACE.repeat(elValue.length));
          await dateBox.sendKeys(`${value}`);
        });
    });
  },

  setDropDown: async (world, locator, value, checkSelected = true) => {
    await world.retry(async () => {
      await world.waitFor(`${locator}//option[contains(text(),'${value}')]`).then(([el]) => el.click());
      if (checkSelected) {
        const css = await xPathToCss(locator);
        const actualText = await world.waitFor(`${css} option:checked`).then(([el]) => el.getText());
        expect(actualText).to.include(value);
      }
    });
  },

  setRadioButton: async (world, locator, value) => {
    await world.retry(async () => {
      await world.waitFor(locator)
        .then(async ([checkBox]) => {
          const state = await checkBox.getAttribute(`checked`);
          if (state === null && value === `true`) {
            return checkBox.click();
          }
          if (state === null && value === `false`) {
            return true;
          }
          if (state === true && value === `true`) {
            return true;
          }
          if (state === true && value === `false`) {
            return checkBox.click();
          }
        });
    });
  },

  setTextBox: async (world, locator, value, postKeyAction = null, index = 0) => {
    await world.retry(async () => {
      await world.waitFor(locator)
        .then(async (textBox) => {
          await textBox[index].clear();
          await textBox[index].sendKeys(`${Key.CONTROL}a`);
          await textBox[index].sendKeys(value);
          if (postKeyAction) {
            await textBox[index].sendKeys(postKeyAction);
          }
        });
    });
  },

  setTextBoxDropDown: async (world, locator, value, postKeyAction, index = 0) => {
    await world.retry(async () => {
      const txtBox = await world.waitFor(locator);
      await txtBox[index].click();
      await world.driver.actions()
        .click(txtBox[index])
        .sendKeys(`${value}\t`)
        .perform();
    });
    await world.waitFor(`//*[@class='Select-loading-zone']`, { criteria: `elementNotLocated` });
    await Promise.delay(1000); // need to wait extra to use the next textbox on same page
    if (postKeyAction) {
      await world.driver.actions().sendKeys(postKeyAction)
        .perform();
    }
  },

  setReactDropDown: async (world, locator, value) => {
    await world.retry(async () => {
      const [el] = await world.waitFor(locator, { timeoutMs: 3000 });
      await world.driver.actions()
        .click(el)
        .sendKeys(value.charAt(0))
        .sendKeys(value.charAt(1))
        .sendKeys(value.charAt(2))
        .sendKeys(value.charAt(3))
        .perform();
      await Promise.delay(300); // delay for populating dropdown suggestions
      await world.driver.actions().sendKeys(Key.RETURN)
        .perform();
    });
  },
};
