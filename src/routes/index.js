const express = require('express');
const createUserRoutes = require('./userRoutes');
const createRadioRoutes = require('./radioRoutes');
const createQueueRoutes = require('./queueRoutes');
const createSearchRoutes = require('./searchRoutes');

function createRoutes(controllers) {
  const router = express.Router();

  router.use('/user', createUserRoutes(controllers.userController));
  router.use('/radio', createRadioRoutes(controllers.radioController));
  router.use('/queue', createQueueRoutes(controllers.queueController));
  router.use('/search', createSearchRoutes(controllers.searchController));

  return router;
}

module.exports = createRoutes;
