/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './recently-viewed.stache';
import {getRecentlyViewedObjects} from '../../plugins/utils/recently-viewed-utils';
import * as businessModels from '../../models/business-models';

export default canComponent.extend({
  tag: 'recently-viewed',
  view: canStache(template),
  leakScope: true,
  viewModel: canMap.extend({
    items: [],
  }),
  init() {
    let objects = getRecentlyViewedObjects();
    let items = loMap(objects, (obj) => {
      return {
        viewLink: obj.viewLink,
        title: obj.title,
        icon: businessModels[obj.type].table_singular,
      };
    });
    this.viewModel.attr('items', items);
  },
});
