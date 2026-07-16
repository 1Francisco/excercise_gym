// Workaround for jest-runtime 30.4.2 incompatibility with jest-environment-node
// The _moduleMocker lacks clearMocksOnScope method.
const path = require('path');
const runtimePath = path.join(process.cwd(), 'node_modules', 'jest-runtime', 'build', 'index.js');

try {
  const fs = require('fs');
  let code = fs.readFileSync(runtimePath, 'utf8');

  // Only patch if the issue exists
  if (code.includes('clearMocksOnScope') && !code.includes('&& this._moduleMocker.clearMocksOnScope')) {
    code = code.replace(
      'this._moduleMocker.clearMocksOnScope(this._environment.global);',
      'this._moduleMocker?.clearMocksOnScope?.(this._environment.global);'
    );
    fs.writeFileSync(runtimePath, code, 'utf8');
    console.log('Patched jest-runtime for clearMocksOnScope compatibility');
  }
} catch (e) {
  console.warn('Could not patch jest-runtime:', e.message);
}
