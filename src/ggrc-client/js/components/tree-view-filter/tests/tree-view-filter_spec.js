/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canList from 'can-list';
import canMap from 'can-map';
import canDefineMap from 'can-define/map/map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component, {loadSavedSearch, filterParentItems} from '../tree-view-filter';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as StateUtils from '../../../plugins/utils/state-utils';
import * as ErrorsUtils from '../../../plugins/utils/errors-utils';
import QueryParser from '../../../generated/ggrc-filter-query-parser';
import SavedSearch from '../../../models/service-models/saved-search';
import * as QueryApiUtils from '../../../plugins/utils/query-api-utils';
import Control from '../../../models/business-models/control';
import * as NotifierUtils from '../../../plugins/utils/notifiers-utils';

describe('tree-view-filter component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('openAdvancedFilter() method', () => {
    it('copies applied filter and mapping items', () => {
      let appliedFilterItems = new canList([
        AdvancedSearch.create.attribute(),
      ]);
      let appliedMappingItems = new canList([
        AdvancedSearch.create.mappingCriteria({
          filter: AdvancedSearch.create.attribute(),
        }),
      ]);
      viewModel.advancedSearch.attr('appliedFilterItems', appliedFilterItems);
      viewModel.advancedSearch.attr('appliedMappingItems', appliedMappingItems);
      viewModel.advancedSearch.attr('filterItems', canList());
      viewModel.advancedSearch.attr('mappingItems', canList());

      viewModel.openAdvancedFilter();

      expect(viewModel.advancedSearch.attr('filterItems').serialize())
        .toEqual(appliedFilterItems.attr());
      expect(viewModel.advancedSearch.attr('mappingItems').serialize())
        .toEqual(appliedMappingItems.attr());
    });

    it('opens modal window', () => {
      viewModel.advancedSearch.attr('open', false);

      viewModel.openAdvancedFilter();

      expect(viewModel.advancedSearch.attr('open')).toBe(true);
    });

    it('should add "parentInstance" when isObjectContextPage is TRUE' +
    'and "parentInstance" is empty', () => {
      const parentInstance = {id: 1, type: 'Audit'};
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
      spyOn(AdvancedSearch.create, 'parentInstance')
        .and.returnValue({type: 'parentInstance', value: parentInstance});

      viewModel.advancedSearch.attr('parentInstance', null);

      viewModel.openAdvancedFilter();

      expect(AdvancedSearch.create.parentInstance).toHaveBeenCalled();
      expect(viewModel.advancedSearch.attr('parentInstance.value').serialize())
        .toEqual(parentInstance);
    });

    it('should NOT add "parentInstance" because it already set', () => {
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
      spyOn(AdvancedSearch.create, 'parentInstance');

      viewModel.advancedSearch.attr('parentInstance', {id: 1});

      viewModel.openAdvancedFilter();

      expect(AdvancedSearch.create.parentInstance).not.toHaveBeenCalled();
      expect(viewModel.advancedSearch.attr('parentInstance')).not.toBeNull();
    });

    it('should NOT add "parentInstance" because isObjectContextPage is FALSE',
      () => {
        spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(false);
        spyOn(AdvancedSearch.create, 'parentInstance');

        viewModel.advancedSearch.attr('parentInstance', null);

        viewModel.openAdvancedFilter();

        expect(AdvancedSearch.create.parentInstance).not.toHaveBeenCalled();
        expect(viewModel.advancedSearch.attr('parentInstance')).toBeNull();
      }
    );

    it('should filter parentItems and exclude parentInstance', () => {
      const parentInstance = {id: 1, type: 'Audit'};
      spyOn(CurrentPageUtils, 'isObjectContextPage').and.returnValue(true);
      spyOn(AdvancedSearch.create, 'parentInstance')
        .and.returnValue({type: 'parentInstance', value: parentInstance});

      viewModel.advancedSearch.attr('parentInstance', null);

      viewModel.advancedSearch.attr('appliedParentItems', [
        {value: {id: 1, type: 'Audit'}},
        {value: {id: 2, type: 'Audit'}},
        {value: {id: 1, type: 'Program'}},
      ]);

      viewModel.openAdvancedFilter();

      expect(viewModel.advancedSearch.attr('parentItems').serialize()).toEqual([
        {value: {id: 2, type: 'Audit'}},
        {value: {id: 1, type: 'Program'}},
      ]);

      expect(viewModel.advancedSearch.attr('parentInstance.value').serialize())
        .toEqual({
          id: 1,
          type: 'Audit',
        });
    });
  });

  describe('applyAdvancedFilters() method', () => {
    let filterItems = new canList([
      AdvancedSearch.create.attribute(),
    ]);
    let mappingItems = new canList([
      AdvancedSearch.create.mappingCriteria({
        filter: AdvancedSearch.create.attribute(),
      }),
    ]);
    beforeEach(() => {
      viewModel.advancedSearch.attr('filterItems', filterItems);
      viewModel.advancedSearch.attr('mappingItems', mappingItems);
      viewModel.advancedSearch.attr('appliedFilterItems', canList());
      viewModel.advancedSearch.attr('appliedMappingItems', canList());
      viewModel.model = {
        model_plural: '',
      };
      spyOn(viewModel, 'onFilter');
      spyOn(AdvancedSearch, 'buildFilter')
        .and.callFake((items, request) => {
          request.push({name: 'item'});
        });
      spyOn(QueryParser, 'joinQueries');
      spyOn(viewModel, 'applySavedSearch');
    });

    it('copies filter and mapping items to applied', () => {
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(false);
      spyOn(CurrentPageUtils, 'isAllObjects').and.returnValue(false);
      viewModel.applyAdvancedFilters();

      expect(viewModel.advancedSearch.attr('appliedFilterItems').attr())
        .toEqual(filterItems.attr());
      expect(viewModel.advancedSearch.attr('appliedMappingItems').attr())
        .toEqual(mappingItems.attr());
    });

    it('initializes advancedSearch.filter property', () => {
      QueryParser.joinQueries.and.returnValue({
        name: 'test',
      });
      viewModel.advancedSearch.attr('filter', null);

      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(false);
      spyOn(CurrentPageUtils, 'isAllObjects').and.returnValue(false);
      viewModel.applyAdvancedFilters();

      expect(viewModel.advancedSearch.attr('filter.name')).toBe('test');
    });

    it('initializes advancedSearch.request property', () => {
      viewModel.advancedSearch.attr('request', canList());
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(false);
      spyOn(CurrentPageUtils, 'isAllObjects').and.returnValue(false);

      viewModel.applyAdvancedFilters();

      expect(viewModel.advancedSearch.attr('request.length')).toBe(3);
    });

    it('closes modal window', () => {
      viewModel.advancedSearch.attr('open', true);

      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(false);
      spyOn(CurrentPageUtils, 'isAllObjects').and.returnValue(false);
      viewModel.applyAdvancedFilters();

      expect(viewModel.advancedSearch.attr('open')).toBe(false);
    });

    it('calls onFilter() method', () => {
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(false);
      spyOn(CurrentPageUtils, 'isAllObjects').and.returnValue(false);
      viewModel.applyAdvancedFilters();

      expect(viewModel.onFilter).toHaveBeenCalled();
    });

    it('should not call "applySavedSearch" method, ' +
    'when "isSavedSearchShown" is true', () => {
      // isMyWork page. "isSavedSearchShown" getter returns false
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(true);

      viewModel.applyAdvancedFilters();
      expect(viewModel.applySavedSearch).not.toHaveBeenCalled();
    });

    it('should call "setEmailImportSearchId" when ' +
    '"isSavedSearchFromRoute" is true', () => {
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(true);
      spyOn(viewModel, 'setEmailImportSearchId');
      viewModel.applyAdvancedFilters(true);
      expect(viewModel.setEmailImportSearchId).toHaveBeenCalled();
    });

    it('should call "cleanUpRoute" and "resetEmailImportSearchId" when ' +
    '"isSavedSearchFromRoute" is false', () => {
      spyOn(CurrentPageUtils, 'isMyWork').and.returnValue(true);
      spyOn(viewModel, 'cleanUpRoute');
      spyOn(viewModel, 'resetEmailImportSearchId');

      viewModel.applyAdvancedFilters(false);

      expect(viewModel.cleanUpRoute).toHaveBeenCalled();
      expect(viewModel.resetEmailImportSearchId).toHaveBeenCalled();
    });
  });

  describe('removeAdvancedFilters() method', () => {
    beforeAll(() => {
      spyOn(viewModel, 'onFilter');
    });

    it('removes applied filter and mapping items', () => {
      viewModel.advancedSearch.attr('appliedFilterItems', new canList([
        {title: 'item'},
      ]));
      viewModel.advancedSearch.attr('appliedMappingItems', new canList([
        {title: 'item'},
      ]));

      viewModel.removeAdvancedFilters();

      expect(viewModel.advancedSearch.attr('appliedFilterItems.length'))
        .toBe(0);
      expect(viewModel.advancedSearch.attr('appliedMappingItems.length'))
        .toBe(0);
    });

    it('cleans advancedSearch.filter property', () => {
      viewModel.advancedSearch.attr('filter', {});
      viewModel.removeAdvancedFilters();

      expect(viewModel.advancedSearch.attr('filter')).toBe(null);
    });

    it('closes modal window', () => {
      viewModel.advancedSearch.attr('open', true);
      viewModel.removeAdvancedFilters();

      expect(viewModel.advancedSearch.attr('open')).toBe(false);
    });

    it('calls onFilter() method', () => {
      viewModel.removeAdvancedFilters();

      expect(viewModel.onFilter).toHaveBeenCalled();
    });

    it('resets advancedSearch.request list', () => {
      viewModel.advancedSearch.attr('request', new canList([{data: 'test'}]));
      viewModel.removeAdvancedFilters();

      expect(viewModel.advancedSearch.attr('request.length')).toBe(0);
    });
  });

  describe('resetAdvancedFilters() method', () => {
    it('resets filter items', () => {
      viewModel.advancedSearch.attr('filterItems', new canList([
        {title: 'item'},
      ]));

      viewModel.resetAdvancedFilters();

      expect(viewModel.advancedSearch.attr('filterItems.length')).toBe(0);
    });

    it('resets mapping items', () => {
      viewModel.advancedSearch.attr('mappingItems', new canList([
        {title: 'item'},
      ]));

      viewModel.resetAdvancedFilters();

      expect(viewModel.advancedSearch.attr('mappingItems.length')).toBe(0);
    });
  });

  describe('treeFilterReady() method', () => {
    beforeEach(() => {
      viewModel.shouldWaitForFilters = true;
      viewModel.filtersReady = new Set();
      viewModel.model = Control;
      spyOn(viewModel, 'onFilter');
    });

    it('should NOT call "onFilter" method after 1 call', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(true);
      viewModel.treeFilterReady({filterName: 'some filter #1'});
      expect(viewModel.onFilter).not.toHaveBeenCalled();
    });

    it('should call "onFilter" method when filterNames are NOT ' +
    'uniq after 2 calls', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(true);
      viewModel.treeFilterReady({filterName: 'some filter #1'});
      expect(viewModel.onFilter).not.toHaveBeenCalled();
      viewModel.treeFilterReady({filterName: 'some filter #1'});
      expect(viewModel.onFilter).not.toHaveBeenCalled();
    });

    it('should call "onFilter" method when filterNames are uniq after 2 calls',
      () => {
        spyOn(StateUtils, 'hasFilter').and.returnValue(true);
        viewModel.treeFilterReady({filterName: 'some filter #1'});
        expect(viewModel.onFilter).not.toHaveBeenCalled();
        viewModel.treeFilterReady({filterName: 'some filter #2'});
        expect(viewModel.onFilter).toHaveBeenCalled();
      }
    );

    it('should NOT call "onFilter" method when filterNames are ' +
    'uniq after 2 calls, but shouldWaitForFilters is false', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(true);
      viewModel.shouldWaitForFilters = false;
      viewModel.treeFilterReady({filterName: 'some filter #1'});
      expect(viewModel.onFilter).not.toHaveBeenCalled();
      viewModel.treeFilterReady({filterName: 'some filter #2'});
      expect(viewModel.onFilter).not.toHaveBeenCalled();
    });

    it('should call "onFilter" method after 1 call when tree view ' +
    'does NOT have status filter', () => {
      spyOn(StateUtils, 'hasFilter').and.returnValue(false);
      viewModel.treeFilterReady({filterName: 'some filter #1'});
      expect(viewModel.onFilter).toHaveBeenCalled();
    });
  });

  describe('applySavedSearch() method', () => {
    let method;

    beforeEach(() => {
      spyOn(viewModel, 'resetAppliedSavedSearch');
      viewModel.filterIsDirty = false;
      viewModel.savedSearchPermalink = '';
      viewModel.modelName = 'Control';
      spyOn(AdvancedSearch, 'getFilters').and.returnValue([]);

      method = viewModel.applySavedSearch.bind(viewModel);
    });

    it('should call "resetAppliedSavedSearch" when selectedSavedSearch is null',
      () => {
        method(null);
        expect(viewModel.resetAppliedSavedSearch).toHaveBeenCalled();
      }
    );

    it('should call "resetAppliedSavedSearch" when filter is dirty', () => {
      viewModel.filterIsDirty = true;
      method({});
      expect(viewModel.resetAppliedSavedSearch).toHaveBeenCalled();
    });

    it('should set "appliedSavedSearch" attr when selectedSavedSearch is null',
      () => {
        viewModel.appliedSavedSearch = null;
        method(null);
        expect(viewModel.appliedSavedSearch.serialize()).toEqual({
          search_type: 'AdvancedSearch',
          object_type: 'Control',
          is_visible: false,
          filters: [],
        });
      }
    );

    it('should set "appliedSavedSearch" attr when filter is dirty',
      () => {
        viewModel.appliedSavedSearch = null;
        viewModel.filterIsDirty = true;
        method({});
        expect(viewModel.appliedSavedSearch.serialize()).toEqual({
          search_type: 'AdvancedSearch',
          object_type: 'Control',
          is_visible: false,
          filters: [],
        });
      }
    );

    it('should set permalink when selectedSavedSearch is not empty ' +
    'and filter is NOT dirty', () => {
      spyOn(AdvancedSearch, 'buildSearchPermalink').and.returnValue('link');

      method(new canMap({id: 5}));
      expect(AdvancedSearch.buildSearchPermalink).toHaveBeenCalled();
    });

    it('should set appliedSavedSearch when selectedSavedSearch is not empty ' +
    'and filter is NOT dirty', () => {
      const selectedSavedSearch = {id: 123};
      spyOn(AdvancedSearch, 'buildSearchPermalink').and.returnValue('link');

      method(new canMap(selectedSavedSearch));
      expect(viewModel.appliedSavedSearch.serialize())
        .toEqual(selectedSavedSearch);
    });
  });

  describe('applySavedSearchPermalink() method', () => {
    beforeEach(() => {
      viewModel.widgetId = 1;
      viewModel.savedSearchPermalink = '';
      spyOn(viewModel, 'savePermalinkToClipboard');
      spyOn(viewModel, 'saveHiddenSavedSearch');
    });

    it('calls only savePermalinkToClipboard when permalink is defined ',
      () => {
        viewModel.savedSearchPermalink = 1;
        viewModel.applySavedSearchPermalink();
        expect(viewModel.savePermalinkToClipboard).toHaveBeenCalled();
      }
    );

    it('calls savePermalinkToClipboard when appliedSavedSearch is defined',
      () => {
        const appliedSavedSearch = {id: 2};
        viewModel.appliedSavedSearch = appliedSavedSearch;
        viewModel.applySavedSearchPermalink();
        expect(viewModel.savePermalinkToClipboard).toHaveBeenCalled();
      }
    );

    it('calls saveHiddenSavedSearch when appliedSavedSearch '+
    'does NOT have id and is_visible is false', () => {
      const appliedSavedSearch = {
        is_visible: false,
      };

      viewModel.appliedSavedSearch = appliedSavedSearch;
      viewModel.applySavedSearchPermalink();
      expect(viewModel.saveHiddenSavedSearch).toHaveBeenCalled();
    });
  });

  describe('saveHiddenSavedSearch() method', () => {
    it('calls savePermalinkToClipboard on success save',
      (done) => {
        const widgetId = 1;
        const savedSearch = {id: 2};
        const appliedSavedSearch = {
          is_visible: false,
          save: () => $.Deferred().resolve(savedSearch),
        };
        spyOn(AdvancedSearch, 'buildSearchPermalink')
          .withArgs(savedSearch.id, widgetId)
          .and.returnValue('built link');
        spyOn(viewModel, 'savePermalinkToClipboard');

        viewModel.saveHiddenSavedSearch(appliedSavedSearch, widgetId)
          .then(() => {
            expect(viewModel.savePermalinkToClipboard)
              .toHaveBeenCalledWith('built link');
            expect(viewModel.appliedSavedSearch).toBeNull();
            done();
          });
      }
    );

    describe('on save error', () => {
      let appliedSavedSearch;
      const error = 'error';
      const widgetId = 1;

      beforeEach(() => {
        appliedSavedSearch = {
          is_visible: false,
          save: () => $.Deferred().reject(error),
        };
        spyOn(ErrorsUtils, 'handleAjaxError');
        spyOn(viewModel, 'triggerSearchPermalink');
      });

      it('calls handleAjaxError',
        (done) => {
          viewModel.saveHiddenSavedSearch(appliedSavedSearch, widgetId)
            .then(() => {
              expect(ErrorsUtils.handleAjaxError).toHaveBeenCalledWith(error);
              done();
            });
        }
      );
      it('calls triggerSearchPermalink',
        (done) => {
          viewModel.saveHiddenSavedSearch(appliedSavedSearch, widgetId)
            .then(() => {
              expect(viewModel.triggerSearchPermalink)
                .toHaveBeenCalledWith(false);
              done();
            });
        }
      );
      it('sets appliedSavedSearch to null',
        (done) => {
          viewModel.saveHiddenSavedSearch(appliedSavedSearch, widgetId)
            .then(() => {
              expect(viewModel.appliedSavedSearch).toBeNull();
              done();
            });
        }
      );
    });
  });

  describe('searchQueryChanged() method', () => {
    let method;

    beforeAll(() => {
      method = viewModel.searchQueryChanged.bind(viewModel);
      spyOn(viewModel, 'updateCurrentFilter');
    });

    it('should add filter because "filters" doesn\'t contain filter', () => {
      viewModel.filters = [];

      const filter = {
        name: 'my new filter',
        query: {left: 'title', op: {name: '~'}, right: 'my title'},
      };

      method(filter);
      expect(viewModel.filters[0].serialize()).toEqual(filter);
    });

    it('should update filter because "filters" contains that one', () => {
      viewModel.filters = [{
        name: 'my new filter',
        query: null,
      }];

      const filter = {
        name: 'my new filter',
        query: {left: 'title', op: {name: '~'}, right: 'my title'},
      };

      method(filter);
      expect(viewModel.filters[0].serialize()).toEqual(filter);
    });

    it('should call "updateCurrentFilter" method', () => {
      method({name: 'my name', query: null});
      expect(viewModel.updateCurrentFilter).toHaveBeenCalled();
    });
  });

  describe('updateCurrentFilter() method', () => {
    let method;

    beforeAll(() => {
      method = viewModel.updateCurrentFilter.bind(viewModel);
    });

    beforeEach(() => {
      viewModel.currentFilter = null;
    });

    it('should set "currentFilter" from advancedSearch filter ' +
    'when it isn\t empty', () => {
      viewModel.additionalFilter = 'some filter';

      const advancedSearch = {
        filter: {
          expression: {
            left: 'Status',
            op: {name: 'IN'},
            right: ['Active'],
          },
        },
        request: [{query: null}],
      };

      viewModel.advancedSearch = advancedSearch;

      method();
      expect(viewModel.currentFilter.filter.serialize())
        .toEqual(advancedSearch.filter);
      expect(viewModel.currentFilter.request.serialize())
        .toEqual(advancedSearch.request);
    });

    it('should set "currentFilter" from additionalFilter ' +
    'when advancedSearch filter is empty', () => {
      viewModel.filters = [];
      viewModel.additionalFilter = 'some filter';

      const advancedSearch = {
        filter: null,
        request: [{query: null}],
      };

      viewModel.advancedSearch = advancedSearch;

      spyOn(QueryParser, 'parse').and.returnValue({
        query: 'some additional query',
      });

      method();

      expect(viewModel.currentFilter.filter.serialize())
        .toEqual({
          query: 'some additional query',
        });
      expect(viewModel.currentFilter.request.serialize())
        .toEqual(advancedSearch.request);
    });

    it('should call "QueryParser.parse" when additionalFilter is NOT empty' +
    'advanced advancedSearch filter is empty', () => {
      viewModel.additionalFilter = 'some additional query';
      viewModel.advancedSearch = new canMap();

      spyOn(QueryParser, 'parse');
      method();

      expect(QueryParser.parse).toHaveBeenCalledWith(
        viewModel.additionalFilter
      );
    });

    it('should call "concatFilters" util when additionalFilter and "filter"' +
    'are NOT empty', () => {
      viewModel.filters = [{
        name: 'myFilter',
        query: {left: 'title', op: {name: '~'}, right: 'my title'},
      }];

      viewModel.additionalFilter = 'some additional query';
      viewModel.advancedSearch = new canMap();

      spyOn(QueryParser, 'parse').and.returnValue({
        query: 'some additional query',
      });
      spyOn(QueryApiUtils, 'concatFilters');

      method();

      expect(QueryApiUtils.concatFilters).toHaveBeenCalled();
    });
  });

  describe('setEmailImportSearchId() method', () => {
    beforeEach(() => {
      spyOn(NotifierUtils, 'notifier');
    });

    describe('should set "emailImportSearchId" and call "notifier"', () => {
      it('when router has "saved_search" and "labels", which equals ' +
      '"Import Email"', () => {
        const router = new canMap({
          saved_search: '1',
          labels: 'Import Email',
        });

        viewModel.setEmailImportSearchId(router);
        expect(viewModel.emailImportSearchId).toBe(1);
        expect(NotifierUtils.notifier).toHaveBeenCalledWith(
          'info',
          'The filter query refers to the '
            + 'report you\'ve received on your email.'
        );
      });
    });

    describe('should set "emailImportSearchId" to NULL and NOT call "notifier"',
      () => {
        it('when router has "saved_search" and "labels", which does NOT ' +
        'equal "Import Email"', () => {
          const router = new canMap({
            saved_search: '1',
            labels: 'Export Email',
          });

          viewModel.setEmailImportSearchId(router);
          expect(viewModel.emailImportSearchId).toBe(null);
          expect(NotifierUtils.notifier).not.toHaveBeenCalled();
        });

        it('when router does NOT have "saved_search" and "labels", which ' +
        'equals "Import Email"', () => {
          const router = new canMap({
            labels: 'Import Email',
          });

          viewModel.setEmailImportSearchId(router);
          expect(viewModel.emailImportSearchId).toBe(null);
          expect(NotifierUtils.notifier).not.toHaveBeenCalled();
        });
      }
    );
  });
});

