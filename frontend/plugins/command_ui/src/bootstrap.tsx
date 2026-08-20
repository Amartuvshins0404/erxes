import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';

import { CommandMain } from './modules/CommandMain';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <CommandMain />
  </StrictMode>,
);
