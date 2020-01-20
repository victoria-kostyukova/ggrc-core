/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './import-history.stache';

export default canComponent.extend({
  tag: 'import-history',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    history: [],
    remove(id) {
      this.dispatch({
        type: 'removeItem',
        id,
      });
    },
    download(id, title) {
      this.dispatch({
        type: 'downloadCsv',
        id,
        title,
      });
    },
  }),
});
