/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as businessModels from '../../models/business-models';
import template from './templates/export-panel.mustache';
import router from '../../router';

let filterModel = can.Map({
  model_name: 'Program',
  value: '',
  filter: {},
});

export default can.Component.extend({
  tag: 'export-panel',
  template,
  viewModel: {
    define: {
      showAttributes: {
        value: true,
        set(newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.attributes'), newValue);

          setValue(newValue);
        },
      },
      showMappings: {
        value: true,
        set(newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.mappings'), newValue);

          setValue(newValue);
        },
      },
      showLocalAttributes: {
        value: true,
        set(newValue, setValue) {
          this.updateIsSelected(
            this.attr('item.localAttributes'), newValue);

          setValue(newValue);
        },
      },
      panelNumber: {
        get() {
          return Number(this.attr('panel_index')) + 1;
        },
      },
    },
    exportable: GGRC.Bootstrap.exportable,
    snapshotable_objects: GGRC.config.snapshotable_objects,
    panel_index: '@',
    has_parent: false,
    removable: false,
    item: null,
    fetch_relevant_data: function (id, type) {
      let dfd = businessModels[type].findOne({id: id});
      dfd.then(function (result) {
        this.attr('item.relevant').push(new filterModel({
          model_name: router.attr('relevant_type'),
          value: router.attr('relevant_id'),
          filter: result,
        }));
      }.bind(this));
    },
    updateIsSelected: function (items, isSelected) {
      if (!items) {
        return;
      }

      can.batch.start();
      items.forEach(function (item) {
        item.attr('isSelected', isSelected);
      });
      can.batch.stop();
    },
    setSelected: function () {
      this.attr('showMappings', true);
      this.attr('showAttributes', true);
      this.attr('showLocalAttributes', true);
    },
  },
  events: {
    inserted: function () {
      let panelNumber = this.viewModel.attr('panelNumber');

      if (panelNumber === 1 && router.attr('relevant_id')
        && router.attr('relevant_type')) {
        this.viewModel.fetch_relevant_data(router.attr('relevant_id'),
          router.attr('relevant_type'));
      }
    },
    '[data-action=select_toggle] click': function (el, ev) {
      let type = el.data('type');
      let value = el.data('value');
      let targetList;

      switch (type) {
        case 'local_attributes': {
          targetList = this.viewModel.attr('item.localAttributes');
          break;
        }
        case 'attributes': {
          targetList = this.viewModel.attr('item.attributes');
          break;
        }
        default: {
          targetList = this.viewModel.attr('item.mappings');
        }
      }

      this.viewModel.updateIsSelected(targetList, value);
    },
    '{viewModel} type': function (viewModel, ev, type) {
      viewModel.attr('item').changeType(type);
      viewModel.setSelected();
    },
  },
});
