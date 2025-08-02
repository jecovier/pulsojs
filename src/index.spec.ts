// Cypress test file for component system
// The component system is loaded via the HTML file

describe('Component System Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('x-state Component', () => {
    it('should initialize with basic state', () => {
      cy.get('x-state').should('exist');
      cy.get('x-state').should('have.attr', 'value');
    });

    it('should handle nested state objects', () => {
      cy.get('x-state').first().should('contain', 'John');
      cy.get('x-state').first().should('contain', 'apple');
      cy.get('x-state').first().should('contain', '1');
    });
  });

  describe('x-var Component', () => {
    it('should display simple variable values', () => {
      cy.get('x-var[name]').should('contain', 'John');
    });

    it('should display array elements', () => {
      cy.get('x-var').contains('apple').should('exist');
      cy.get('x-var').contains('banana').should('exist');
      cy.get('x-var').contains('cherry').should('exist');
    });

    it('should display deep nested properties', () => {
      cy.get('x-var').contains('1').should('exist'); // activities.walking.likes
    });

    it('should display first fruit from array', () => {
      cy.contains('First fruit: apple').should('exist');
    });

    it('should display walking likes', () => {
      cy.contains('Walking likes: 1').should('exist');
    });
  });

  describe('x-elm Component', () => {
    it('should handle click events', () => {
      cy.window().then(win => {
        cy.stub(win, 'alert').as('alertStub');

        cy.get('button').contains('what is my name?').click();
        cy.get('@alertStub').should('have.been.calledWith', 'John');
      });
    });

    it('should handle reactive attributes', () => {
      cy.get('p')
        .contains('esto es verde si el contador es positivo')
        .should('not.have.class', '!text-green-700');

      // Click increment button
      cy.get('button').contains('+').click();

      cy.get('p')
        .contains('esto es verde si el contador es positivo')
        .should('have.class', '!text-green-700');
    });

    it('should handle hidden attribute', () => {
      // Initially counter is 0, so "Counter is greater than 0" should be hidden
      cy.get('p')
        .contains('Counter is greater than 0')
        .should('not.be.visible');
      cy.get('p')
        .contains('Counter is less than or equal to 0')
        .should('be.visible');

      // Click increment button
      cy.get('button').contains('+').click();

      // Now counter is 1, so "Counter is greater than 0" should be visible
      cy.get('p').contains('Counter is greater than 0').should('be.visible');
      cy.get('p')
        .contains('Counter is less than or equal to 0')
        .should('not.be.visible');
    });
  });

  describe('x-for Component', () => {
    it('should render list items with $item', () => {
      cy.get('#for-items-test').within(() => {
        cy.get('li').should('have.length', 3);
        cy.get('li').eq(0).should('contain', 'apple');
        cy.get('li').eq(1).should('contain', 'banana');
        cy.get('li').eq(2).should('contain', 'cherry');
      });
    });

    it('should render list items with custom "as" attribute', () => {
      cy.get('#for-as-test').within(() => {
        cy.get('li').should('have.length', 3);
        cy.get('li').eq(0).should('contain', 'apple');
        cy.get('li').eq(1).should('contain', 'banana');
        cy.get('li').eq(2).should('contain', 'cherry');
      });
    });

    it('should apply different styling to different for loops', () => {
      cy.get('ul')
        .first()
        .within(() => {
          cy.get('li').should('have.class', 'text-green-500');
        });

      cy.get('ul')
        .last()
        .within(() => {
          cy.get('li').should('have.class', 'text-red-500');
        });
    });
  });

  describe('x-if Component', () => {
    it('should show content when condition is true', () => {
      // Set counter to 1
      cy.get('#btn-reset').click();
      cy.get('#btn-plus').click();

      cy.get('p').contains('Counter is not 1').should('not.exist');
      cy.get('p').contains('Counter is 1').should('be.visible');
    });

    it('should hide content when condition is false', () => {
      // Counter starts at 0
      cy.get('#btn-reset').click();

      cy.get('p').contains('Counter is 1').should('not.exist');
      cy.get('p').contains('Counter is not 1').should('be.visible');
    });

    it('should handle invalid expressions gracefully', () => {
      cy.get('p')
        .contains(
          'this should not be rendered because counterr is not a valid state'
        )
        .should('not.exist');
    });

    it('should handle static expressions', () => {
      cy.get('p')
        .contains(
          'this should not be rendered because $state.counter is not a valid state'
        )
        .should('not.exist');
    });

    it('should handle missing value attribute', () => {
      cy.get('p')
        .contains('this should not be rendered because there is no attribute')
        .should('not.exist');
    });
  });

  describe('Reactivity Tests', () => {
    it('should update counter when buttons are clicked', () => {
      cy.get('p').contains('Counter: 0').should('exist');

      // Increment
      cy.get('#btn-plus').click();
      cy.get('p').contains('Counter: 1').should('exist');

      // Increment again
      cy.get('#btn-plus').click();
      cy.get('p').contains('Counter: 2').should('exist');

      // Decrement
      cy.get('#btn-minus').click();
      cy.get('p').contains('Counter: 1').should('exist');

      // Reset
      cy.get('#btn-reset').click();
      cy.get('p').contains('Counter: 0').should('exist');
    });

    it('should update conditional styling based on state', () => {
      cy.get('p')
        .contains('esto es verde si el contador es positivo')
        .should('not.have.class', '!text-green-700');

      // Increment counter
      cy.get('#btn-plus').click();

      cy.get('p')
        .contains('esto es verde si el contador es positivo')
        .should('have.class', '!text-green-700');
    });
  });

  describe('Complex State Tests', () => {
    it('should handle complex nested state from HTML example', () => {
      // Test name display
      cy.get('p').contains('My name is John').should('exist');

      // Test array access
      cy.get('p').contains('First fruit: apple').should('exist');

      // Test deep nested object access
      cy.get('p').contains('Walking likes: 1').should('exist');
    });

    it('should handle multiple state contexts', () => {
      // First state context
      cy.get('x-state')
        .first()
        .within(() => {
          cy.get('p').contains('My name is John').should('exist');
        });

      // Second state context (counter)
      cy.get('x-state')
        .last()
        .within(() => {
          cy.get('p').contains('Counter: 0').should('exist');
        });
    });
  });

  describe('UI/UX Tests', () => {
    it('should have proper layout and styling', () => {
      cy.get('main').should('have.class', 'flex');
      cy.get('main').should('have.class', 'flex-col');
      cy.get('main').should('have.class', 'justify-center');
      cy.get('main').should('have.class', 'min-h-screen');
      cy.get('main').should('have.class', 'max-w-xl');
    });

    it('should have proper button styling', () => {
      cy.get('button').should('have.class', 'btn');
    });

    it('should have proper section organization', () => {
      cy.get('section').should('have.length.at.least', 1);
      cy.get('h3').should('have.length.at.least', 1);
    });
  });
});
