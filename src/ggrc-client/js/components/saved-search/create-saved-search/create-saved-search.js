/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import canMap from 'can-map';
import template from './create-saved-search.stache';
import SavedSearch from '../../../models/service-models/saved-search';
import {handleAjaxError} from '../../../plugins/utils/errors-utils';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import pubSub from '../../../pub-sub';
import {getFilters} from './../../../plugins/utils/advanced-search-utils';

export default canComponent.extend({
  tag: 'create-saved-search',
  view: canStache(template),
  leakScope: false,
  viewModel: canMap.extend({
    filterItems: null,
    mappingItems: null,
    statusItem: null,
    parentItems: null,
    parentInstance: null,
    type: null,
    searchName: '',
    objectType: '',
    isDisabled: false,
    saveSearch() {
      if (this.attr('isDisabled')) {
        return;
      }

      if (!this.attr('searchName')) {
        notifier('error', 'Saved search name can\'t be blank');
        return;
      }

      const filters = getFilters(this);
      const savedSearch = new SavedSearch({
        name: this.attr('searchName'),
        search_type: this.attr('type'),
        object_type: this.attr('objectType'),
        is_visible: true,
        filters,
      });

      this.attr('isDisabled', true);
      return savedSearch.save().then((savedSearch) => {
        pubSub.dispatch({
          type: 'savedSearchCreated',
          search: savedSearch,
        });
        this.attr('searchName', '');
      }, (err) => {
        handleAjaxError(err);
      }).always(() => {
        this.attr('isDisabled', false);
      });
    },
  }),
});
