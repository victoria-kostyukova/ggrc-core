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
import Program from '../../../models/business-models/program';
import QueryParser from '../../../generated/ggrc-filter-query-parser';

describe('mapper-results component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    let init = Component.prototype.viewModel.prototype.init;
    Component.prototype.viewModel.prototype.init = undefined;
    viewModel = getComponentVM(Component);
    viewModel.attr('mapper', {
      type: 'Control',
    });
    viewModel.attr('paging',
      new Pagination({pageSizeSelect: [5, 10, 15]}));
    Component.prototype.viewModel.prototype.init = init;
    viewModel.init = init;
  });

  describe('isMegaMapping getter', function () {
    it('should return true for equal mega object', function () {
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Program');
      expect(viewModel.attr('isMegaMapping')).toBeTruthy();
    });

    it('should return false for different object', function () {
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Cotrol');
      expect(viewModel.attr('isMegaMapping')).toBeFalsy();
    });
  });

  describe('serviceColumnsEnabled getter', function () {
    it('should return length of columns.service attribute', function () {
      viewModel.attr('columns.service', [1, 2]);
      expect(viewModel.attr('serviceColumnsEnabled')).toBe(2);
    });
  });

  describe('setItems() method', function () {
    let items;

    beforeEach(function () {
      items = [
        {data: 'mockData'},
      ];
      spyOn(viewModel, 'load')
        .and.returnValue($.Deferred().resolve(items));
      spyOn(viewModel, 'setColumnsConfiguration');
      spyOn(viewModel, 'setRelatedAssessments');
      viewModel.attr({});
    });

    it('sets loaded items to viewModel.items', function (done) {
      viewModel.attr('items', []);
      viewModel.setItems().then(() => {
        expect(viewModel.attr('items').length).toEqual(1);
        expect(viewModel.attr('items')[0])
          .toEqual(jasmine.objectContaining({
            data: 'mockData',
          }));
        done();
      });
    });

    it('calls setColumnsConfiguration and setRelatedAssessments',
      function (done) {
        viewModel.setItems().then(() => {
          expect(viewModel.setColumnsConfiguration).toHaveBeenCalled();
          expect(viewModel.setRelatedAssessments).toHaveBeenCalled();
          done();
        });
      });

    it('sets viewModel.isBeforeLoad to false', function (done) {
      viewModel.attr('isBeforeLoad', true);
      viewModel.setItems().then(() => {
        expect(viewModel.attr('isBeforeLoad')).toEqual(false);
        done();
      });
    });
  });

  describe('setColumnsConfiguration() method', function () {
    let mockColumns;

    beforeEach(function () {
      viewModel.attr('columns', {});
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Control');
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

    it('updates available columns', function () {
      viewModel.attr('columns.available', 'available');
      viewModel.setColumnsConfiguration();
      expect(viewModel.attr('columns.available')).toEqual('mock1');
    });

    it('updates selected columns', function () {
      viewModel.attr('columns.selected', 'selected');
      viewModel.setColumnsConfiguration();
      expect(viewModel.attr('columns.selected')).toEqual('mock2');
    });

    it('updates disableColumnsConfiguration', function () {
      viewModel.attr('disableColumnsConfiguration', 'configuration');
      viewModel.setColumnsConfiguration();
      expect(viewModel.attr('disableColumnsConfiguration')).toEqual('mock3');
    });

    it('updates service columns if "isMegaMapping" is true', function () {
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Program');
      viewModel.setColumnsConfiguration();
      expect(viewModel.attr('columns.service')).toEqual('mock4');
    });

    it('updates service columns with an empty array ' +
    'if "isMegaMapping" is false', function () {
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Control');
      viewModel.setColumnsConfiguration();
      expect(makeArray(viewModel.attr('columns.service'))).toEqual([]);
    });
  });

  describe('setSortingConfiguration() method', () => {
    beforeEach(function () {
      viewModel.attr('columns', {});
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
      viewModel.attr('sort.key', null);
      viewModel.setSortingConfiguration();

      expect(viewModel.attr('sort.key')).toEqual('key');
    });

    it('updates sort direction', () => {
      viewModel.attr('sort.direction', null);
      viewModel.setSortingConfiguration();

      expect(viewModel.attr('sort.direction')).toEqual('direction');
    });
  });

  describe('setRelatedAssessments() method', function () {
    beforeEach(function () {
      viewModel.attr({});
      viewModel.attr('relatedAssessments', {});
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          tree_view_options: {
            show_related_assessments: true,
          },
        });
    });

    it('sets relatedAssessments.show to false if it is use-snapshots case',
      function () {
        viewModel.attr('useSnapshots', true);
        viewModel.setRelatedAssessments();
        expect(viewModel.attr('relatedAssessments.show')).toEqual(false);
      });

    it('updates relatedAssessments.show if it is not use-snapshots case',
      function () {
        viewModel.attr('useSnapshots', false);
        viewModel.setRelatedAssessments();
        expect(viewModel.attr('relatedAssessments.show')).toEqual(true);
      });
  });

  describe('resetSearchParams() method', function () {
    const DEFAULT_PAGE_SIZE = 10;

    beforeEach(function () {
      viewModel.attr('paging', {});
      viewModel.attr('sort', {});
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue({
          model_singular: '',
        });
    });

    it('sets 1 to current of paging', function () {
      viewModel.attr('paging.current', 9);
      viewModel.resetSearchParams();
      expect(viewModel.attr('paging.current')).toEqual(1);
    });

    it('sets default size to pageSize of paging', function () {
      viewModel.attr('paging.pageSize', 11);
      viewModel.resetSearchParams();
      expect(viewModel.attr('paging.pageSize')).toEqual(DEFAULT_PAGE_SIZE);
    });

    it('sets default sorting', () => {
      spyOn(viewModel, 'setSortingConfiguration');

      viewModel.resetSearchParams();
      expect(viewModel.setSortingConfiguration).toHaveBeenCalled();
    });
  });

  describe('onSearch() method', function () {
    beforeEach(function () {
      spyOn(viewModel, 'resetSearchParams');
      spyOn(viewModel, 'setItemsDebounced');
    });

    it('calls resetSearchParams()', function () {
      viewModel.onSearch();
      expect(viewModel.resetSearchParams).toHaveBeenCalled();
    });

    it('calls setItemsDebounced()', () => {
      viewModel.onSearch();
      expect(viewModel.setItemsDebounced).toHaveBeenCalled();
    });
  });

  describe('prepareRelevantQuery() method', function () {
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
    beforeEach(function () {
      viewModel.attr('relevantTo', relevantList);
    });
    it('returns relevant filters', function () {
      let result = viewModel.prepareRelevantQuery();
      expect(result.attr()).toEqual(expectedResult);
    });
  });

  describe('prepareRelatedQuery() method', function () {
    it('returns null if viewModel.baseInstance is undefined', function () {
      let result = viewModel.prepareRelatedQuery();
      expect(result).toEqual(null);
    });

    it('returns query', function () {
      let result;
      viewModel.attr('baseInstance', {
        type: 'mockType',
        id: 123,
      });
      spyOn(QueryAPI, 'buildRelevantIdsQuery')
        .and.returnValue('mockQuery');
      result = viewModel.prepareRelatedQuery();
      expect(result).toEqual('mockQuery');
    });
  });

  describe('loadAllItems() method', function () {
    beforeEach(function () {
      spyOn(viewModel, 'loadAllItemsIds')
        .and.returnValue('mockItems');
    });

    it('updates viewModel.allItems', function () {
      viewModel.loadAllItems();
      expect(viewModel.attr('allItems')).toEqual('mockItems');
    });
  });

  describe('getQuery() method', function () {
    let mockPaging = {
      current: 'mock1',
      pageSize: 'mock2',
    };
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

    beforeEach(function () {
      viewModel.attr('type', 'mockName');
      viewModel.attr('paging', mockPaging);
      viewModel.attr('sort', mockSort);
      viewModel.attr('filterItems', mockFilterItems);
      viewModel.attr('mappingItems', mockMappingItems);
      viewModel.attr('statusItem', mockStatusItem);

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

    it('builds advanced filters', function () {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(0)[0])
        .toEqual(mockFilterItems.attr());
    });

    it('builds advanced mappings', function () {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(1)[0])
        .toEqual(mockMappingItems.attr());
    });

    it('builds advanced status', function () {
      viewModel.getQuery('values', true);
      expect(AdvancedSearch.buildFilter.calls.argsFor(2)[0][0])
        .toEqual(mockStatusItem.attr());
    });

    it('does not build advanced status if sttatus items are not provided',
      function () {
        viewModel.attr('statusItem', {});
        viewModel.getQuery('values', true);
        expect(AdvancedSearch.buildFilter.calls.count()).toBe(2);
      });

    it('adds paging to query if addPaging is true', function () {
      viewModel.removeAttr('sort.key');
      viewModel.getQuery('values', true);
      expect(QueryAPI.buildParam.calls.argsFor(0)[1])
        .toEqual({
          current: 'mock1',
          pageSize: 'mock2',
        });
    });

    it('adds paging with sort to query if sort.key is defined', function () {
      viewModel.getQuery('values', true);
      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].key)
        .toBe('mock3');
      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].direction)
        .toBe('mock4');
    });

    it('adds defaultSort to paging if no sort', function () {
      viewModel.removeAttr('sort');
      viewModel.attr('defaultSort', [{key: 'mock5', direction: 'mock6'}]);
      viewModel.getQuery('values', true);

      expect(QueryAPI.buildParam.calls.argsFor(0)[1].sort[0].key).toBe('mock5');
    });

    it('sets "read" to permissions if model is person', function () {
      let result;
      viewModel.attr('type', 'Person');
      viewModel.attr('useSnapshots', false);
      result = viewModel.getQuery('Person', true);
      expect(result.request[0]).toEqual(jasmine.objectContaining({
        permissions: 'read',
        type: 'Person',
      }));
    });

    it('transform query to snapshot if useSnapshots is true', function () {
      let result;
      viewModel.attr('useSnapshots', true);
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

    it('set "read" permission if "searchOnly"', function () {
      let result;
      viewModel.attr('searchOnly', true);
      result = viewModel.getQuery();
      expect(result.request[0]).toEqual(jasmine.objectContaining({
        permissions: 'read',
      }));
    });

    it('prepare request for unlocked items for Audits', function () {
      viewModel.attr('type', 'Audit');
      spyOn(viewModel, 'prepareUnlockedFilter').and.returnValue('unlocked');
      viewModel.getQuery();

      expect(QueryParser.joinQueries.calls.argsFor(2)[1])
        .toBe('unlocked');
    });

    it('prepare request for owned items if flag was set', function () {
      let mockUser = {
        id: -1,
      };
      let oldUser = GGRC.current_user;
      GGRC.current_user = mockUser;
      spyOn(GGRC.current_user, 'id').and.returnValue(-1);
      viewModel.attr('applyOwnedFilter', true);

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

    it('set result if "isMegaMapping" true', function () {
      let result = viewModel.getQuery('values', true, true);
      expect(result).toEqual(jasmine.objectContaining({
        parentQueryIndex: 1,
        childQueryIndex: 2,
      }));
    });

    it('set result if "isMegaMapping" false', function () {
      let result = viewModel.getQuery('values', true, false);
      expect(result).toEqual(jasmine.objectContaining({relatedQueryIndex: 1}));
    });
  });

  describe('getModelKey() method', function () {
    it('returns "Snapshot" if useSnapshots is true', function () {
      let result;
      viewModel.attr('useSnapshots', true);
      result = viewModel.getModelKey();
      expect(result).toEqual('Snapshot');
    });

    it('returns type of model if useSnapshots is false', function () {
      let result;
      viewModel.attr('type', 'Mock');
      viewModel.attr('useSnapshots', false);
      result = viewModel.getModelKey();
      expect(result).toEqual('Mock');
    });
  });

  describe('getDisplayModel() method', function () {
    it('returns displayModel', function () {
      let result;
      viewModel.attr('type', 'Program');
      result = viewModel.getDisplayModel();
      expect(result).toEqual(Program);
    });
  });

  describe('setDisabledItems() method', function () {
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

    it('does nothing if viewModel.searchOnly() is true', function () {
      viewModel.attr('searchOnly', true);
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(allItems);
    });

    it('does nothing if it is case of object generation',
      function () {
        viewModel.attr({
          objectGenerator: true,
        });
        viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
        expect(allItems).toEqual(allItems);
      });

    it('updates disabled items', function () {
      viewModel.attr('searchOnly', false);
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });

    it('updates disabled items if "isMegaMapping" is true', function () {
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

      viewModel.attr('searchOnly', false);
      viewModel.setDisabledItems(isMegaMapping, allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('setSelectedItems() method', function () {
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

    it('updates selected items', function () {
      viewModel.attr('selected', [{id: 123}]);
      viewModel.setSelectedItems(allItems);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('setMegaRelations() method', function () {
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

    it('updates mega relations items', function () {
      viewModel.attr('megaRelationObj', {
        '234': 'parent',
        defaultValue: 'child',
      });
      viewModel.setMegaRelations(allItems, relatedData, type);
      expect(allItems).toEqual(expectedResult);
    });
  });

  describe('disableItself() method', function () {
    let allItems = [{
      type: 'mockType',
      id: 123,
    }, {
      type: 'mockType',
      id: 124,
    }];
    let isMegaMapping = false;
    let expectedResult;

    it('do nothing if baseInstance is undefined', function () {
      viewModel.disableItself(isMegaMapping, allItems);
      expect(allItems).toEqual(allItems);
    });

    it('updates "disabledIds" attr', function () {
      viewModel.attr('baseInstance', {
        type: 'mockType',
        id: 123,
      });
      viewModel.disableItself(isMegaMapping, allItems);
      expect(makeArray(viewModel.attr('disabledIds'))).toEqual([123]);
    });

    it('assigns true to "isDisabled" for allItems ' +
    'if self is true', function () {
      viewModel.attr('baseInstance', {
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
    'if isMegaMapping is true', function () {
      isMegaMapping = true;
      viewModel.attr('baseInstance', {
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

  describe('transformValue() method', function () {
    let Model;

    beforeEach(function () {
      Model = {
        model: jasmine.createSpy().and.returnValue('transformedValue'),
      };
      spyOn(viewModel, 'getDisplayModel')
        .and.returnValue(Model);
    });

    it('returns transformed value', function () {
      let result;
      let value = 'mockValue';
      viewModel.attr('useSnapshots', false);
      result = viewModel.transformValue(value);
      expect(result).toEqual('transformedValue');
    });

    it('returns snapshot-transformed value if it is use-snapshots case',
      function () {
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
        viewModel.attr('useSnapshots', true);
        result = viewModel.transformValue(value);
        expect(result).toEqual(expectedResult);
      });
  });

  describe('load() method', function () {
    let data = {
      program: {
        values: [{
          id: 123,
          type: 'mockType',
        }],
        total: 4,
      },
    };
    let expectedResult = [{
      id: 123,
      type: 'mockType',
      data: 'transformedValue',
    }];
    let relatedData;
    let dfdRequest;
    let resultDfd;

    beforeEach(function () {
      viewModel.attr('object', 'Program');
      viewModel.attr('type', 'Control');
      spyOn(viewModel, 'getModelKey')
        .and.returnValue('program');
      spyOn(viewModel, 'getQuery')
        .and.returnValue({
          queryIndex: 0,
          relatedQueryIndex: 1,
          request: [],
        });
      spyOn(viewModel, 'transformValue')
        .and.returnValue('transformedValue');
      spyOn(viewModel, 'setSelectedItems');
      spyOn(viewModel, 'setDisabledItems');
      spyOn(viewModel, 'setMegaRelations');
      spyOn(viewModel, 'disableItself');
      dfdRequest = $.Deferred();
      spyOn(QueryAPI, 'batchRequests');
      spyOn($, 'when')
        .and.returnValue(dfdRequest.promise());
    });

    it('calls viewModel.setSelectedItems()', function () {
      dfdRequest.resolve(data, relatedData);
      viewModel.load();
      expect(viewModel.setSelectedItems)
        .toHaveBeenCalledWith(expectedResult);
    });

    it('calls viewModel.setDisabledItems() if relatedData is defined',
      function () {
        relatedData = {
          program: {
            ids: 'ids',
          },
        };
        let megaMapping = false;
        let type = 'program';
        dfdRequest.resolve(data, relatedData);
        viewModel.load();
        expect(viewModel.setDisabledItems)
          .toHaveBeenCalledWith(megaMapping, expectedResult, relatedData, type);
      });

    it('calls viewModel.setMegaRelations() if "isMegaMapping" is true',
      function () {
        relatedData = {
          parent: {
            program: {
              ids: [],
            },
          },
          child: {
            program: {
              ids: [123],
            },
          },
        };
        viewModel.attr('type', 'Program');
        spyOn(viewModel, 'getRelatedData').and.returnValue(relatedData);
        dfdRequest.resolve(data, relatedData);
        viewModel.load();
        expect(viewModel.setMegaRelations)
          .toHaveBeenCalledWith(expectedResult, relatedData, 'program');
      });

    it('calls viewModel.disableItself()', function () {
      let isMegaMapping = false;
      dfdRequest.resolve(data, relatedData);
      viewModel.load();
      expect(viewModel.disableItself)
        .toHaveBeenCalledWith(isMegaMapping, expectedResult);
    });

    it('updates paging', function () {
      dfdRequest.resolve(data, relatedData);
      viewModel.load();
      expect(viewModel.attr('paging.total')).toEqual(4);
    });

    it('sets isLoading to false', function () {
      dfdRequest.resolve(data, relatedData);
      viewModel.load();
      expect(viewModel.attr('isLoading')).toEqual(false);
    });

    it('returns promise with array of items', function (done) {
      dfdRequest.resolve(data, relatedData);
      resultDfd = viewModel.load();
      expect(resultDfd.state()).toEqual('resolved');
      resultDfd.then(function (result) {
        expect(result).toEqual(expectedResult);
        done();
      });
    });

    it('returns promise with empty array if fail', function (done) {
      dfdRequest.reject();
      resultDfd = viewModel.load();
      expect(resultDfd.state()).toEqual('resolved');
      resultDfd.then(function (result) {
        expect(result).toEqual([]);
        done();
      });
    });
  });

  describe('getRelatedData() method', function () {
    let isMegaMapping;
    let responseArray = [];
    let query = {};
    let modelKey = '';
    let result;

    beforeEach(function () {
      spyOn(viewModel, 'buildMegaRelatedData')
        .withArgs(responseArray, query, modelKey)
        .and.returnValue({mock: 123});
      spyOn(viewModel, 'buildRelatedData')
        .withArgs(responseArray, query, modelKey)
        .and.returnValue({mock: 456});
    });

    it('should return the result of buildMegaRelatedData() call' +
    'if "isMegaMapping" is true', function () {
      isMegaMapping = true;

      result = viewModel.getRelatedData(
        isMegaMapping, responseArray, query, modelKey);
      expect(viewModel.buildMegaRelatedData)
        .toHaveBeenCalledWith(responseArray, query, modelKey);
      expect(result).toEqual({mock: 123});
    }
    );

    it('should return the result of buildRelatedData() call ' +
    'if "isMegaMapping" is false', function () {
      isMegaMapping = false;

      result = viewModel.getRelatedData(
        isMegaMapping, responseArray, query, modelKey);
      expect(viewModel.buildRelatedData)
        .toHaveBeenCalledWith(responseArray, query, modelKey);
      expect(result).toEqual({mock: 456});
    }
    );
  });

  describe('buildRelatedData() method', function () {
    it('method should return data from "relatedData" array',
      function () {
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
      function () {
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

        viewModel.attr('deferredList', [
          {id: 5, type: 'Snapshot'},
          {id: 25, type: 'Snapshot'},
        ]);

        result = viewModel
          .buildRelatedData(responseArray, query, 'Snapshot');
        expect(result.Snapshot.ids.length).toEqual(2);
        expect(result.Snapshot.ids[0]).toEqual(5);
      }
    );

    it('return data from "deferred_list" array. RelatedData is undefined',
      function () {
        let result;
        let query = {
          relatedQueryIndex: 0,
        };

        viewModel.attr('deferredList', [
          {id: 5, type: 'Snapshot'},
          {id: 25, type: 'Snapshot'},
        ]);

        result = viewModel
          .buildRelatedData([], query, 'Snapshot');
        expect(result.Snapshot.ids.length).toEqual(2);
        expect(result.Snapshot.ids[0]).toEqual(5);
      }
    );
  });

  describe('buildMegaRelatedData() method', function () {
    let responseArray;
    let query;
    let result;

    it('method should return data from "relatedData" array ' +
    'if "parentQueryIndex" and "childQueryIndex" are defined', function () {
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
    'if "parentQueryIndex" and "childQueryIndex" are not defined', function () {
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

  describe('loadAllItemsIds() method', function () {
    let data = {
      program: {
        ids: [123],
      },
    };

    let expectedResult = [{
      id: 123,
      type: 'program',
    }];

    let filters = {
      program: {
        ids: [123],
      },
    };

    let dfdRequest;

    beforeEach(function () {
      viewModel.attr({});
      dfdRequest = $.Deferred();
      spyOn(QueryAPI, 'batchRequests');
      spyOn($, 'when')
        .and.returnValue(dfdRequest.promise());

      spyOn(viewModel, 'getQuery')
        .and.returnValue({
          queryIndex: 0,
          relatedQueryIndex: 1,
          request: [],
        });
      spyOn(viewModel, 'transformValue')
        .and.returnValue('transformedValue');
    });

    it('rerturns promise with items', function (done) {
      spyOn(viewModel, 'getModelKey')
        .and.returnValue('program');
      dfdRequest.resolve(data, filters);
      viewModel.attr('objectGenerator', true);
      let resultDfd = viewModel.loadAllItemsIds();
      expect(resultDfd.state()).toEqual('resolved');
      resultDfd.then(function (result) {
        expect(result).toEqual(expectedResult);
        done();
      });
    });

    it('returns promise with snapshot items', (done) => {
      let data = {
        snapshot: {
          ids: [123],
        },
      };

      let filters = {
        snapshot: {
          ids: [],
        },
      };

      let expectedResult = [{
        id: 123,
        type: 'snapshot',
        child_type: 'program',
      }];

      spyOn(viewModel, 'getModelKey')
        .and.returnValue('snapshot');
      viewModel.attr('type', 'program');
      viewModel.attr('useSnapshots', true);
      dfdRequest.resolve(data, filters);
      let resultDfd = viewModel.loadAllItemsIds();
      expect(resultDfd.state()).toEqual('resolved');
      resultDfd.then((result) => {
        expect(result).toEqual(expectedResult);
        done();
      });
    });

    it('performs extra mapping validation in case Assessment generation',
      function (done) {
        spyOn(viewModel, 'getModelKey')
          .and.returnValue('program');
        dfdRequest.resolve(data, filters);
        viewModel.attr('objectGenerator', false);
        let resultDfd = viewModel.loadAllItemsIds();
        expect(resultDfd.state()).toEqual('resolved');
        resultDfd.then(function (result) {
          expect(result).toEqual([]);
          done();
        });
      });

    it('rerturns promise with empty array if fail',
      function (done) {
        dfdRequest.reject();
        viewModel.attr('objectGenerator', true);
        let resultDfd = viewModel.loadAllItemsIds();
        expect(resultDfd.state()).toEqual('resolved');
        resultDfd.then(function (result) {
          expect(result).toEqual([]);
          done();
        });
      });
  });

  describe('setItemsDebounced() method', function () {
    beforeEach(function () {
      spyOn(window, 'clearTimeout');
      spyOn(window, 'setTimeout')
        .and.returnValue(123);
    });

    it('clears timeout of viewModel._setItemsTimeout', function () {
      viewModel.attr('_setItemsTimeout', 321);
      viewModel.setItemsDebounced();
      expect(clearTimeout).toHaveBeenCalledWith(321);
    });

    it('sets timeout in viewModel._setItemsTimeout', function () {
      viewModel.setItemsDebounced();
      expect(viewModel.attr('_setItemsTimeout'))
        .toEqual(123);
    });
  });

  describe('showRelatedAssessments() method', function () {
    beforeEach(function () {
      viewModel.attr('relatedAssessments', {
        state: {},
      });
    });

    it('sets viewModel.relatedAssessments.instance', function () {
      viewModel.attr('relatedAssessments.instance', 1);
      viewModel.showRelatedAssessments({
        instance: 123,
      });
      expect(viewModel.attr('relatedAssessments.instance'))
        .toEqual(123);
    });

    it('sets viewModel.relatedAssessments.state.open to true', function () {
      viewModel.attr('relatedAssessments.state.open', false);
      viewModel.showRelatedAssessments({
        instance: 123,
      });
      expect(viewModel.attr('relatedAssessments.state.open'))
        .toEqual(true);
    });
  });

  describe('onItemDestroyed() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'setItems');
    });

    it('removes selected item based on passed item\'s id from "selected" ' +
    'collection', () => {
      viewModel.attr('selected', [
        {id: 123},
        {id: 1234},
        {id: 12345},
      ]);

      viewModel.onItemDestroyed({itemId: 1234});

      expect(viewModel.attr('selected').serialize()).toEqual([
        {id: 123},
        {id: 12345},
      ]);
    });

    it('sets previous page if destroyed item was single on the page', () => {
      viewModel.attr('items', [{}]);
      viewModel.attr('paging', {current: 3});

      viewModel.onItemDestroyed({itemId: 1});

      expect(viewModel.attr('paging.current')).toBe(2);
    });

    describe('doesn\'t set previous page', () => {
      it('if destroyed item was single on the page and current page is ' +
      'first', () => {
        viewModel.attr('items', [{}]);
        viewModel.attr('paging', {current: 1});

        viewModel.onItemDestroyed({itemId: 1});

        expect(viewModel.attr('paging.current')).toBe(1);
      });

      it('if count of items placed on the page without destroyed item is ' +
      'more than 1', () => {
        viewModel.attr('items', [{}, {}]);
        viewModel.attr('paging', {current: 3});

        viewModel.onItemDestroyed({itemId: 1});

        expect(viewModel.attr('paging.current')).toBe(3);
      });
    });

    it('refreshes the list of items', () => {
      viewModel.onItemDestroyed({itemId: 1});

      expect(viewModel.setItems).toHaveBeenCalled();
    });
  });

  describe('events', function () {
    let events;

    beforeEach(function () {
      events = Component.prototype.events;
    });

    describe('"{viewModel} allSelected" event', function () {
      let handler;

      beforeEach(function () {
        spyOn(viewModel, 'loadAllItems');
        handler = events['{viewModel} allSelected'].bind({
          viewModel: viewModel,
        });
      });
      it('calls loadAllItems() if allSelected is truly', function () {
        handler([{}], {}, true);
        expect(viewModel.loadAllItems).toHaveBeenCalled();
      });
      it('does not call loadAllItems() if allSelected is falsy', function () {
        handler([{}], {}, false);
        expect(viewModel.loadAllItems).not.toHaveBeenCalled();
      });
    });

    describe('"{viewModel.paging} current" event', function () {
      let handler;

      beforeEach(function () {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.paging} current'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', function () {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.paging} pageSize" event', function () {
      let handler;

      beforeEach(function () {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.paging} pageSize'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', function () {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.sort} key" event', function () {
      let handler;

      beforeEach(function () {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.sort} key'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', function () {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });

    describe('"{viewModel.sort} direction" event', function () {
      let handler;

      beforeEach(function () {
        spyOn(viewModel, 'setItemsDebounced');
        handler = events['{viewModel.sort} direction'].bind({
          viewModel: viewModel,
        });
      });
      it('calls setItemsDebounced()', function () {
        handler();
        expect(viewModel.setItemsDebounced).toHaveBeenCalled();
      });
    });
  });
});
