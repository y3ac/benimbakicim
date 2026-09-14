const { run } = require('../lib/api_bundle.cjs');

exports.handler = (event, context) => run(event, context);
