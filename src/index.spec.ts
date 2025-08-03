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
      cy.get('#btn-plus').click();

      cy.get('p')
        .contains('esto es verde si el contador es positivo')
        .should('have.class', '!text-green-700');
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

  describe('Conditional Rendering', () => {
    describe('Hidden attribute', () => {
      it('should show element when showHidden is false', () => {
        cy.get('p').contains('Secret value').should('be.visible');
      });

      it('should hide element when showHidden is toggled to true', () => {
        cy.get('button').contains('toggle showHidden').click();
        cy.get('p').contains('Secret value').should('not.be.visible');
      });

      it('should show element when showHidden is toggled back to false', () => {
        cy.get('button').contains('toggle showHidden').click();
        cy.get('button').contains('toggle showHidden').click();
        cy.get('p').contains('Secret value').should('be.visible');
      });
    });

    describe('x-if Component', () => {
      it('should show content when showIf is true', () => {
        cy.get('button').contains('toggle showIf').click();
        cy.get('p').contains('ShowIf is true').should('be.visible');
        cy.get('p').contains('ShowIf is false').should('not.exist');
      });

      it('should show content when showIf is false', () => {
        // Ensure showIf is false initially
        cy.get('button').contains('toggle showIf').click();
        cy.get('button').contains('toggle showIf').click();

        cy.get('p').contains('ShowIf is false').should('be.visible');
        cy.get('p').contains('ShowIf is true').should('not.exist');
      });

      it('should toggle between true and false content', () => {
        // Initially should show false content
        cy.get('p').contains('ShowIf is false').should('be.visible');
        cy.get('p').contains('ShowIf is true').should('not.exist');

        // Click to toggle to true
        cy.get('button').contains('toggle showIf').click();
        cy.get('p').contains('ShowIf is true').should('be.visible');
        cy.get('p').contains('ShowIf is false').should('not.exist');

        // Click to toggle back to false
        cy.get('button').contains('toggle showIf').click();
        cy.get('p').contains('ShowIf is false').should('be.visible');
        cy.get('p').contains('ShowIf is true').should('not.exist');
      });

      it('should not render when no condition is provided', () => {
        cy.get('p')
          .contains('this should not be rendered because no condition')
          .should('not.exist');
      });

      it('should not render when static value is provided', () => {
        cy.get('p')
          .contains('this should not be rendered because static value')
          .should('not.exist');
      });

      it('should not render when var name is wrong', () => {
        cy.get('p')
          .contains('this should not be rendered because var name is wrong')
          .should('not.exist');
      });
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
});
