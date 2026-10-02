'use strict';

const { start } = require('./backend/server');

if (require.main === module) start();

module.exports = { start };
