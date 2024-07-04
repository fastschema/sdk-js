// if atob() is not available, we have to use polyfill;
if (typeof atob === 'undefined') {
  const { decode } = require('base-64');
  if (typeof global !== 'undefined') {
    global.atob = decode;
  }

  if (typeof window !== 'undefined') {
    window.atob = decode;
  }
}


export default atob;
