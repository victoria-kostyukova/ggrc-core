/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import makeArray from 'can-util/js/make-array/make-array';
import canList from 'can-list';
import canMap from 'can-map';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as AdvancedSearch from '../../../plugins/utils/advanced-search-utils';
import * as QueryAPI from '../../../plugins/utils/query-api-utils';
import Pagination from '../../base-objects/pagination';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapper-results';
import tracker from '../../../tracker';
import * as isMegaMappingUtils from '../../../plugins/utils/mega-object-utils';
import Program from '../../../models/business-models/program';
import QueryParser from '../../../generated/ggrc-filter-query-parser';

describe('mapper-results component', () => {
  let viewModel;

  beforeEach(() => {
    let init = Component.prototype.ViewModel.prototype.init;
    Component.prototype.ViewModel.prototype.init = undefined;
    viewModel = getComponentVM(Component);
    viewModel.mapper = {
      type: 'Control',
    };
    viewModel.paging = new Pagination({pageSizeSelect: [5, 10, 15]});
    Component.prototype.ViewModel.prototype.init = init;
    viewModel.init = init;
  });

  describe('isMegaMapping getter', () => {
    it('should return true for equal mega object', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Program';
      expect(viewModel.isMegaMapping).toBeTruthy();
    });

    it('should return false for different object', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Cotrol';
      expect(viewModel.isMegaMapping).toBeFalsy();
    });
  });

  describe('serviceColumnsEnabled getter', () => {
    it('should return length of columns.service attribute', () => {
      viewModel.columns.service = [1, 2];
      expect(viewModel.serviceColumnsEnabled).toBe(2);
    });
  });

  describe('setItems() method', () => {
    let items;

    beforeEach(() => {
      items = [
        {data: 'mockData'},
      ];
      viewModel.assign({});
      spyOn(tracker, 'start').and.returnValue(jasmine.createSpy());
      spyOn(viewModel, 'load')
        .and.returnValue(Promise.resolve(items));
      spyOn(viewModel, 'setColumnsConfiguration');
      spyOn(viewModel, 'setRelatedAssessments');
    });

    it('calls load() method', async () => {
      await viewModel.setItems();

      expect(viewModel.load).toHaveBeenCalled();
    });

    it('sets loaded items to viewModel.items', async () => {
      viewModel.items = [];

      await viewModel.setItems();

      expect(viewModel.items.length).toEqual(1);
      expect(viewModel.items[0])
        .toEqual(jasmine.objectContaining({
          data: 'mockData',
        }));
    });

    it('sets true to "isLoading" attribute', () => {
      viewModel.isLoading = false;

      viewModel.setItems();

      expect(viewModel.isLoading).toBe(true);
    });

    it('calls setColumnsConfiguration() method', async () => {
      await viewModel.setItems();

      expect(viewModel.setColumnsConfiguration).toHaveBeenCalled();
    });

    it('calls setRelatedAssessments() method', async () => {
      await viewModel.setItems();

      expect(viewModel.setRelatedAssessments).toHaveBeenCalled();
    });

    it('sets viewModel.isBeforeLoad to false', async () => {
      viewModel.isBeforeLoad = true;

      await viewModel.setItems();

      expect(viewModel.isBeforeLoad).toEqual(false);
    });

    it('sets false to "isLoading" attribute after load() success',
      async () => {
        viewModel.isLoading = true;

        await viewModel.setItems();

        expect(viewModel.isLoading).toBe(false);
      });
  });

  describe('setColumnsConfiguration() method', () => {
    let mockColumns;

    beforeEach(() => {
      viewModel.columns = {};
      viewModel.object = 'Program';
      viewModel.type = 'Control';
      mockColumns = {
        available: 'mock1',
        selected: 'mock2',
        disableConfiguration: 'mock3',
      };
      spyOn(TreeViewUtils, 'getColumnsForModel')
        .and.returnValue(mockColumns);
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          model_singular: '',
          tree_view_options: {
            mega_attr_list: 'mock4',
          },
        });
    });

    it('updates available columns', () => {
      viewModel.columns.available = 'available';
      viewModel.setColumnsConfiguration();
      expect(viewModel.columns.available).toEqual('mock1');
    });

    it('updates selected columns', () => {
      viewModel.columns.selected = 'selected';
      viewModel.setColumnsConfiguration();
      expect(viewModel.columns.selected).toEqual('mock2');
    });

    it('updates disableColumnsConfiguration', () => {
      viewModel.disableColumnsConfiguration = 'configuration';
      viewModel.setColumnsConfiguration();
      expect(viewModel.disableColumnsConfiguration).toEqual('mock3');
    });

    it('updates service columns if "isMegaMapping" is true', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Program';
      viewModel.setColumnsConfiguration();
      expect(viewModel.columns.service).toEqual('mock4');
    });

    it('updates service columns with an empty array ' +
    'if "isMegaMapping" is false', () => {
      viewModel.object = 'Program';
      viewModel.type = 'Control';
      viewModel.setColumnsConfiguration();
      expect(makeArray(viewModel.columns.service)).toEqual([]);
    });
  });

  describe('setSortingConfiguration() method', () => {
    beforeEach(() => {
      viewModel.columns = {};
      spyOn(TreeViewUtils, 'getSortingForModel')
        .and.returnValue(
          {
            key: 'key',
            direction: 'direction',
          });
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          model_singular: '',
        });
    });

    it('updates sort key', () => {
      viewModel.sort.key = null;
      viewModel.setSortingConfiguration();

      expect(viewModel.sort.key).toEqual('key');
    });

    it('updates sort direction', () => {
      viewModel.sort.direction = null;
      viewModel.setSortingConfiguration();

      expect(viewModel.sort.direction).toEqual('direction');
    });
  });

  describe('setRelatedAssessments() method', () => {
    beforeEach(() => {
      viewModel.assign({});
      viewModel.relatedAssessments = {};
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          tree_view_options: {
            show_related_assessments: true,
          },
        });
    });

    it('sets relatedAssessments.show to false if it is use-snapshots case',
      () => {
        viewModel.useSnapshots = true;
        viewModel.setRelatedAssessments();
        expect(viewModel.relatedAssessments.show).toEqual(false);
      });

    it('updates relatedAssessments.show if it is not use-snapshots case',
      () => {
        viewModel.useSnapshots = false;
        viewModel.setRelatedAssessments();
        expect(viewModel.relatedAssessments.show).toEqual(true);
      });
  });

  describe('resetSearchParams() method', () => {
    const DEFAULT_PAGE_SIZE = 10;

    beforeEach(() => {
      viewModel.paging = new canMap({});
      viewModel.sort = {};
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          model_singular: '',
        });
    });

    it('sets 1 to current of paging', () => {
      viewModel.paging.attr('current', 9);
      viewModel.resetSearchParams();
      expect(viewModel.paging.attr('current')).toEqual(1);
    });

    it('sets default size to pageSize of paging', () => {
      viewModel.paging.attr('pageSize', 11);
      viewModel.resetSearchParams();
      expect(viewModel.paging.attr('pageSize')).toEqual(DEFAULT_PAGE_SIZE);
    });

    it('sets default sorting', () => {
      spyOn(viewModel, 'setSortingConfiguration');

      viewModel.resetSearchParams();
      expect(viewModel.setSortingConfiguration).toHaveBeenCalled();
    });
  });

  describe('onSearch() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'resetSearchParams');
      spyOn(viewModel, 'setItemsDebounced');
    });

    it('calls resetSearchParams()', () => {
      viewModel.onSearch();
      expect(viewModel.resetSearchParams).toHaveBeenCalled();
    });

    it('calls setItemsDebounced()', () => {
      viewModel.onSearch();
      expect(viewModel.setItemsDebounced).toHaveBeenCalled();
    });
  });

  describe('prepareRelevantQuery() method', () => {
    let relevantList = [{
      id: 0,
      type: 'test0',
    }, {
      id: 1,
      type: 'test1',
    }];
    let expectedResult = [{
      id: 0,
      type: 'test0',
      operation: 'relevant',
    }, {
      id: 1,
      type: 'test1',
      operation: 'relevant',
    }];
    beforeEach(() => {
      viewModel.relevantTo = relevantList;
    });
    it('returns relevant filters', () => {
      let result = viewModel.prepareRelevantQuery();
      expect(result.serialize()).toEqual(expectedResult);
    });
  });

  describe('prepareRelatedQuery() method', () => {
    it('returns null if viewModel.baseInstance is undefined', () => {
      let result = viewModel.prepareRelatedQuery();
      expect(result).toEqual(null);
    });

    it('returns query', () => {
      let result;
      viewModel.baseInstance = new canMap({
        type: 'mockType',
        id: 123,
      });
      spyOn(QueryAPI, 'buildRelevantIdsQuery')
        .and.returnValue('mockQuery');
      result = viewModel.prepareRelatedQuery();
      expect(result).toEqual('mockQuery');
    });
  });

  describe('loadAllItems() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'loadAllItemsIds')
        .and.returnValue('mockItems');
    });

    it('updates viewModel.allItems', () => {
      viewModel.loadAllItems();
      expect(viewModel.allItems).toEqual('mockItems');
    });
  });

  describe('getQuery() method', () => {
    let mockPaging = new canMap({
      current: 'mock1',
      pageSize: 'mock2',
    });
    let mockSort = {
      key: 'mock3',
      direction: 'mock4',
    };
    let mockFilterItems = new canList(['filterItem']);
    let mockMappingItems = new canList(['mappingItem']);
    let mockStatusItem = new canMap({
      value: {
        items: ['statusItem'],
      },
    });

    beforeEach(() => {
      viewModel.type = 'mockName';
      viewModel.paging = mockPaging;
      viewModel.sort = mockSort;
      viewModel.filterItems = mockFilterItems;
      viewModel.mappingItems = mockMappingItems;
      viewModel.statusItem = mockStatusItem;

      spyOn(viewModel, 'prepareRelevantQuery')
        .and.returnValue('relevant');
      spyOn(viewModel, 'prepareRelatedQuery')
        .and.returnValue({mockData: 'related'});

      spyOn(QueryAPI, 'buildParam')
        .and.returnValue({});
      spyOn(AdvancedSearch, 'buildFilter');
      spyOn(QueryParser, 'parse');
      spyOn(QueryParser, 'joinQueries');
    });

    it('builds advanced filters', () => {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(0)[0])
        .toEqual(mockFilterItems.serialize());
    });

    it('builds advanced mappings', () => {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(1)[0])
        .toEqual(mockMappingItems.serialize());
    });

    it('builds advanced status', () => {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(2)[0][0])
        .toEqual(mockStatusItem.serialize());
    });

    it('does not build advanced status if sttatus items are not provided',
      () => {
        viewModel.statusItem = {};
        viewModel.getQuery('values', true);
        expect(AdvancedSearch.buildFilter.calls.count()).toBe(2);
      });

    it('adds paging to query if addPaging is true', () => {
      viewModel.sort.assign({key: undefined});
      viewModel.getQuery('values', true);
      expect(QueryAPI.buildParam.calls.argsFor(0)[1])
        .toEqual({
          current: 'mock1',
          pageSize: 'mock2',
        });
    });

    it('adds paging with sort to query if sort.key is defined', () => {
      viewModel.getQuery('values', true);
      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].key)
        .toBe('mock3');
      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].direction)
        .toBe('mock4');
    });

    it('adds defaultSort to paging if no sort', () => {
      viewModel.sort = {};
      viewModel.defaultSort = [{key: 'mock5', direction: 'mock6'}];
      viewModel.getQuery('values', true);

      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].key).toBe('mock5');
    });

    it('sets "read" to permissions if model is person', () => {
      let result;
      viewModel.type = 'Person';
      viewModel.useSnapshots = false;
      result = viewModel.getQuery('Person', true);
      expect(result.request[0]).toEqual(jasmine.objectContaining({
        permissions: 'read',
        type: 'Person',
      }));
    });

    it('transform query to snapshot if useSnapshots is true', () => {
      let result;
      viewModel.useSnapshots = true;
      spyOn(SnapshotUtils, 'transformQueryToSnapshot')
        .and.returnValue({mockData: 'snapshot'});
      result = viewModel.getQuery();
      expect(result.request[0]).toEqual(jasmine.objectContaining({
        mockData: 'snapshot',
        permissions: 'update',
        type: 'values',
      }));
      expect(result.request[1]).toEqual(jasmine.objectContaining({
        mockData: 'snapshot',
      }));
    });

    it('set "read" permission if "searchOnly"', () => {
      let result;
      viewModel.searchOnly = true;
      result = viewModel.getQuery();
      expect(result.request[0]).toEqual(jasmine.objectContaining({
        permissions: 'read',
      }));
    });

    it('prepare request for unlocked items for Audits', () => {
      viewModel.type = 'Audit';
      spyOn(viewModel, 'prepareUnlockedFilter').and.returnValue('unlocked');
      viewModel.getQuery();

      expect(QueryParser.joinQueries.calls.argsFor(2)[1])
        .toBe('unlocked');
    });

    it('prepare request for owned items if flag was set', () => {
      let mockUser = {
        id: -1,
      };
      let oldUser = GGRC.current_user;
      GGRC.current_user = mockUser;
      spyOn(GGRC.current_user, 'id').and.returnValue(-1);
      viewModel.applyOwnedFilter = true;

      viewModel.getQuery();

      expect(QueryParser.joinQueries.calls.argsFor(2)[1]).toEqual({
        expression: {
          object_name: 'Person',
          op: {
            name: 'owned',
          },
          ids: [mockUser.id],
        },
      });

      GGRC.current_user = oldUser;
    });

    it('set result if "isMegaMapping" true', () => {
      let result = viewModel.getQuery('values', true, true);
      expect(result).toEqual(jasmine.objectContaining({
        parentQueryIndex: 1,
        childQueryIndex: 2,
      }));
    });

    it('set result if "isMegaMapping" false', () => {
      let result = viewModel.getQuery('values', true, false);
      expect(result).toEqual(jasmine.objectContaining({relatedQueryIndex: 1}));
    });
  });

  describe('getModelKey() method', () => {
    it('returns "Snapshot" if useSnapshots is true', () => {
      let result;
      viewModel.useSnapshots = true;
      result = viewModel.getModelKey();
      expect(result).toEqual('Snapshot');
    });

    it('returns type of model if useSnapshots is false', () => {
      let result;
      viewModel.type = 'Mock';
      viewModel.useSnapshots = false;
      result = viewModel.getModelKey();
      expect(result).toEqual('Mock');
    });
  });

  describe('getDisplayModel() method', () => {
    it('returns displayModel', () => {
      let result;
      viewModel.type = 'Program';
      result = viewModel.getDisplayModel();
      expect(result).toEqual(Program);
    });
  });

  describe('setDisabledItems() method', () => {
    let allItems = [{
      data: {
        id: 123,
      },
    }, {
      data: {
        id: 124,
      },
    }];

    let relatedData = {
      mockType: {
        ids: [123],
      },
    };

    let expectedResult = [{
      data: {
        id: 123,
      },
      isDisabled: true,
    }, {
      data: {
        id: 124,
      },
      isDisabled: false,
    }];

    let isMegaMapping = false;
    let type = 'mockType';

    it('does nothing if viewModel.searchOnly() is true', () => {
      viewModel.searchOnly = true;
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(allItems);
    });

    it('does nothing if it is case of object generation',
      () => {
        viewModel.assign({});
        viewModel.objectGenerator = true;
        viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
        expect(allItems).toEqual(allItems);
      });

    it('updates disabled items', () => {
      viewModel.searchOnly = false;
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });

    it('updates disabled items if "isMegaMapping" is true', () => {
      isMegaMapping = true;
      relatedData = {
        parent: {
          mockType: {
            ids: [123],
          },
        },
        child: {
          mockType: {
            ids: [124],
          },
        },
      };
      expectedResult = [{
        data: {
          id: 123,
        },
        isDisabled: true,
      }, {
        data: {
          id: 124,
        },
        isDisabled: true,
      }];

      viewModel.searchOnly = false;
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('setSelectedItems() method', () => {
    let allItems = [{
      id: 123,
    }, {
      id: 124,
    }];
    let expectedResult = [{
      id: 123,
      isSelected: true,
      markedSelected: true,
    }, {
      id: 124,
      isSelected: false,
    }];

    it('updates selected items', () => {
      viewModel.selected = [{id: 123}];
      viewModel.setSelectedItems(allItems);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('setMegaRelations() method', () => {
    let allItems = [{
      id: 123,
    }, {
      id: 124,
    }, {
      id: 234,
    }, {
      id: 235,
    }];

    let relatedData = {
      parent: {
        mockType: {
          ids: [123],
        },
      },
      child: {
        mockType: {
          ids: [124],
        },
      },
    };

    let expectedResult = [{
      id: 123,
      mapAsChild: false,
    }, {
      id: 124,
      mapAsChild: true,
    }, {
      id: 234,
      mapAsChild: false,
    }, {
      id: 235,
      mapAsChild: true,
    }];

    let type = 'mockType';

    it('updates mega relations items', () => {
      viewModel.megaRelationObj = {
        '234': 'parent',
        defaultValue: 'child',
      };
      viewModel.setMegaRelations(allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('disableItself() method', () => {
    let allItems = [{
      type: 'mockType',
      id: 123,
    }, {
      type: 'mockType',
      id: 124,
    }];
    let isMegaMapping = false;
    let expectedResult;

    it('do nothing if baseInstance is undefined', () => {
      viewModel.disableItself(isMegaMapping, allItems);
      expect(allItems).toEqual(allItems);
    });

    it('updates "disabledIds" attr', () => {
      viewModel.baseInstance = new canMap({
        type: 'mockType',
        id: 123,
      });
      viewModel.disableItself(isMegaMapping, allItems);
      expect(makeArray(viewModel.disabledIds)).toEqual([123]);
    });

    it('assigns true to "isDisabled" for allItems ' +
    'if self is true', () => {
      viewModel.baseInstance = new canMap({
        type: 'mockType',
        id: 123,
      });
      expectedResult = [{
        type: 'mockType',
        id: 123,
        isDisabled: true,
      }, {
        type: 'mockType',
        id: 124,
      }];
      viewModel.disableItself(isMegaMapping, allItems);
      expect(allItems).toEqual(expectedResult);
    });

    it('assigns "mapAsChild" and "isSelf" for allItems ' +
    'if isMegaMapping is true', () => {
      isMegaMapping = true;
      viewModel.baseInstance = new canMap({
        type: 'mockType',
        id: 123,
      });
      expectedResult = [{
        type: 'mockType',
        id: 123,
        isDisabled: true,
        mapAsChild: null,
        isSelf: true,
      }, {
        type: 'mockType',
        id: 124,
      }];
      viewModel.disableItself(isMegaMapping, allItems);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('transformValue() method', () => {
    let Model;

    beforeEach(() => {
      Model = {
        model: jasmine.createSpy().and.returnValue('transformedValue'),
      };
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue(Model);
    });

    it('returns transformed value', () => {
      let result;
      let value = 'mockValue';
      viewModel.useSnapshots = false;
      result = viewModel.transformValue(value);
      expect(result).toEqual('transformedValue');
    });

    it('returns snapshot-transformed value if it is use-snapshots case',
      () => {
        let result;
        let value = {
          revision: {
            content: 'mockContent',
          },
        };
        let expectedResult = {
          snapshotObject: 'snapshot',
          revision: {
            content: 'transformedValue',
          },
        };
        spyOn(SnapshotUtils, 'toObject')
          .and.returnValue('snapshot');
        viewModel.useSnapshots = true;
        result = viewModel.transformValue(value);
        expect(result).toEqual(expectedResult);
      });
  });

  describe('load() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'dispatch');
      spyOn(isMegaMappingUtils, 'isMegaMapping')
        .and.returnValue(true);
      spyOn(viewModel, 'getModelKey')
        .and.returnValue('modelKey');
      spyOn(viewModel, 'getQuery')
        .withArgs('values', true, true)
        .and.returnValue({
          queryIndex: 0,
          relatedQueryIndex: 1,
          request: [{
            header: 'header1',
            data: {},
          }],
        });
    });

    it('calls getModelkey() method', () => {
      spyOn(QueryAPI, 'batchRequestsWithPromise');

      viewModel.load();

      expect(viewModel.getModelKey).toHaveBeenCalled();
    });

    it('calls getQuery() method', () => {
      spyOn(QueryAPI, 'batchRequestsWithPromise');

      viewModel.load();

      expect(viewModel.getQuery)
        .toHaveBeenCalledWith('values', true, true);
    });

    it('calls batchRequest() util', () => {
      spyOn(QueryAPI, 'batchRequestsWithPromise');

      viewModel.load();

      expect(QueryAPI.batchRequestsWithPromise)
        .toHaveBeenCalled();
    });

    describe('after batchRequest() success', () => {
      let response;
      let query;

      beforeEach(() => {
        response = {
          modelKey: {
            values: [{
              id: 1,
              type: 'testType',
            }],
            total: 10,
          },
        };

        query = {
          queryIndex: 0,
          relatedQueryIndex: 1,
          request: [{
            header: 'header1',
            data: {},
          }],
        };

        spyOn(viewModel, 'transformValue')
          .withArgs({
            id: 1,
            type: 'testType',
          })
          .and.returnValue('transformedValue');
        spyOn(viewModel, 'setSelectedItems');
        spyOn(viewModel, 'setDisabledItems');
        spyOn(viewModel, 'getRelatedData')
          .withArgs(
            true,
            [response],
            query,
            'modelKey'
          )
          .and.returnValue('relatedData');
        spyOn(viewModel, 'setMegaRelations');
        spyOn(viewModel, 'disableItself');
        spyOn(QueryAPI, 'batchRequestsWithPromise')
          .withArgs({
            header: 'header1',
            data: {},
          })
          .and.returnValue(Promise.resolve(response));
      });

      it('calls getRelatedData() method', async () => {
        await viewModel.load();

        expect(viewModel.getRelatedData)
          .toHaveBeenCalled();
      });

      it('calls transformValue() method', async () => {
        await viewModel.load();

        expect(viewModel.transformValue)
          .toHaveBeenCalled();
      });

      it('calls setSelectedItems() method', async () => {
        await viewModel.load();

        expect(viewModel.setSelectedItems)
          .toHaveBeenCalledWith([{
            id: 1,
            type: 'testType',
            data: 'transformedValue',
            markedSelected: false,
          }]);
      });

      it('calls setDisabledItems() method', async () => {
        await viewModel.load();

        expect(viewModel.setDisabledItems)
          .toHaveBeenCalledWith(
            true,
            [{
              id: 1,
              type: 'testType',
              data: 'transformedValue',
              markedSelected: false,
            }],
            'relatedData',
            'modelKey'
          );
      });

      it('calls setMegaRelations() method' +
        'if "isMegaMapping" attribute equal true', async () => {
        await viewModel.load();

        expect(viewModel.setMegaRelations)
          .toHaveBeenCalledWith(
            [{
              id: 1,
              type: 'testType',
              data: 'transformedValue',
              markedSelected: false,
            }],
            'relatedData',
            'modelKey'
          );
      });

      it('calls disableItself() method', async () => {
        await viewModel.load();

        expect(viewModel.disableItself)
          .toHaveBeenCalledWith(
            true,
            [{
              id: 1,
              type: 'testType',
              data: 'transformedValue',
              markedSelected: false,
            }]
          );
      });

      it('updates paging object', async () => {
        viewModel.paging.attr('total', null);

        await viewModel.load();

        expect(viewModel.paging.total)
          .toEqual(10);
      });

      it('returns array of loaded objects', async () => {
        const result = await viewModel.load();

        expect(result).toEqual([{
          id: 1,
          type: 'testType',
          data: 'transformedValue',
          markedSelected: false,
        }]);
      });

      it('dispatchs loaded event', async () => {
        await viewModel.load();

        expect(viewModel.dispatch).toHaveBeenCalledWith('loaded');
      });
    });

    describe('if batchRequsts was failed', () => {
      beforeAll(() => {
        spyOn(QueryAPI, 'batchRequestsWithPromise')
          .and.returnValue(Promise.reject());
      });

      it('returns empty array', async () => {
        const result = await viewModel.load();

        expect(result).toEqual([]);
      });

      it('dispatchs loaded event', async () => {
        await viewModel.load();

        expect(viewModel.dispatch).toHaveBeenCalledWith('loaded');
      });
    });
  });

  describe('getRelatedData() method', () => {
    let isMegaMapping;
    let responseArray = [];
    let query = {};
    let modelKey = '';
    let result;

    beforeEach(() => {
      spyOn(viewModel, 'buildMegaRelatedData')
        .withArgs(responseArray, query, modelKey)
        .and.returnValue({mock: 123});
      spyOn(viewModel, 'buildRelatedData')
        .withArgs(responseArray, query, modelKey)
        .and.returnValue({mock: 456});
    });

    it('should return the result of buildMegaRelatedData() call' +
    'if "isMegaMapping" is true', () => {
      isMegaMapping = true;

      result = viewModel.getRelatedData(
        isMegaMapping, responseArray, query, modelKey);
      expect(viewModel.buildMegaRelatedData)
        .toHaveBeenCalledWith(responseArray, query, modelKey);
      expect(result).toEqual({mock: 123});
    }
    );

    it('should return the result of buildRelatedData() call ' +
    'if "isMegaMapping" is false', () => {
      isMegaMapping = false;

      result = viewModel.getRelatedData(
        isMegaMapping, responseArray, query, modelKey);
      expect(viewModel.buildRelatedData)
        .toHaveBeenCalledWith(responseArray, query, modelKey);
      expect(result).toEqual({mock: 456});
    }
    );
  });

  describe('buildRelatedData() method', () => {
    it('method should return data from "relatedData" array',
      () => {
        let responseArray = [
          {
            Snapshot: {
              ids: [1, 2, 3],
            },
          },
        ];
        let query = {
          relatedQueryIndex: 0,
        };

        let result = viewModel
          .buildRelatedData(responseArray, query, 'Snapshot');
        expect(result.Snapshot.ids.length).toEqual(3);
        expect(result.Snapshot.ids[0]).toEqual(1);
      }
    );

    it('method should return data from "deferred_list" array',
      () => {
        let responseArray = [
          {
            Snapshot: {
              ids: [1, 2, 3],
            },
          },
        ];
        let query = {
          relatedQueryIndex: 0,
        };
        let result;

        viewModel.deferredList = [
          {id: 5, type: 'Snapshot'},
          {id: 25, type: 'Snapshot'},
        ];

        result = viewModel
          .buildRelatedData(responseArray, query, 'Snapshot');
        expect(result.Snapshot.ids.length).toEqual(2);
        expect(result.Snapshot.ids[0]).toEqual(5);
      }
    );

    it('return data from "deferred_list" array. RelatedData is undefined',
      () => {
        let result;
        let query = {
          relatedQueryIndex: 0,
        };

        viewModel.deferredList = [
          {id: 5, type: 'Snapshot'},
          {id: 25, type: 'Snapshot'},
        ];

        result = viewModel
          .buildRelatedData([], query, 'Snapshot');
        expect(result.Snapshot.ids.length).toEqual(2);
        expect(result.Snapshot.ids[0]).toEqual(5);
      }
    );
  });

  describe('buildMegaRelatedData() method', () => {
    let responseArray;
    let query;
    let result;

    it('method should return data from "relatedData" array ' +
    'if "parentQueryIndex" and "childQueryIndex" are defined', () => {
      responseArray = [
        {
          Snapshot: {
            ids: [1, 2, 3],
          },
        },
        {
          Snapshot: {
            ids: [4, 5],
          },
        },
      ];
      query = {
        parentQueryIndex: 0,
        childQueryIndex: 1,
      };

      result = viewModel
        .buildMegaRelatedData(responseArray, query, 'Snapshot');
      expect(result.parent.Snapshot.ids.length).toEqual(3);
      expect(result.parent.Snapshot.ids[0]).toEqual(1);
      expect(result.child.Snapshot.ids.length).toEqual(2);
      expect(result.child.Snapshot.ids[0]).toEqual(4);
    });

    it('method should return data from "relatedData" array ' +
    'if "parentQueryIndex" and "childQueryIndex" are not defined', () => {
      responseArray = [
        {
          Snapshot: {
            ids: [1, 2, 3],
          },
        },
      ];
      query = {};

      result = viewModel
        .buildMegaRelatedData(responseArray, query, 'Snapshot');
      expect(result.parent).toEqual({});
      expect(result.child).toEqual({});
    });
  });

  describe('loadAllItemsIds() method', () => {
    beforeEach(() => {
      viewModel.assign({});

      spyOn(viewModel, 'getQuery')
        .withArgs('ids', false)
        .and.returnValue({
          queryIndex: 0,
          relatedQueryIndex: 1,
          request: [{
            header: 'header1',
            data: {},
          },
          {
            header: 'header2',
            data: {},
          }],
        });
      spyOn(viewModel, 'getModelKey')
        .and.returnValue('modelKey');
    });

    describe('before call batchRequests()', () => {
      beforeEach(() => {
        spyOn(QueryAPI, 'batchRequestsWithPromise');
      });

      it('calls getModelKey() method', () => {
        viewModel.loadAllItemsIds();

        expect(viewModel.getModelKey).toHaveBeenCalled();
      });

      it('calls getQuery() method', () => {
        viewModel.loadAllItemsIds();

        expect(viewModel.getModelKey).toHaveBeenCalled();
      });

      it('calls batchRequests() util', () => {
        viewModel.loadAllItemsIds();

        expect(QueryAPI.batchRequestsWithPromise).toHaveBeenCalledWith({
          header: 'header1',
          data: {},
        });

        expect(QueryAPI.batchRequestsWithPromise).toHaveBeenCalledWith({
          header: 'header2',
          data: {},
        });
      });
    });

    describe('after batchRequest() success', () => {
      beforeEach(() => {
        spyOn(QueryAPI, 'batchRequestsWithPromise')
          .withArgs({
            header: 'header1',
            data: {},
          })
          .and.returnValue(Promise.resolve({
            modelKey: {
              ids: [1, 2],
            },
          }))
          .withArgs({
            header: 'header2',
            data: {},
          })
          .and.returnValue(Promise.resolve({
            modelKey: {
              ids: [1, 3],
            },
          }));
      });

      it('adds "type" attribute value to all objects' +
        'if "useSnapshots" attribute is true', async () => {
        viewModel.type = 'testType';
        viewModel.objectGenerator = true;
        viewModel.useSnapshots = true;

        const result = await viewModel.loadAllItemsIds();

        result.forEach((obj) => {
          expect(obj.type).toBe('modelKey');
        });
      });

      it('performs extra mapping validation in case Assessment generation',
        async () => {
          viewModel.objectGenerator = false;

          const result = await viewModel.loadAllItemsIds();

          expect(result[0].id).toBe(2);
          expect(result.length).toBe(1);
        });
    });

    describe('if batchRequest() was failed', () => {
      it('returns empty array', async () => {
        spyOn(QueryAPI, 'batchRequestsWithPromise')
          .and.returnValue(Promise.reject());

        const result = await viewModel.loadAllItemsIds();

        expect(result).toEqual([]);
      });
    });
  });

  describe('setItemsDebounced() method', () => {
    beforeEach(() => {
      spyOn(window, 'clearTimeout');
      spyOn(window, 'setTimeout')
        .and.returnValue(123);
    });

    it('clears timeout of viewModel._setItemsTimeout', () => {
      viewModel._setItemsTimeout = 321;
      viewModel.setItemsDebounced();
      expect(clearTimeout).toHaveBeenCalledWith(321);
    });

    it('sets timeout in viewModel._setItemsTimeout', () => {
      viewModel.setItemsDebounced();
      expect(viewModel._setItemsTimeout)
        .toEqual(123);
    });
  });

  describe('showRelatedAssessments() method', () => {
    beforeEach(() => {
      viewModel.relatedAssessments = {
        state: {},
      };
    });

    it('sets viewModel.relatedAssessments.instance', () => {
      viewModel.relatedAssessments.instance = 1;
      viewModel.showRelatedAssessments({
        instance: 123,
      });
      expect(viewModel.relatedAssessments.instance)
        .toEqual(123);
    });

    it('sets viewModel.relatedAssessments.state.open to true', () => {
      viewModel.relatedAssessments.state.open = false;
      viewModel.showRelatedAssessments({
        instance: 123,
      });
      expect(viewModel.relatedAssessments.state.open)
        .toEqual(true);
    });
  });

  describe('onItemDestroyed() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'setItems');
    });

    it('removes selected item based on passed item\'s id from "selected" ' +
    'collection', () => {
      viewModel.selected = [
        {id: 123},
        {id: 1234},
        {id: 12345},
      ];

      viewModel.onItemDestroyed({itemId: 1234});

      expect(viewModel.selected.serialize()).toEqual([
        {id: 123},
        {id: 12345},
      ]);
    });

    it('sets previous page if destroyed item was single on the page', () => {
      viewModel.items = [{}];
      viewModel.paging = new canMap({current: 3});

      viewModel.onItemDestroyed({itemId: 1});

      expect(viewModel.paging.attr('current')).toBe(2);
    });

    describe('doesn\'t set previous page', () => {
      it('if destroyed item was single on the page and current page is ' +
      'first', () => {
        viewModel.items = [{}];
        viewModel.paging = new canMap({current: 1});

        viewModel.onItemDestroyed({itemId: 1});

        expect(viewModel.paging.attr('current')).toBe(1);
      });

      it('if count of items placed on the page without destroyed item is ' +
      'more than 1', () => {
        viewModel.items = [{}, {}];
        viewModel.paging = new canMap({current: 3});

        viewModel.onItemDestroyed({itemId: 1});

        expect(viewModel.paging.attr('current')).toBe(3);
      });
    });

    it('refreshes the list of items', () => {
      viewModel.onItemDestroyed({itemId: 1});

      expect(viewModel.setItems).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    let events;

    beforeEach(() => {
      events = Component.prototype.events;
    });

    describe('"{viewModel} allSelected" event', () => {
      let handler;

      beforeEach(() => {
        spyOn(viewModel, 'loadAllItems');
        handler = events['{viewModel} allSelected'].bind({
          viewModel: viewModel,
        });
      });
      it('calls loadAllItems() if allSelected is truly', () => {
        handler([{}], {}, true);
        expect(viewModel.loadAllItems).toHaveBeenCalled();
      });
      it('does not call loadAllItems() if allSelected is falsy', () => {
        handler([{}], {}, false);
        expect(viewModel.loadAllItems).not.toHaveBeenCalled();
      });
    });

    describe('"{viewModel.paging} current" event', () => {
      let handler;

      beforeEach(() => {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.paging} current'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', () => {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.paging} pageSize" event', () => {
      let handler;

      beforeEach(() => {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.paging} pageSize'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', () => {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.sort} key" event', () => {
      let handler;

      beforeEach(() => {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.sort} key'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', () => {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.sort} direction" event', () => {
      let handler;

      beforeEach(() => {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.sort} direction'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', () => {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });
  });
});
