import { App } from './app.js';

const { createRoot } = ReactDOM;

const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));

