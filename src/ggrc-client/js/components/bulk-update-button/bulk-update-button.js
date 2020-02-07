/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFilter from 'lodash/filter';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './bulk-update-button.stache';
import updateService from '../../plugins/utils/bulk-update-service';
import {notifier} from '../../plugins/utils/notifiers-utils';
import {trigger} from 'can-event';

const ViewModel = canDefineMap.extend({
  model: {
    value: null,
  },
  openBulkUpdateModal: function (el, type) {
    import(/* webpackChunkName: "mapper" */ '../../controllers/mapper/mapper')
      .then((mapper) => {
        mapper.ObjectBulkUpdate.launch(el, {
          object: type,
          type: type,
          callback: this.updateObjects.bind(this, el),
        });
      });
  },
  updateObjects: function (el, context, args) {
    let model = this.model;
    let nameSingular = model.name_singular;
    let progressMessage =
      `${nameSingular} update is in progress. This may take several minutes.`;

    context.closeModal();
    notifier('progress', progressMessage);
    return updateService.update(model, args.selected, args.options)
      .then(function (res) {
        let updated = loFilter(res, {status: 'updated'});
        let updatedCount = updated.length;
        let message = this.getResultNotification(model, updatedCount);

        notifier('info', message);

        if (updatedCount > 0) {
          trigger.call(el.closest('tree-widget-container')[0], 'refreshTree');
        }
      }.bind(this));
  },
  getResultNotification: function (model, updatedCount) {
    let nameSingularLowerCase = model.name_singular.toLowerCase();
    let namePlural = model.name_plural;
    let namePluralLowerCase = namePlural.toLowerCase();

    if (updatedCount === 0) {
      return `No ${namePluralLowerCase} were updated.`;
    }

    return `${updatedCount} ` + (updatedCount === 1 ?
      `${nameSingularLowerCase} was ` :
      `${namePluralLowerCase} were `) +
      'updated successfully.';
  },
});

export default canComponent.extend({
  tag: 'bulk-update-button',
  view: canStache(template),
  leakScope: true,
  ViewModel,
  events: {
    'a click': function (el) {
      let model = this.viewModel.model;
      let type = model.model_singular;

      this.viewModel.openBulkUpdateModal(el, type);
    },
  },
});
