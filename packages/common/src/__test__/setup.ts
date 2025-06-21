import { TextEncoder, TextDecoder } from 'util';

// JSDOM does not include TextEncoder/TextDecoder, so we need to polyfill them
Object.assign(global, {
  TextEncoder,
  TextDecoder,
});
