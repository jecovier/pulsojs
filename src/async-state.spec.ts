// Cypress test file for async state functionality
// Tests the various async state scenarios in async-state.html

describe('Async State Tests', () => {
  beforeEach(() => {
    cy.visit('/async-state.html');
  });

  describe('Normal State', () => {
    it('should initialize with basic state value', () => {
      cy.get('x-state').first().should('have.attr', 'value');
      cy.get('x-state').first().should('contain', 'John');
    });

    it('should display name from state', () => {
      cy.get('x-state')
        .first()
        .within(() => {
          cy.get('p').should('contain', 'My name is John');
        });
    });

    it('should show conditional content when name is John', () => {
      cy.get('x-state')
        .first()
        .within(() => {
          cy.get('p').should('contain', 'John is here');
        });
    });
  });

  describe('No State', () => {
    it('should handle x-state without initial value', () => {
      cy.get('x-state').eq(1).should('exist');
      cy.get('x-state').eq(1).should('not.have.attr', 'value');
    });

    it('should display empty name when no state is provided', () => {
      cy.get('x-state')
        .eq(1)
        .within(() => {
          cy.get('p').should('contain', 'My name is');
          // The name should be empty since no state was provided
          cy.get('x-var[name]').should('contain', '');
        });
    });
  });

  describe('Async Value State', () => {
    it('should initially show empty name', () => {
      cy.get('#async-state-value').within(() => {
        cy.get('p').should('contain', 'My name is');
        cy.get('x-var[name]').should('contain', '');
      });
    });

    it('should update name after async value is set', () => {
      // Wait for the setTimeout to execute (1000ms)
      cy.wait(1100);

      cy.get('#async-state-value').within(() => {
        cy.get('p').should('contain', 'My name is Jose');
        cy.get('x-var[name]').should('contain', 'Jose');
      });
    });

    it('should handle the async value update correctly', () => {
      // Check initial state
      cy.get('#async-state-value').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });

      // Wait for async update and verify
      cy.wait(1100);
      cy.get('#async-state-value').within(() => {
        cy.get('x-var[name]').should('contain', 'Jose');
      });
    });
  });

  describe('Async State Signals', () => {
    it('should initially show empty name', () => {
      cy.get('#async-state-signals').within(() => {
        cy.get('p').should('contain', 'My name is');
        cy.get('x-var[name]').should('contain', '');
      });
    });

    it('should NOT update name after setSignals is called', () => {
      // Wait for the setTimeout to execute (1000ms)
      cy.wait(1100);

      cy.get('#async-state-signals').within(() => {
        cy.get('p').should('not.contain', 'My name is Jane');
        cy.get('x-var[name]').should('not.contain', 'Jane');
      });
    });

    it('should NOT handle the setSignals update correctly', () => {
      // Check initial state
      cy.get('#async-state-signals').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });

      // Wait for async update and verify
      cy.wait(1100);
      cy.get('#async-state-signals').within(() => {
        cy.get('x-var[name]').should('not.contain', 'Jane');
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
        cy.get('x-var[name]').should('contain', 'Jane');
        // The conditional content should now be visible
        cy.get('p').should('contain', 'Jane is here');
      });
    });

    it('should handle the setState update correctly', () => {
      // Check initial state
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'xxx');
        cy.get('p').should('not.contain', 'Jane is here');
      });

      // Wait for async update and verify
      cy.wait(2100);
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'Jane');
        cy.get('p').should('contain', 'Jane is here');
      });
    });
  });

  describe('Component Structure', () => {
    it('should have all required sections', () => {
      cy.get('section').should('have.length', 5);
      cy.get('h3').should('contain', 'Normal');
      cy.get('h3').should('contain', 'No state');
      cy.get('h3').should('contain', 'Async Value State');
      cy.get('h3').should('contain', 'Async State Signals');
      cy.get('h3').should('contain', 'Async State');
    });

    it('should have proper x-state elements with IDs', () => {
      cy.get('#async-state-value').should('exist');
      cy.get('#async-state-signals').should('exist');
      cy.get('#async-state-set-state').should('exist');
    });

    it('should have proper x-var elements', () => {
      cy.get('x-var[name]').should('have.length.at.least', 5);
    });

    it('should have proper x-if elements', () => {
      cy.get('x-if').should('have.length.at.least', 2);
    });
  });

  describe('Timing and Async Behavior', () => {
    it('should handle different timing for different async operations', () => {
      // Initially all async states should be empty/default
      cy.get('#async-state-value').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });
      cy.get('#async-state-signals').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'xxx');
      });

      // After 1 second, first two should be updated
      cy.wait(1100);
      cy.get('#async-state-value').within(() => {
        cy.get('x-var[name]').should('contain', 'Jose');
      });
      cy.get('#async-state-signals').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'xxx');
      });

      // After 2 seconds, all should be updated
      cy.wait(1000);
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'Jane');
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
        cy.get('x-var[name]').should('contain', 'Jose');
      });
      cy.get('#async-state-signals').within(() => {
        cy.get('x-var[name]').should('contain', '');
      });
      cy.get('#async-state-set-state').within(() => {
        cy.get('x-var[name]').should('contain', 'Jane');
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
});