describe('loadSavedSearch() function', () => {
  const DefineMapViewModel = canDefineMap.extend({seal: false}, {
    router: {
      value: () => new canMap({
        saved_search: 1,
      }),
    },
    loading: {
      value: false,
    },
    modelName: {
      value: 'Control',
    },
    advancedSearch: {
      value: () => new canMap({}),
    },
    removeAdvancedFilters: {
      value: () => () => {},
    },
    applyAdvancedFilters: {
      value: () => () => {},
    },
  });

  let treeFunction;
  let ViewModel;

  beforeAll(() => {
    treeFunction = loadSavedSearch;
  });

  beforeEach(() => {
    ViewModel = new DefineMapViewModel();
  });

  it('should set "loading" flag to true while loading', (done) => {
    let dfd = $.Deferred();

    spyOn(SavedSearch, 'findOne').and.returnValue(dfd);

    let loadDfd = treeFunction(ViewModel);
    expect(ViewModel.loading).toBe(true);

    loadDfd.then(() => {
      expect(ViewModel.loading).toBe(false);
      done();
    });

    dfd.resolve({});
  });

  it('should call "removeAdvancedFilters" when search response is null',
    (done) => {
      let dfd = $.Deferred();

      spyOn(SavedSearch, 'findOne').and.returnValue(dfd);
      spyOn(ViewModel, 'removeAdvancedFilters');

      treeFunction(ViewModel).then(() => {
        expect(ViewModel.removeAdvancedFilters).toHaveBeenCalled();
        done();
      });

      dfd.resolve({SavedSearch: null});
    }
  );

  it('should call "removeAdvancedFilters" when search is NOT AdvancedSearch',
    (done) => {
      let dfd = $.Deferred();

      spyOn(SavedSearch, 'findOne').and.returnValue(dfd);
      spyOn(ViewModel, 'removeAdvancedFilters');

      treeFunction(ViewModel).then(() => {
        expect(ViewModel.removeAdvancedFilters).toHaveBeenCalled();
        done();
      });

      dfd.resolve({SavedSearch: {
        search_type: 'GlobalSearch',
        object_type: 'Control',
      }});
    }
  );

  it('should call "removeAdvancedFilters" when search.object_type' +
  ' is NOT equal to ViewModel.modelName',
  (done) => {
    let dfd = $.Deferred();

    spyOn(SavedSearch, 'findOne').and.returnValue(dfd);
    spyOn(ViewModel, 'removeAdvancedFilters');

    treeFunction(ViewModel).then(() => {
      expect(ViewModel.removeAdvancedFilters).toHaveBeenCalled();
      done();
    });

    dfd.resolve({SavedSearch: {
      search_type: 'AdvancedSearch',
      object_type: 'Regulation',
    }});
  });

  it('should call "removeAdvancedFilters" when search loading was failed',
    (done) => {
      let dfd = $.Deferred();

      spyOn(SavedSearch, 'findOne').and.returnValue(dfd);
      spyOn(ViewModel, 'removeAdvancedFilters');

      treeFunction(ViewModel).fail(() => {
        expect(ViewModel.removeAdvancedFilters).toHaveBeenCalled();
        done();
      });

      dfd.reject();
    }
  );

  it('should call "applyAdvancedFilters" when search appropriate to ViewModel',
    (done) => {
      let dfd = $.Deferred();

      spyOn(SavedSearch, 'findOne').and.returnValue(dfd);
      spyOn(ViewModel, 'applyAdvancedFilters');
      spyOn(AdvancedSearch, 'parseFilterJson');

      treeFunction(ViewModel).then(() => {
        expect(ViewModel.applyAdvancedFilters).toHaveBeenCalledWith(true);
        done();
      });

      dfd.resolve({SavedSearch: {
        search_type: 'AdvancedSearch',
        object_type: 'Control',
      }});
    }
  );
});

describe('filterParentItems() method', () => {
  it('should exclude parentInstance from parentItem', () => {
    const parentInstance = {
      value: {
        id: 5,
        type: 'Control',
      },
    };

    const parentItems = [
      {value: {id: 7, type: 'Regulation'}},
      {value: {id: 5, type: 'Regulation'}},
      {value: {id: 5, type: 'Control'}},
      {value: {id: 6, type: 'Control'}},
    ];

    const result = filterParentItems(parentInstance, parentItems);
    expect(result).toEqual([
      {value: {id: 7, type: 'Regulation'}},
      {value: {id: 5, type: 'Regulation'}},
      {value: {id: 6, type: 'Control'}},
    ]);
  });
});
