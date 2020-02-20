/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import canComponent from 'can-component';
import '../related-objects/related-people-access-control';
import '../related-objects/related-people-access-control-group';
import '../people/deletable-people-group';
import '../unarchive-link';
import '../assessment/assessment-mapped-objects/assessment-mapped-objects';
import '../assessment/assessment-evidence-objects/assessment-evidence-objects';
import '../assessment/assessment-mapped-comments/assessment-mapped-comments';
import './mapper-results-item-description';
import template from './templates/mapper-results-item-details.stache';
import * as businessModels from '../../models/business-models';

const ViewModel = canDefineMap.extend({
  init() {
    let instance = this.instance;
    if (instance.snapshotObject) {
      this.instance = instance.snapshotObject;
    } else {
      this.model = businessModels[instance.type];
    }
  },
  assessmentType: {
    get() {
      const instance = this.instance;
      return businessModels[instance.assessment_type].title_plural;
    },
  },
  workflowLink: {
    get() {
      const instance = this.instance;
      let path;
      if (instance.type === 'TaskGroup') {
        path = `/workflows/${instance.workflow.id}#!task_group`;
      } else if (instance.type === 'CycleTaskGroupObjectTask') {
        path = `/workflows/${instance.workflow.id}#!current`;
      }
      return path;
    },
  },
  item: {
    value: null,
  },
  instance: {
    value: null,
  },
  model: {
    value: null,
  },
  isMapperDetails: {
    value: true,
  },
  adminRole: {
    value: () => ['Admin'],
  },
  deletableAdmin: {
    value: false,
  },
  itemDetailsViewType: {
    value: '',
  },
});

export default canComponent.extend({
  tag: 'mapper-results-item-details',
  view: canStache(template),
  leakScope: true,
  ViewModel,
});
