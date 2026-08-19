import React from 'react';
import { render } from '@testing-library/react';
import { waitForIonicReact } from '@ionic/react-test-utils';
import App from './App';

test('renders without crashing', async () => {
  const { baseElement } = render(<App />);
  await waitForIonicReact();
  expect(baseElement).toBeDefined();
});
