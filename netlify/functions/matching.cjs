const { run } = require('../lib/matching_bundle.cjs');

exports.config = {
  schedule: '*/5 * * * *',
};

exports.handler = (event) => run(event);
