const express = require('express');

function createSearchRoutes(searchController) {
  const router = express.Router();

  router.get('/', searchController.search);
  router.get('/song/:id', searchController.getSongById);
  router.post('/validate', searchController.validateUrl);

  return router;
}

module.exports = createSearchRoutes;
