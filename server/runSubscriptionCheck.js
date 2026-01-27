const checkExpiredSubscriptions = require('./utils/subscriptionChecker');

checkExpiredSubscriptions()
  .then(count => {
    console.log('Revoked subscriptions:', count);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
