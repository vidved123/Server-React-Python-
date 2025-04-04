import '@testing-library/jest-dom/vitest'; // <-- Use this for Vitest support
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest'; // <-- Ensure expect is from Vitest
import LoginForm from './App.jsx';

test('renders the login form with heading and login button', () => {
  render(<LoginForm />);

  // Check for the heading
  const headingElement = screen.getByRole('heading', { level: 2, name: /login/i });
  expect(headingElement).toBeInTheDocument();

  // Check for the login button
  const loginButton = screen.getByRole('button', { name: /login/i });
  expect(loginButton).toBeInTheDocument();
});
