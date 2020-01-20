/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFilter from 'lodash/filter';
import canList from 'can-list';
import * as module from '../../../plugins/utils/tree-view-utils';
import * as aclUtils from '../../../plugins/utils/acl-utils';
import * as ImportExportUtils from '../../../plugins/utils/import-export-utils';
import * as QueryApiUtils from '../../../plugins/utils/query-api-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as MegaObjectUtils from '../../../plugins/utils/mega-object-utils';
import CycleTaskGroupObjectTask from '../../../models/business-models/cycle-task-group-object-task';
import Control from '../../../models/business-models/control';

describe('TreeViewUtils module', function () {
  'use strict';

  let method;
  let origPageType;

  beforeAll(function () {
    origPageType = GGRC.pageType;
    GGRC.pageType = 'MY_WORK';
  });

  afterAll(function () {
    GGRC.pageType = origPageType;
  });

  describe('getColumnsForModel() method', function () {
    let origCustomAttrDefs;
    let origAttrs;

    beforeAll(function () {
      method = module.getColumnsForModel;

      spyOn(aclUtils, 'getRolesForType').and.returnValue([
        {id: 9, name: 'Role 9', object_type: 'Audit'},
        {id: 3, name: 'Role 3', object_type: 'Audit'},
      ]);

      origAttrs = [].concat(CycleTaskGroupObjectTask
        .tree_view_options.display_attr_names);

      origCustomAttrDefs = GGRC.custom_attr_defs;
      GGRC.custom_attr_defs = [{
        id: 16, attribute_type: 'Text',
        definition_type: 'market', title: 'CA def 16',
      }, {
        id: 17, attribute_type: 'Rich Text',
        definition_type: 'market', title: 'CA def 17',
      }, {
        id: 5, attribute_type: 'Text',
        definition_type: 'policy', title: 'CA def 5',
      }, {
        id: 11, attribute_type: 'Text',
        definition_type: 'audit', title: 'CA def 11',
      }];
    });

    afterAll(function () {
      GGRC.custom_attr_defs = origCustomAttrDefs;
      CycleTaskGroupObjectTask
        .tree_view_options.display_attr_names =
          origAttrs;
    });

    it('includes custom roles info in the result ', function () {
      let result = method('Audit', null);
      result = loFilter(result.available, {attr_type: 'role'});

      ['Role 3', 'Role 9'].forEach(function (title) {
        let expected = {
          attr_type: 'role',
          attr_title: 'Role 9',
          attr_name: 'Role 9',
          attr_sort_field: 'Role 9',
        };
        expect(result).toContain(jasmine.objectContaining(expected));
      });
    });

    it('Sets disable_sorting flag to true for the GCAs with "Rich Text" type ',
      function () {
        let expected = {
          attr_type: 'custom',
          attr_title: 'CA def 17',
          attr_name: 'CA def 17',
          attr_sort_field: 'CA def 17',
          disable_sorting: true,
        };

        let result = method('Market', null);
        result = loFilter(result.available, {attr_type: 'custom'});

        expect(result).toContain(jasmine.objectContaining(expected));
      });

    it(`Sets disable_sorting flag to false for the GCAs
     with not "Rich Text" type `,
    function () {
      let expected = {
        attr_type: 'custom',
        attr_title: 'CA def 16',
        attr_name: 'CA def 16',
        attr_sort_field: 'CA def 16',
        disable_sorting: false,
      };

      let result = method('Market', null);
      result = loFilter(result.available, {attr_type: 'custom'});

      expect(result).toContain(jasmine.objectContaining(expected));
    });
  });

  describe('getSortingForModel() method', function () {
    let noDefaultSortingModels = [
      'Cycle',
      'TaskGroup',
      'TaskGroupTask',
      'CycleTaskGroupObjectTask',
    ];

    it('returns default sorting configuration', function () {
      let result = module.getSortingForModel('Audit');

      expect(result).toEqual({key: 'updated_at', direction: 'desc'});
    });

    it('returns empty sorting configuration', function () {
      noDefaultSortingModels.forEach((model) => {
        let result = module.getSortingForModel(model);

        expect(result).toEqual({key: null, direction: null});
      });
    });
  });

  describe('getModelsForSubTier() method', function () {
    let origFilter;

    beforeAll(function () {
      origFilter = Control.sub_tree_view_options.default_filter;
    });

    afterAll(function () {
      Control.sub_tree_view_options.default_filter = origFilter;
    });

    it('gets selected models from model\'s default_filter when available',
      function () {
        let result;

        Control.sub_tree_view_options.default_filter = ['Audit'];

        result = module.getModelsForSubTier('Control');
        expect(result.available.length).toEqual(32);
        expect(result.selected.length).toEqual(1);
        expect(result.selected[0]).toEqual('Audit');
      });

    it('returns all available models as selected when ' +
      'model\'s default_filter is not available', function () {
      let result;

      Control.sub_tree_view_options.default_filter = null;

      result = module.getModelsForSubTier('Control');
      expect(result.available.length).toEqual(32);
      expect(result.selected.length).toEqual(32);
    });
  });

  describe('loadFirstTierItems() method', function () {
    let modelName;
    let parent;
    let pageInfo;
    let filter;
    let request;
    let transformToSnapshot;
    let operation;
    let source;

    beforeEach(() => {
      modelName = 'Program';
      parent = {
        type: 'testParentType',
        id: 123,
      };
      pageInfo = {};
      filter = {testFilter: true};
      request = new canList();
      transformToSnapshot = false;
      operation = 'owned';
      source = {type: 'Program'};

      spyOn(QueryApiUtils, 'buildParam')
        .and.returnValue({object_name: 'testName'});
      spyOn(QueryApiUtils, 'batchRequests')
        .and.returnValue($.Deferred().resolve({testName: {values: [source]}}));
    });

    it('returns correct result', function (done) {
      let expectedResult = {
        values: [jasmine.objectContaining(source)],
      };
      module.loadFirstTierItems(
        modelName,
        parent,
        pageInfo,
        filter,
        request,
        transformToSnapshot,
        operation,
      ).then((response) => {
        expect(response).toEqual(expectedResult);
        done();
      });
    });
  });

  describe('makeRelevantExpression() method', function () {
    it('returns expression for load items for 1st level of tree view',
      function () {
        let result = module.makeRelevantExpression(
          'Audit', 'Program', 123, 'owned');
        expect(result).toEqual({
          type: 'Program',
          id: 123,
          operation: 'owned',
        });
      });
  });

  describe('startExport() method', () => {
    let modelName;
    let parent;
    let filter;
    let request;
    let transformToSnapshot;
    let operation;

    beforeEach(() => {
      spyOn(ImportExportUtils, 'runExport');
      spyOn(ImportExportUtils, 'fileSafeCurrentDate');
      spyOn(QueryApiUtils, 'buildParam');
      spyOn(module, 'makeRelevantExpression')
        .and.returnValue('testRelevantExpression');

      modelName = 'testModelName';
      parent = {
        type: 'testParentType',
        id: 'testParentId',
      };
      filter = {testFilter: true};
      request = new canList();
      transformToSnapshot = '';
      operation = 'owned';
    });

    it('builds request params correctly', () => {
      module.startExport(
        modelName, parent, filter, request, transformToSnapshot, operation);

      expect(QueryApiUtils.buildParam).toHaveBeenCalledWith(
        modelName,
        {},
        {type: parent.type, id: parent.id, operation},
        'all',
        filter);
    });

    it('runs export correctly', () => {
      request = new canList(['testRequest1']);
      ImportExportUtils.fileSafeCurrentDate
        .and.returnValue('testFileSafeCurrentDate');
      QueryApiUtils.buildParam
        .and.returnValue('testRequest2');

      module.startExport(modelName, parent, filter, request);

      expect(ImportExportUtils.runExport).toHaveBeenCalledWith({
        objects: ['testRequest1', 'testRequest2'],
        current_time: 'testFileSafeCurrentDate',
        exportable_objects: [1],
      });
    });
  });

  describe('loadItemsForSubTier() method', () => {
    beforeEach(() => {
      spyOn(QueryApiUtils, 'batchRequests');
      spyOn(CurrentPageUtils, 'initMappedInstances')
        .and.returnValue($.Deferred().resolve());
      spyOn(SnapshotUtils, 'isSnapshotRelated');
      spyOn(MegaObjectUtils, 'isMegaObjectRelated');
    });

    function emptyBatchResponse(params) {
      if (params.type === 'count') {
        return $.Deferred().resolve({
          [params.object_name]: {
            total: 0,
          },
        });
      }

      return $.Deferred().resolve({
        [params.object_name]: {
          total: 0,
          values: [],
        },
      });
    }

    function notEmptyBatchResponse(params) {
      if (params.type === 'count') {
        return $.Deferred().resolve({
          [params.object_name]: {
            total: 1,
          },
        });
      }

      if (params.object_name === 'Snapshot') {
        return $.Deferred().resolve({
          [params.object_name]: {
            total: 1,
            values: [{
              id: 1,
              type: 'Snapshot',
              child_type: params.filters.expression.left.right,
              revision: {content: {}},
            }],
          }});
      }

      return $.Deferred().resolve({
        [params.object_name]: {
          total: 1,
          values: [{
            id: 1,
            type: params.object_name,
          }],
        }});
    }

    it('should make requests in the correct order: first - count requests, ' +
      'then object requests', (done) => {
      QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

      let widgetIds = ['Metric', 'Contract'];
      module.loadItemsForSubTier(widgetIds, 'Issue', 1, null, {})
        .then(() => {
          let queries = QueryApiUtils.batchRequests.calls.allArgs();

          expect(queries.length).toBe(4);

          // first two requests to get counts
          expect(queries[0][0]).toEqual(jasmine.objectContaining({
            type: 'count',
          }));
          expect(queries[1][0]).toEqual(jasmine.objectContaining({
            type: 'count',
          }));

          // next two requests to get objects
          expect(queries[2][0]).toEqual(jasmine.objectContaining({
            fields: jasmine.any(Array),
          }));
          expect(queries[3][0]).toEqual(jasmine.objectContaining({
            fields: jasmine.any(Array),
          }));

          done();
        });
    });

    it('should make correct counts request', (done) => {
      QueryApiUtils.batchRequests.and.callFake(emptyBatchResponse);

      let widgetIds = ['Metric', 'Contract'];
      module.loadItemsForSubTier(widgetIds, 'Issue', 1, null, {})
        .then(() => {
          let queries = QueryApiUtils.batchRequests.calls.allArgs();

          expect(queries[0][0]).toEqual({
            object_name: 'Metric',
            type: 'count',
            filters: {
              expression: {
                object_name: 'Issue',
                op: {name: 'relevant'},
                ids: ['1'],
              },
            },
          });

          // makes Snapshot request for *_version model
          expect(queries[1][0]).toEqual({
            object_name: 'Contract',
            type: 'count',
            filters: {
              expression: {
                object_name: 'Issue',
                op: {name: 'relevant'},
                ids: ['1']},
            },
          });

          done();
        });
    });

    it('should make correct objects requests', (done) => {
      QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

      let widgetIds = ['Metric', 'Contract'];
      module.loadItemsForSubTier(widgetIds, 'Issue', 1, null, {})
        .then(() => {
          let queries = QueryApiUtils.batchRequests.calls.allArgs();

          expect(queries.length).toBe(4);

          expect(queries[2][0]).toEqual({
            object_name: 'Metric',
            filters: {
              expression: {
                object_name: 'Issue',
                op: {name: 'relevant'},
                ids: ['1'],
              },
            },
            fields: jasmine.any(Array),
          });

          // makes Snapshot request for *_version model
          expect(queries[3][0]).toEqual({
            object_name: 'Contract',
            filters: {
              expression: {
                object_name: 'Issue',
                op: {name: 'relevant'},
                ids: ['1']},
            },
            fields: jasmine.any(Array),
          });

          done();
        });
    });

    describe('for Cycle, CycleTaskGroup, CycleTaskGroupObjectTask', () => {
      ['Cycle', 'CycleTaskGroup', 'CycleTaskGroupObjectTask']
        .forEach((model) => {
          it(`should not make counts requests (${model})`, (done) => {
            QueryApiUtils.batchRequests.and.callFake(emptyBatchResponse);

            module.loadItemsForSubTier(['Metric', 'Policy'], model, 1, null, {})
              .then(() => {
                let queries = QueryApiUtils.batchRequests.calls.allArgs();

                queries.forEach((args) => {
                  expect(args[0].type).not.toBe('count');
                });

                done();
              });
          });

          it(`should make correct objects requests (${model})`, (done) => {
            QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

            module.loadItemsForSubTier(['Metric'], model, 1, null, {})
              .then(() => {
                let queries = QueryApiUtils.batchRequests.calls.allArgs();

                expect(queries[0][0]).toEqual({
                  object_name: 'Metric',
                  filters: {
                    expression: {
                      object_name: model,
                      op: {name: 'relevant'},
                      ids: ['1'],
                    },
                  },
                  fields: [],
                });

                done();
              });
          });
        });
    });

    describe('for object versions objects (Issue)', () => {
      it('should make correct counts request', (done) => {
        QueryApiUtils.batchRequests.and.callFake(emptyBatchResponse);

        let widgetIds = ['Metric', 'Metric_version'];
        module.loadItemsForSubTier(widgetIds, 'Issue', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries[0][0]).toEqual({
              object_name: 'Metric',
              type: 'count',
              filters: {
                expression: {
                  object_name: 'Issue',
                  op: {name: 'relevant'},
                  ids: ['1'],
                },
              },
            });

            // makes Snapshot request for *_version model
            expect(queries[1][0]).toEqual({
              object_name: 'Snapshot',
              type: 'count',
              filters: {
                expression: {
                  left: {left: 'child_type', op: {name: '='}, right: 'Metric'},
                  op: {name: 'AND'},
                  right: {
                    object_name: 'Issue',
                    op: {name: 'relevant'},
                    ids: ['1']},
                },
              },
            });

            done();
          });
      });

      it('should make correct objects requests', (done) => {
        QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

        let widgetIds = ['Metric', 'Metric_version'];
        module.loadItemsForSubTier(widgetIds, 'Issue', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries.length).toBe(4);

            expect(queries[2][0]).toEqual({
              object_name: 'Metric',
              filters: {
                expression: {
                  object_name: 'Issue',
                  op: {name: 'relevant'},
                  ids: ['1'],
                },
              },
              fields: jasmine.any(Array),
            });

            // makes Snapshot request for *_version model
            expect(queries[3][0]).toEqual({
              object_name: 'Snapshot',

              filters: {
                expression: {
                  left: {left: 'child_type', op: {name: '='}, right: 'Metric'},
                  op: {name: 'AND'},
                  right: {
                    object_name: 'Issue',
                    op: {name: 'relevant'},
                    ids: ['1']},
                },
              },
              fields: jasmine.any(Array),
            });

            done();
          });
      });
    });

    describe('for snapshot related objects', () => {
      it('should make correct counts request', (done) => {
        QueryApiUtils.batchRequests.and.callFake(emptyBatchResponse);

        SnapshotUtils.isSnapshotRelated.and.returnValue(true);

        module.loadItemsForSubTier(['Metric'], 'Audit', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries.length).toBe(1);

            expect(queries[0][0]).toEqual({
              object_name: 'Snapshot',
              type: 'count',
              filters: {
                expression: {
                  left: {left: 'child_type', op: {name: '='}, right: 'Metric'},
                  op: {name: 'AND'},
                  right: {
                    object_name: 'Audit',
                    op: {name: 'relevant'},
                    ids: ['1'],
                  },
                },
              },
            });

            done();
          });
      });

      it('should make correct objects requests', (done) => {
        QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

        SnapshotUtils.isSnapshotRelated.and.returnValue(true);

        let widgetIds = ['Metric'];
        module.loadItemsForSubTier(widgetIds, 'Audit', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries.length).toBe(2);

            expect(queries[1][0]).toEqual({
              object_name: 'Snapshot',

              filters: {
                expression: {
                  left: {left: 'child_type', op: {name: '='}, right: 'Metric'},
                  op: {name: 'AND'},
                  right: {
                    object_name: 'Audit',
                    op: {name: 'relevant'},
                    ids: ['1']},
                },
              },
              fields: jasmine.any(Array),
            });

            done();
          });
      });
    });

    describe('for mega objects', () => {
      it('should make correct counts request', (done) => {
        QueryApiUtils.batchRequests.and.callFake(emptyBatchResponse);

        MegaObjectUtils.isMegaObjectRelated.and.returnValue(true);

        let widgetIds = ['Program_child', 'Program_parent'];
        module.loadItemsForSubTier(widgetIds, 'Program', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries.length).toBe(2);

            expect(queries[0][0]).toEqual({
              object_name: 'Program',
              type: 'count',
              filters: {
                expression: {
                  object_name: 'Program',
                  op: {name: 'child'},
                  ids: ['1'],
                },
              },
            });

            // makes Snapshot request for *_version model
            expect(queries[1][0]).toEqual({
              object_name: 'Program',
              type: 'count',
              filters: {
                expression: {
                  object_name: 'Program',
                  op: {name: 'parent'},
                  ids: ['1'],
                },
              },
            });

            done();
          });
      });

      it('should make correct objects requests', (done) => {
        QueryApiUtils.batchRequests.and.callFake(notEmptyBatchResponse);

        MegaObjectUtils.isMegaObjectRelated.and.returnValue(true);

        let widgetIds = ['Program_child', 'Program_parent'];
        module.loadItemsForSubTier(widgetIds, 'Program', 1, null, {})
          .then(() => {
            let queries = QueryApiUtils.batchRequests.calls.allArgs();

            expect(queries.length).toBe(4);

            expect(queries[2][0]).toEqual({
              object_name: 'Program',
              filters: {
                expression: {
                  object_name: 'Program',
                  op: {name: 'child'},
                  ids: ['1'],
                },
              },
              fields: jasmine.any(Array),
            });

            // makes Snapshot request for *_version model
            expect(queries[3][0]).toEqual({
              object_name: 'Program',
              filters: {
                expression: {
                  object_name: 'Program',
                  op: {name: 'parent'},
                  ids: ['1'],
                },
              },
              fields: jasmine.any(Array),
            });

            done();
          });
      });
    });
  });
});
