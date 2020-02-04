Feature: Google Search

  Scenario Outline: Google search returns valid result
    Given I am on 'google.com'
    When I search for '<searchValue>'
    Then the top results should contain '<searchValue>'
    Examples:
      | searchValue  |
      | Picard       |
      | Worf         |
