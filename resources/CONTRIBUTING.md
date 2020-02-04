# Guidelines
All potentially reusable data will live in the `resources` folder.  This is usually going to be json file but could be yaml or some other extention I'm not currently thinking of.  

# Pages or Object Repository

This is an attempt at making a central location for defining how the selenium tests find the elements on given pages.  
* the root level is the name of any webelement on the page
* anything that's not a webelement but usedful for test scenarios please add that to the `utils` section

### Defining XPath
When using the page objects all of them us XPath by default to find elements.  Within the xpath is very easily to intelligently find elements.

Recommended approach for finding elements (in order)
1. data-nw-id - This is a unique id that we add to the dom
    * example:`//div[@data-nw-id='Log in']`
1. id - This is typically unique enough to determine this is the expected element
    * example: `//div[@id='Log in']`
1. combination - Dynamically generated elements can be difficult and generally is good to use more than 1 value to find the elements.  
    * example: `//div[@data-nw-file='CreateMenuMd']//a[contains(text(), 'Work Order')]`
    * example: `//div[contains(@class, "some-class") and .//label[contains(text(), "${inputData.label}")]]//div/input`
1. text - Sometimes the only way to find an element is via text, keep in mind that its easy to find numerous places with the same text on a single page.  
    * example: `//text() = 'Flightboard'`
    * example: `//*[contains(text(), 'Flightboard')]`

**Note - xpath has function, like the contains() function just above this line.  If you are wanting to get deeper into learning about the best ways to find elements [this is a good guide](https://www.guru99.com/using-contains-sbiling-ancestor-to-find-element-in-selenium.html)

#TODO test data generator

#TODO other data like 'users'


