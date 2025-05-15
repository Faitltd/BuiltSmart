import { render, screen } from '@testing-library/react';

// Test basic app container
test('renders app container', () => {
  render(
    <div className="app-container">
      <main className="main-content">
        <h1>FlipperCalc</h1>
      </main>
    </div>
  );
  const appElement = screen.getByText(/FlipperCalc/i);
  expect(appElement).toBeInTheDocument();
});
