import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/components/build-style/style.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FrontendPage from './FrontendPage';
import { initBlocks } from './registerBlocks.jsx';
import './index.css';
// -d adding filters 
import { addFilter } from '@wordpress/hooks';

addFilter(
  'blocks.registerBlockType',
  'custom/extend-block-supports',
  (settings, name) => {
    return {
      ...settings,
      supports: {
        ...settings.supports,
        spacing: {
          padding: true,
          margin: true,
        },
        layout: true,
        color: {
          text: true,
          background: true,
          link: true,
        },
        typography: {
          fontSize: true,
          lineHeight: true,
        },
      },
    };
  }
);
initBlocks();

function Root() {
  const [view, setView] = useState('editor'); // 'editor' | 'site'

  if (view === 'site') {
    return <FrontendPage onBackToEditor={() => setView('editor')} />;
  }
  return <App onViewSite={() => setView('site')} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);