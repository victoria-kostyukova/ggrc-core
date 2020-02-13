/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canComponent from 'can-component';
import canStache from 'can-stache';
import canDefineMap from 'can-define/map/map';
import template from './create-saved-search.stache';
import SavedSearch from '../../../models/service-models/saved-search';
import {handleAjaxError} from '../../../plugins/utils/errors-utils';
import {notifier} from '../../../plugins/utils/notifiers-utils';
import pubSub from '../../../pub-sub';
import {getFilters} from './../../../plugins/utils/advanced-search-utils';

const ViewModel = canDefineMap.extend({
  filterItems: {
    value: null,
  },
  mappingItems: {
    value: null,
  },
  statusItem: {
    value: null,
  },
  parentItems: {
    value: null,
  },
  parentInstance: {
    value: null,
  },
  type: {
    value: null,
  },
  searchName: {
    value: '',
  },
  objectType: {
    value: '',
  },
  isDisabled: {
    value: false,
  },
  saveSearch() {
    if (this.isDisabled) {
      return;
    }

    if (!this.searchName) {
      notifier('error', 'Saved search name can\'t be blank');
      return;
    }

    const filters = getFilters(this.serialize());
    const savedSearch = new SavedSearch({
      name: this.searchName,
      search_type: this.type,
      object_type: this.objectType,
      is_visible: true,
      filters,
    });

    this.isDisabled = true;
    return savedSearch.save().then((savedSearch) => {
      pubSub.dispatch({
        type: 'savedSearchCreated',
        search: savedSearch,
      });
      this.searchName = '';
    }, (err) => {
      handleAjaxError(err);
    }).always(() => {
      this.isDisabled = false;
    });
  },
});

export default canComponent.extend({
  tag: 'create-saved-search',
  view: canStache(template),
  ViewModel,
});
