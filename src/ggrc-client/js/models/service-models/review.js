/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Cacheable from '../cacheable';
import Stub from '../stub';

export default Cacheable('CMS.Models.Review', {
  root_object: 'review',
  root_collection: 'reviews',
  table_singular: 'review',
  table_plural: 'reviews',

  category: 'governance',
  findOne: 'GET /api/reviews/{id}',
  findAll: 'GET /api/reviews',
  update: 'PUT /api/reviews/{id}',
  destroy: 'DELETE /api/reviews/{id}',
  create: 'POST /api/reviews',
  attributes: {
    reviewable: Stub,
  },
}, {
  setShowLastReviewUpdates(value) {
    this._showLastReviewUpdates = value;
  },
  getShowLastReviewUpdates() {
    return this._showLastReviewUpdates;
  },
});
