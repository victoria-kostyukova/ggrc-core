/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Cacheable from '../cacheable';

export default Cacheable.extend({
  root_object: 'person_profile',
  root_collection: 'people_profiles',
  findOne: 'GET /api/people_profiles/{id}',
  findAll: 'GET /api/people_profiles',
  update: 'PUT /api/people_profiles/{id}',
}, {});
