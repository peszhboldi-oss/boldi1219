'use strict';

// Run in one process so the suite also works in restricted Windows sandboxes
// that prohibit Node's test-runner worker process spawning.
require('./access.test');
require('./schema.test');
require('./server.test');
require('./metrics.test');
require('./integration.test');
require('./wger-import.test');
require('./auth.test');
require('./username.test');
