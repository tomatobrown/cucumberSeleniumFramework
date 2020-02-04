const Promise = require(`bluebird`);

exports.getRandomString = function (len) {
  const hrTime = process.hrtime();
  const currentMS = hrTime[0] * 1000000 + hrTime[1];
  let text = `${currentMS}`;
  const charset = `abcdefghijklmnopqrstuvwxyz0123456789`;
  for (let i = 12; i < len; i += 1) {
    text += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return text;
};

exports.sleep = function (milliseconds) {
  return Promise.delay(milliseconds);
};

/**
 * Retry a promisified action until it resolves, or reject
 *  after a timeout.
 * @param {function} action - thunk that returns a promise
 * @param {number} timeoutMs - duration to retry until success
 * @param {number} intervalMs - duration between action attempts
 */
exports.retry = function (action, timeoutMs, intervalMs) {
  const endTime = Date.now() + (timeoutMs || 0);
  const retry = error => new Promise((resolve, reject) => {
    if (Date.now() >= endTime) {
      reject(error);
    } else {
      setTimeout(() => action()
        .then(function (...args) {
          resolve.apply(this, args);
        })
        .catch(function (...args) {
          resolve(retry.apply(this, args));
        }), intervalMs || 1);
    }
  });
  return action().catch(retry);
};
