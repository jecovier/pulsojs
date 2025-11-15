// Cypress test file for async state functionality
// Tests the various async state scenarios in async-state.html

describe('Async State Tests', () => {
  beforeEach(() => {
    cy.visit('/async-state.html');
  });

  describe('Normal State', () => {
    it('should initialize with basic state value', () => {
      cy.get('x-context').first().should('have.attr', 'value');
      cy.get('x-context').first().should('contain', 'John');
    });

    it('should display name from state', () => {
      cy.get('x-context')
        .first()
        .within(() => {
          cy.get('p').should('contain', 'My name is John');
        });
    });

    it('should show conditional content when name is John', () => {
      cy.get('x-context')
        .first()
        .within(() => {
          cy.get('p').should('contain', 'John is here');
        });
    });
  });

  describe('No State', () => {
    it('should handle x-context without initial value', () => {
      cy.get('x-context').eq(1).should('exist');
      cy.get('x-context').eq(1).should('not.have.attr', 'value');
    });

    it('should display empty name when no state is provided', () => {
      cy.get('x-context')
        .eq(1)
        .within(() => {
          cy.get('p').should('contain', 'My name is');
          // The name should be empty since no state was provided
          cy.get('x-text[value]').should('contain', '');
        });
    });
  });

  describe('Async Value State', () => {
    it('should initially show empty name', () => {
      cy.get('#async-state-value').within(() => {
        cy.get('p').should('contain', 'My name is');
        cy.get('x-text[value]').should('contain', '');
      });
    });

    it('should update name after async value is set', () => {
      // Wait for the setTimeout to execute (1000ms)
      cy.wait(1100);

      cy.get('#async-state-value').within(() => {
        cy.get('p').should('contain', 'My name is Jose');
        cy.get('x-text[value]').should('contain', 'Jose');
      });
    });

    it('should handle the async value update correctly', () => {
      // Check initial state
      cy.get('#async-state-value').within(() => {
        cy.get('x-text[value]').should('contain', '');
      });

      // Wait for async update and verify
      cy.wait(1100);
      cy.get('#async-state-value').within(() => {
        cy.get('x-text[value]').should('contain', 'Jose');
      });
    });
  });

  describe('Async SetState', () => {
    it('should initially show default content', () => {
      cy.get('#async-state-set-state').within(() => {
        cy.get('p').should('contain', 'My name is xxx');
        // The conditional content should not be visible initially
        cy.get('p').should('not.contain', 'Jane is here');
      });
    });

    it('should update name and show conditional content after setState', () => {
      // Wait for the setTimeout to execute (2000ms)
      cy.wait(2100);

      cy.get('#async-state-set-state').within(() => {
        cy.get('p').should('contain', 'My name is Jane');
        cy.get('x-text[value]').should('contain', 'Jane');
        // The conditional content should now be visible
        cy.get('p').should('contain', 'Jane is here');
      });
    });

    it('should handle the setState update correctly', () => {
      // Check initial state
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'xxx');
        cy.get('p').should('not.contain', 'Jane is here');
      });

      // Wait for async update and verify
      cy.wait(2100);
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'Jane');
        cy.get('p').should('contain', 'Jane is here');
      });
    });
  });

  describe('Timing and Async Behavior', () => {
    it('should handle different timing for different async operations', () => {
      // Initially all async states should be empty/default
      cy.get('#async-state-value').within(() => {
        cy.get('x-text[value]').should('contain', '');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'xxx');
      });

      // After 1 second, first two should be updated
      cy.wait(1100);
      cy.get('#async-state-value').within(() => {
        cy.get('x-text[value]').should('contain', 'Jose');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'xxx');
      });

      // After 2 seconds, all should be updated
      cy.wait(1000);
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'Jane');
        cy.get('p').should('contain', 'Jane is here');
      });
    });
  });

  describe('State Reactivity', () => {
    it('should maintain reactivity after async updates', () => {
      // Wait for all async updates to complete
      cy.wait(2100);

      // Verify all states are properly reactive
      cy.get('#async-state-value').within(() => {
        cy.get('x-text[value]').should('contain', 'Jose');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-text[value]').should('contain', 'Jane');
        cy.get('p').should('contain', 'Jane is here');
      });
    });

    it('should handle conditional rendering correctly after async updates', () => {
      // Wait for async updates
      cy.wait(2100);

      // Check that conditional content appears correctly
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-if > p').should('contain', 'Jane is here');
      });
    });
  });

  describe('State API', () => {
    it('should update state using stateRef', () => {
      cy.wait(0); // Wait for DOMContentLoaded event
      cy.get('#async-state-set-state-api').within(() => {
        cy.get('x-text[value]').should('contain', 'Jane');
      });
    });

    it('should update state using state signal', () => {
      cy.wait(2100);
      cy.get('#async-state-set-state-api').within(() => {
        cy.get('x-text[value]').should('contain', 'John');
      });
    });

    it('should trigger effect when state changes', () => {
      cy.window().then(win => {
        cy.spy(win.console, 'log').as('consoleLog');
      });

      cy.wait(1100);

      cy.get('@consoleLog').should('have.been.calledWith', 'John');
    });
  });
});
