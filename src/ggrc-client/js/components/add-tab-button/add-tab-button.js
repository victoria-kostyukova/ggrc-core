/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './add-tab-button.mustache';
import {
  getPageType,
  isMyWork,
  isAllObjects,
} from '../../plugins/utils/current-page-utils';
import Permission from '../../permission';

const viewModel = can.Map.extend({
  define: {
    isAuditInaccessibleAssessment: {
      get() {
        let audit = this.attr('instance.audit');
        let type = this.attr('instance.type');
        let result = (type === 'Assessment') &&
          !!audit &&
          !Permission.is_allowed_for('read', audit);
        return result;
      },
    },
    shouldShow: {
      get() {
        let instance = this.attr('instance');

        return !this.attr('isAuditInaccessibleAssessment')
          && Permission.is_allowed_for('update', instance)
          && !instance.attr('archived')
          && !isMyWork()
          && !isAllObjects()
          && !['Person', 'Evidence'].includes(getPageType())
          && this.attr('hasHiddenWidgets');
      },
    },
  },
  instance: null,
  widgetList: null,
  urlPath: '',
  addTabTitle: '',
  hasHiddenWidgets: true,
  isNotObjectVersion(internavDisplay) {
    return internavDisplay.indexOf('Versions') === -1;
  },
  isNotProhibitedMap(shortName) {
    const prohibitedMapList = {
      Issue: ['Assessment', 'Audit'],
      Assessment: ['Evidence'],
    };

    const instanceType = this.attr('instance.type');

    return prohibitedMapList[instanceType] &&
      prohibitedMapList[instanceType].includes(shortName);
  },
});

GGRC.Components('addTabButton', {
  tag: 'add-tab-button',
  template,
  viewModel,
  helpers: {
    filterWidgets(widget, options) {
      if (this.isNotObjectVersion(widget.internav_display) &&
      !this.isNotProhibitedMap(widget.model.shortName) &&
      widget.attr('placeInAddTab')) {
        return options.fn(options.contexts);
      }

      return options.inverse(options.contexts);
    },
    shouldCreateObject(instance, modelShortName, options) {
      if (modelShortName() === 'Audit' &&
        instance().type === 'Program') {
        return options.fn(options.contexts);
      }

      return options.inverse(options.contexts);
    },
  },
});
