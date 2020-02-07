/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import template from './assessment-template-clone-button.stache';
import router from '../../router';
import {getPageInstance} from '../../plugins/utils/current-page-utils';

const ViewModel = canDefineMap.extend({
  model: {
    value: null,
  },
  text: {
    value: null,
  },
  parentId: {
    value: null,
  },
  parentType: {
    value: null,
  },
  objectType: {
    value: null,
  },
  openCloneModal(el) {
    let $el = $(el);
    import(/* webpackChunkName: "mapper" */ '../../controllers/mapper/mapper')
      .then((mapper) => {
        mapper.AssessmentTemplateClone.launch($el, {
          object: this.parentType,
          type: this.objectType,
          join_object_id: this.parentId,
          refreshTreeView: this.refreshTreeView.bind(this),
        });
      });
  },
  refreshTreeView() {
    if (getPageInstance().type === 'Audit') {
      if (router.attr('widget') === 'assessment_template') {
        this.dispatch('refreshTree');
      } else {
        router.attr({
          widget: 'assessment_template',
          refetch: true,
        });
      }
    }
  },
});

export default canComponent.extend({
  tag: 'assessment-template-clone-button',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
