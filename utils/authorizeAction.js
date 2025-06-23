/**
 * Generic authorization checker for any resource.
 *
 * @param {Object} model - The model containing the get method (e.g., Category, Product).
 * @param {string|number} resource_id - The ID of the resource to authorize.
 * @param {string|number} user_id - The ID of the logged-in user.
 * @param {Object} options - Options object:
 *   - getMethod: method name to fetch the resource by ID (default: 'getByID')
 *   - ownerField: field name in the resource that holds the user ID (default: 'creator_id')
 * @param {Function} callback - Callback function (err, resource)
 */
const authorizeAction = (model, resource_id, user_id, options = {}, callback) => {
  const {
    getMethod = 'getByID',
    ownerField = 'creator_id'
  } = options;

  if (!resource_id) {
    return callback({
      code: 400,
      message: 'Resource ID is required'
    });
  }

  if (typeof model[getMethod] !== 'function') {
    return callback({
      code: 500,
      message: `Method "${getMethod}" not found on the model`
    });
  }

  model[getMethod](resource_id, (err, resource) => {
    if (err) {
      return callback({
        code: 500,
        message: 'Error fetching resource',
        error: err
      });
    }

    if (!resource) {
      return callback({
        code: 404,
        message: 'Resource not found'
      });
    }

    if (resource[ownerField] !== user_id) {
      return callback({
        code: 403,
        message: 'Unauthorized: You cannot perform this action'
      });
    }

    return callback(null, resource);
  });
};

module.exports = authorizeAction;
