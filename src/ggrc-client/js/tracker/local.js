/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import BaseStrategy from './base';

export default class LocalStrategy extends BaseStrategy {
  timing(category, variable, label, value) {
    console.warn(
      `Category: ${category},
       Variable: ${variable},
       Label: ${label},
       time: ${value}`);
  }
  trackError() {
    // just stub for Strategies consistency
    // no need to locally track errors, there is enough info in devTools
  }
}
