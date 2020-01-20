/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import './spec-setup';
import './spec-helpers';
import '../js/entrypoints/vendor';
import '../js/entrypoints/dashboard';

let testsContext = require.context('../', true, /_spec\.js$/);

testsContext.keys().forEach(testsContext);
