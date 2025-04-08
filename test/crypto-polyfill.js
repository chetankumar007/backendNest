// Add crypto to the global object
const crypto = require('crypto');
global.crypto = crypto;

// This is needed for TypeORM
Object.defineProperty(global.self, 'crypto', {
  value: {
    getRandomValues: (arr) => crypto.randomBytes(arr.length),
  },
});
