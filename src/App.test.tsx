import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders splash screen on app start', async () => {
  const { unmount } = render(<App />);
  expect(await screen.findByText('AR Learn')).toBeInTheDocument();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  unmount();
});
