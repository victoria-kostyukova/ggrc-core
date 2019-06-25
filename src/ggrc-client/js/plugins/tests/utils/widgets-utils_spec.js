/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loMap from 'lodash/map';
import * as AjaxExtensions from '../../../plugins/ajax_extensions';
import * as TreeViewUtils from '../../utils/tree-view-utils';
import * as SnapshotUtils from '../../utils/snapshot-utils';
import * as CurrentPageUtils from '../../utils/current-page-utils';
import * as WidgetsUtils from '../../utils/widgets-utils';
import * as QueryAPI from '../../utils/query-api-utils';
import * as Mappings from '../../../models/mappers/mappings';
import WidgetList from '../../../modules/widget_list';
import QueryParser from '../../../generated/ggrc_filter_query_parser';

describe('GGRC Utils Widgets', function () {
  describe('getWidgetList() method', function () {
    let method;

    beforeEach(function () {
      spyOn(WidgetList, 'get_widget_list_for')
        .and.returnValue({
          control: {},
          Assessment: {},
          objective: {},
        });
      method = WidgetsUtils.getWidgetList;
    });

    it('returns an empty object when model is not provided', function () {
      let result = method('', 'assessments_view');

      expect(result.assessment).toBeUndefined();
    });

    it('returns assessments widget for assessment view', function () {
      let result = method('assessment', '/assessments_view');
      let keys = Object.keys(result);

      expect(keys.length).toEqual(1);
      expect(keys).toContain('assessment');
    });

    it('returns widgets for non-assessment view', function () {
      let result = method('assessment', '/controls_view');
      let keys = Object.keys(result);

      expect(keys.length).toEqual(3);
    });
  });

  describe('getDefaultWidgets() method', function () {
    let method;

    beforeEach(function () {
      method = WidgetsUtils.getDefaultWidgets;
    });

    it('should return "Info" widget for non-object browser path', function () {
      let result = method({
        control: {},
        assessment: {},
        objective: {},
        info: {},
      }, '/assessments_view');

      expect(result).toContain('info');
    });

    it('should return "Info" widget for non-object browser path', function () {
      let result = method({
        control: {},
        assessment: {},
        objective: {},
        info: {},
      }, '/objectBrowser/');

      expect(result).not.toContain('info');
    });
  });

  describe('getWidgetModels() method', function () {
    let method;

    beforeEach(function () {
      spyOn(WidgetList, 'get_widget_list_for')
        .and.returnValue({
          Control: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Control',
              },
            },
          },
          Assessment: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Assessment',
              },
            },
          },
          Objective: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Objective',
              },
            },
          },
          Info: {
            content_controller_options: {
              model: {
                model_singular: 'Info',
              },
            },
          },
        });
      method = WidgetsUtils.getWidgetModels;
    });

    it('returns an empty array when model is not provided', function () {
      let result = method('', 'assessments_view');

      expect(result.length).toEqual(0);
    });

    it('returns assessment model name only for assessment view', function () {
      let result = method('assessment', '/assessments_view');

      expect(result).toContain('assessment');
    });

    it('returns appropriate models for non-assessment view',
      function () {
        let result = method('assessment', '/controls_view');

        expect(result).toContain('Assessment');
        expect(result).toContain('Control');
        expect(result).toContain('Objective');
        expect(result.length).toEqual(3);
      });

    it('returns non-info models for object browser view',
      function () {
        let result = method('assessment', '/objectBrowser/');

        expect(result).toContain('Assessment');
        expect(result).toContain('Control');
        expect(result).toContain('Objective');
        expect(result).not.toContain('Info');
      });
  });

  describe('initCounts() method', function () {
    let method;
    let queryDfd;
    let getCounts;
    let snapshotCountsDfd;
    let id = 1;

    beforeEach(function () {
      queryDfd = $.Deferred();
      snapshotCountsDfd = $.Deferred();
      method = WidgetsUtils.initCounts;
      getCounts = WidgetsUtils.getCounts;

      spyOn(TreeViewUtils, 'makeRelevantExpression')
        .and.returnValue({
          type: 'Assessment',
          id: id,
          operation: 'owned',
        });
      spyOn(SnapshotUtils, 'isSnapshotRelated')
        .and.callFake(function (type, widgetType) {
          return widgetType === 'Control';
        });
      spyOn(QueryAPI, 'buildParam')
        .and.callFake(function (objName) {
          return {
            objectName: objName,
          };
        });

      spyOn(QueryParser, 'parse')
        .and.returnValue({});

      spyOn(QueryAPI, 'batchRequests');

      spyOn($.when, 'apply')
        .and.returnValue(queryDfd);

      spyOn(SnapshotUtils, 'getSnapshotsCounts')
        .and.returnValue(snapshotCountsDfd);
    });

    it('should not make request when no widget was provided', function () {
      method([], 'Control', 1);

      expect(QueryAPI.batchRequests).not.toHaveBeenCalled();
    });

    it('should init counts for snapshotable objects', async function (done) {
      let result;

      queryDfd.resolve();
      snapshotCountsDfd.resolve({
        Control: 11,
      });

      await method(['Control'], 'Assessment', 1);

      result = getCounts();
      expect(result.Control).toEqual(11);
      done();
    });

    it('should init counts for non-snapshotable objects',
      async function (done) {
        let result;

        queryDfd.resolve({
          Assessment: {
            total: 10,
          },
        });
        snapshotCountsDfd.resolve({});

        await method(['Assessment'], 'Control', 1);

        expect(QueryAPI.batchRequests)
          .toHaveBeenCalledWith({
            type: 'count',
            objectName: 'Assessment',
          }
          );

        result = getCounts();

        expect(result.Assessment).toEqual(10);

        done();
      });

    it('should init counts for virtual objects', async function (done) {
      let result;

      queryDfd.resolve({
        Cycle: {
          total: 10,
        },
      });
      snapshotCountsDfd.resolve({});

      await method([{
        name: 'Cycle',
        countsName: 'ActiveCycle',
      }], 'Control', 1);

      expect(QueryAPI.batchRequests)
        .toHaveBeenCalledWith({
          type: 'count',
          objectName: 'Cycle',
        });

      result = getCounts();

      expect(result.ActiveCycle).toEqual(10);

      done();
    });
  });

  describe('initMappedInstances() method', function () {
    let requestDfds = [];
    let method;

    beforeEach(function () {
      let requestDfd;

      spyOn(QueryAPI, 'buildRelevantIdsQuery')
        .and.callFake(function (objName, page, relevant, additionalFilter) {
          return {
            model: objName,
            operation: 'relevant',
          };
        });

      spyOn(SnapshotUtils, 'isSnapshotRelated')
        .and.callFake(function (parent, child) {
          return child === 'Control';
        });

      spyOn(SnapshotUtils, 'transformQuery')
        .and.callFake(function (query) {
          return query;
        });

      spyOn(QueryAPI, 'batchRequests')
        .and.callFake(function () {
          requestDfd = $.Deferred();
          requestDfds.push(requestDfd);
          return requestDfd;
        });
      method = CurrentPageUtils.initMappedInstances;
    });

    it('should init mappings for snapshotable objects',
      function (done) {
        let snapshotIds = [1, 2, 3];

        function validateResult(result) {
          snapshotIds.forEach(function (id) {
            expect(result.Control[id]).toBeTruthy();
          });
          done();
        }

        spyOn(Mappings, 'getMappingList')
          .and.returnValue(['Control']);

        method().then(validateResult);
        requestDfds.forEach(function (dfd) {
          dfd.resolve({
            Snapshot: {
              ids: snapshotIds,
            },
          });
        });
      });

    it('should init mappings for non-snapshotable objects',
      function (done) {
        let nonSnapshotIds = [4, 5, 6];

        function validateResult(result) {
          nonSnapshotIds.forEach(function (id) {
            expect(result.Assessment[id]).toBeTruthy();
          });

          done();
        }

        spyOn(Mappings, 'getMappingList')
          .and.returnValue(['Assessment']);

        method().then(validateResult);
        requestDfds.forEach(function (dfd) {
          dfd.resolve({
            Assessment: {
              ids: nonSnapshotIds,
            },
          });
        });
      });
  });

  describe('refreshCounts() method', function () {
    let widgets;
    let refreshCounts;
    let countsMap;
    let snapshotCountsDfd;

    beforeEach(function () {
      refreshCounts = WidgetsUtils.refreshCounts;
      countsMap = WidgetsUtils.getCounts();
      snapshotCountsDfd = $.Deferred();

      widgets =
        {
          Program: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Program',
              },
            },
          },
          Assessment: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Assessment',
              },
            },
          },
          Audit: {
            widgetType: 'treeview',
            content_controller_options: {
              model: {
                model_singular: 'Audit',
              },
            },
          },
        };

      spyOn(WidgetList, 'get_widget_list_for')
        .and.returnValue(widgets);

      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValues(
          $.Deferred().resolve(
            [
              {Program: {count: 0, total: 0}, selfLink: null},
              {Assessment: {count: 0, total: 0}, selfLink: null},
              {Audit: {count: 3, total: 4}, selfLink: null},
            ]));

      spyOn(SnapshotUtils, 'getSnapshotsCounts')
        .and.returnValue(snapshotCountsDfd);
    });

    it('should reinit counts', function (done) {
      snapshotCountsDfd.resolve({});

      refreshCounts()
        .then(function (counts) {
          let reqParams;
          let reqParamNames;
          let ggrcAjax = AjaxExtensions.ggrcAjax;

          expect(ggrcAjax.calls.count()).toEqual(1);
          reqParams = JSON.parse(ggrcAjax.calls.argsFor(0)[0].data);
          reqParamNames = loMap(reqParams,
            function (param) {
              return param.object_name;
            });
          expect(reqParams.length).toEqual(3);
          expect(reqParamNames).toContain('Program');
          expect(reqParamNames).toContain('Assessment');
          expect(reqParamNames).toContain('Audit');
          expect(countsMap.attr('Audit')).toEqual(4);
          expect(countsMap.attr('Program')).toEqual(0);
          done();
        });
    });
  });

  describe('getWidgetConfigs() method', function () {
    it('should return object configs', function () {
      const result = WidgetsUtils.getWidgetConfigs(
        [{name: 'Program'}, {name: 'Assesment'}]);
      expect(result).toEqual([{
        name: 'Program',
        widgetName: 'Program',
        widgetId: 'Program',
      }, {
        name: 'Assesment',
        widgetName: 'Assesment',
        widgetId: 'Assesment',
      }]);
    });
  });

  describe('getWidgetConfig() method', function () {
    it('should return object config if model name is Object', function () {
      const result = WidgetsUtils.getWidgetConfig({name: 'Program'});
      expect(result).toEqual({
        name: 'Program',
        widgetName: 'Program',
        widgetId: 'Program',
      });
    });

    it('should return object config if model name is cashed', function () {
      WidgetsUtils.getWidgetConfig('Program_version');
      const result = WidgetsUtils.getWidgetConfig('Program_version');
      expect(result).toEqual({
        name: 'Program',
        widgetId: 'Program_version',
        widgetName: 'Programs Versions',
        countsName: 'Program_version',
        isObjectVersion: true,
        relation: undefined,
        isMegaObject: undefined,
      });
    });

    it('should return object config if model name contains "_version"',
      function () {
        const result = WidgetsUtils.getWidgetConfig('Program_version');
        expect(result).toEqual({
          name: 'Program',
          widgetId: 'Program_version',
          widgetName: 'Programs Versions',
          countsName: 'Program_version',
          isObjectVersion: true,
          relation: undefined,
          isMegaObject: undefined,
        });
      }
    );

    it('should return object config if model name is mega object', function () {
      const result = WidgetsUtils.getWidgetConfig('Program_parent');
      expect(result).toEqual({
        name: 'Program',
        widgetId: 'Program_parent',
        widgetName: 'Parent Programs',
        countsName: 'Program_parent',
        isObjectVersion: undefined,
        relation: 'parent',
        isMegaObject: true,
      });
    });
  });
});
