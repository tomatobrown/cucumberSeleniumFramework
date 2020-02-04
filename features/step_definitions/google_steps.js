const {expect} = require(`chai`);
const {Given, When, Then} = require(`cucumber`);
const {setTextBox} = require('../../utils/common/elements');
const {getElementText} = require('../../utils/common/getters');
const googlePage = require('../../resources/pages/googleSearch');

/**
 * @example <caption>Gherkin</caption>
 * Given I am on 'google.com'
 * @memberof Google Search
 * @name Given-I-am-on-'(\S+)'
 */
Given(/^I am on '(\S+)'/, async function (url) {
  await this.driver.get(`https://${url}`);
});

/**
 * @example <caption>Gherkin</caption>
 * When I search for '(\S+)'
 * @memberof Google Search
 * @name When-I-search-for-'(\S+)'
 */
When(/^I search for '(\S+)'/, async function (searchValue) {
  await setTextBox(this, googlePage.searchBox, `${searchValue}\n`);
});

/**
 * @example <caption>Gherkin</caption>
 * Then the top results should contain '<searchValue>'
 * @memberof Google Search
 * @name Then-the-top-results-should-contain-'<searchValue>'
 */
Then(/^the top results should contain '(\S+)'/, async function (expectedValue) {
  const actualTopResults = await getElementText(this, googlePage.topResult);
  expect(actualTopResults).to.include(expectedValue);
});
