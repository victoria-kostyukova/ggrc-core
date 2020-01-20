/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Mixin from './mixin';

/**
 * A mixin to generate hash with refetch param.
 */
export default class RefetchHash extends Mixin {
  getHashFragment() {
    let widgetName = this.constructor.table_singular;
    if (window.location.hash
      .startsWith(['#', widgetName].join(''))) {
      return;
    }

    return [widgetName,
      '&refetch=true'].join('');
  }
}
