// This file will be executed before your tests run
// It ensures that the crypto module is available in the test environment

// Make Node.js built-in modules available in the test environment
global.crypto = require('crypto');
