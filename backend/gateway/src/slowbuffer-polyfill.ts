// SlowBuffer was removed in Node.js 22+; patch for buffer-equal-constant-time
const buf = require('buffer');
if (!buf.SlowBuffer) {
  buf.SlowBuffer = Buffer;
}
