/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as businessModels from './business-models';
import * as serviceModels from './service-models';
import * as mappingModels from './mapping-models';

export default {
  ...businessModels,
  ...serviceModels,
  ...mappingModels,
};
