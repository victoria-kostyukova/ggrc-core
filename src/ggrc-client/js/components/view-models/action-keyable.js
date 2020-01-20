/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';

export default canMap.extend({
  // two way bound attribute to child components
  // to define if "results" is shown.
  showResults: false,
  actionKey: null,
  onActionKey(keyCode) {
    if (this.attr('showResults')) {
      // trigger setter of 'actionKey' in child viewModel
      this.attr('actionKey', keyCode);
      this.attr('actionKey', null);
      // prevent default behavior
      return false;
    }
    return true;
  },
});
