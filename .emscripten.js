// .emscripten.js
MODULE_NAME = 'vector-engine';
EXPORTED_FUNCTIONS = [
  '_malloc',
  '_free',
];
EXTRA_EXPORTED_RUNTIME_METHODS = [
  'ccall',
  'cwrap',
];