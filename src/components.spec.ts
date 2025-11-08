describe('Components Page Tests', () => {
  const visitComponentsPage = () =>
    cy.visit('/components.html', {
      onBeforeLoad(win) {
        cy.stub(win.console, 'log').as('consoleLog');
        cy.stub(win, 'alert').as('alertStub');
      },
    });

  beforeEach(() => {
    visitComponentsPage();
  });

  it('should render the test-component content from external file', () => {
    cy.get('test-component').should('exist');
    cy.contains('Test Component... from file').should('exist');
  });

  it('should execute the script component when the page loads', () => {
    cy.get('@consoleLog').should(
      'have.been.calledWith',
      'Test Script... from script in a file'
    );
  });

  it('should display the pulso component state', () => {
    cy.get('test-pulso').should('exist');
    cy.contains('My name is John').should('exist');
  });

  it('should trigger alert with the current name when clicking the pulso button', () => {
    cy.contains('button', 'alert').click();
    cy.get('@alertStub').should('have.been.calledWith', 'John');
  });
});

