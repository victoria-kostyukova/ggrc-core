/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import './export-panel';
import template from './templates/export-group.stache';
import panelModel from './panel';

export default canComponent.extend('exportGroup', {
  tag: 'export-group',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      isRemovable: {
        get() {
          return this.attr('panels.length') > 1;
        },
      },
    },
    panels: [],
    index: 0,
    getIndex: function (el) {
      return Number($(el.closest('export-panel'))
        .viewModel().attr('panel_index'));
    },
    removeFilterGroup(el) {
      let index = this.getIndex(el);

      this.attr('panels').splice(index, 1);
    },
    addObjectType(data = {}) {
      let index = this.attr('index') + 1;

      data = data || {};
      if (!data.type) {
        data.type = 'Program';
      } else if (data.isSnapshots === 'true') {
        data.snapshot_type = data.type;
        data.type = 'Snapshot';
      }

      this.attr('index', index);
      return this.attr('panels').push(new panelModel(data));
    },
  }),
  events: {
    inserted: function () {
      this.viewModel.addObjectType({
        type: 'Program',
        isSnapshots: false,
      });
    },
  },
});
