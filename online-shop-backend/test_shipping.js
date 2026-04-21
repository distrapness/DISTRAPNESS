const shippingService = require('./services/shippingService');
shippingService.getProvinces()
  .then(res => console.log(res))
  .catch(err => console.error(err));
