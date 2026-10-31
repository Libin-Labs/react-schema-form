import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
const dom = new JSDOM("<!doctype html><div id='root'></div>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const api = await import('../dist/esm/index.js');
const cjs = createRequire(import.meta.url)('../dist/cjs/index.js');
test('ESM and CommonJS expose the same runtime API', () =>
  assert.deepEqual(
    Object.keys(cjs)
      .filter((key) => key !== '__esModule')
      .sort(),
    Object.keys(api).sort(),
  ));
test('safe nested paths and validation', () => {
  const updated = api.setSafePath({}, 'profile.name', 'Ada');
  assert.equal(api.getSafePath(updated, 'profile.name'), 'Ada');
  assert.throws(() => api.parseSafePath('constructor.prototype.x'), /Unsafe/u);
  assert.deepEqual(api.validateForm([{ name: 'age', type: 'number', min: 0 }], { age: -1 }), {
    age: 'Value must be between 0 and infinity.',
  });
});
test('renders accessible fields and reports validation', async () => {
  const root = createRoot(document.getElementById('root'));
  let changed;
  await React.act(async () =>
    root.render(
      React.createElement(api.SchemaForm, {
        fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
        value: {},
        onChange: (value) => {
          changed = value;
        },
      }),
    ),
  );
  assert.match(document.body.textContent, /Name/u);
  assert.match(document.body.textContent, /required/u);
  const input = document.querySelector('input');
  const setValue = Object.getOwnPropertyDescriptor(
    dom.window.HTMLInputElement.prototype,
    'value',
  ).set;
  await React.act(async () => {
    setValue.call(input, 'Ada');
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  assert.equal(changed.name, 'Ada');
  await React.act(async () => root.unmount());
});
