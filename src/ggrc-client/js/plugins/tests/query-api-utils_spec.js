/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as AjaxExtensions from '../../plugins/ajax-extensions';
import canMap from 'can-map';
import * as QueryAPI from '../utils/query-api-utils';

describe('QueryAPI utils', function () {
  describe('batchRequests() method', function () {
    let batchRequests = QueryAPI.batchRequests;
    let ggrcAjax;

    beforeEach(function () {
      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValues(
          $.Deferred().resolve([1, 2, 3, 4]), $.Deferred().resolve([1]));

      ggrcAjax = AjaxExtensions.ggrcAjax;
    });

    afterEach(function () {
      ggrcAjax.calls.reset();
    });

    it('does only one ajax call for a group of consecutive calls',
      function (done) {
        $.when(batchRequests(1),
          batchRequests(2),
          batchRequests(3),
          batchRequests(4)).then(function () {
          expect(ggrcAjax.calls.count()).toEqual(1);
          done();
        });
      });

    it('does several ajax calls for delays calls', function (done) {
      batchRequests(1);
      batchRequests(2);
      batchRequests(3);
      batchRequests(4);

      // Make a request with a delay
      setTimeout(function () {
        batchRequests(4).then(function () {
          expect(ggrcAjax.calls.count()).toEqual(2);
          done();
        });
      }, 150);
    });
  });

  describe('buildParam(objName, page, relevant, fields, filters) method',
    () => {
      let page;

      describe('when page.current and page.pageSize are defined', () => {
        beforeEach(() => {
          page = {
            current: 7,
            pageSize: 10,
          };
        });

        it('returns correct limit when buffer is not defined', () => {
          let result = QueryAPI.buildParam('SomeName', page);

          expect(result).toEqual(jasmine.objectContaining({
            limit: [60, 70],
          }));
        });

        it('adds buffer to right limit if buffer defined', () => {
          page.buffer = 1;

          let result = QueryAPI.buildParam('SomeName', page);

          expect(result).toEqual(jasmine.objectContaining({
            limit: [60, 71],
          }));
        });
      });
    });

  describe('buildCountParams() method', function () {
    let relevant = {
      type: 'Audit',
      id: '555',
      operation: 'relevant',
    };

    it('empty arguments. buildCountParams should return empty array',
      function () {
        let queries = QueryAPI.buildCountParams();
        expect(Array.isArray(queries)).toBe(true);
        expect(queries.length).toEqual(0);
      }
    );

    it('No relevant. buildCountParams should return array of queries',
      function () {
        let types = ['Assessment', 'Control'];

        let queries = QueryAPI.buildCountParams(types);
        let query = queries[0];

        expect(queries.length).toEqual(types.length);
        expect(query.object_name).toEqual(types[0]);
        expect(query.type).toEqual('count');
        expect(query.filters).toBe(undefined);
      }
    );

    it('Pass relevant. buildCountParams should return array of queries',
      function () {
        let types = ['Assessment', 'Control'];

        let queries = QueryAPI.buildCountParams(types, relevant);
        let query = queries[0];
        let expression = query.filters.expression;

        expect(queries.length).toEqual(types.length);
        expect(query.object_name).toEqual(types[0]);
        expect(query.type).toEqual('count');
        expect(expression.object_name).toEqual(relevant.type);
        expect(expression.ids[0]).toEqual(relevant.id);
        expect(expression.op.name).toEqual('relevant');
      }
    );
  });

  describe('loadObjectsByStubs() method', () => {
    const BATCH_TIMEOUT = 100;
    let ggrcAjax;

    beforeEach(() => {
      spyOn(AjaxExtensions, 'ggrcAjax').and.returnValue($.Deferred());
      ggrcAjax = AjaxExtensions.ggrcAjax;
    });

    it('makes request with based on passed object stubs and fields ' +
    'configuration', () => {
      jasmine.clock().install();

      const stubs = [
        new canMap({id: 123, type: 'Type1'}),
        new canMap({id: 223, type: 'Type1'}),
        new canMap({id: 323, type: 'Type1'}),
        new canMap({id: 423, type: 'Type2'}),
        new canMap({id: 523, type: 'Type2'}),
      ];
      const fields = ['id', 'type', 'title'];
      const expectedQuery = [
        {
          object_name: 'Type1',
          filters: {
            expression: {
              left: 'id',
              op: {name: 'IN'},
              right: [123, 223, 323],
            },
          },
          fields,
        },
        {
          object_name: 'Type2',
          filters: {
            expression: {
              left: 'id',
              op: {name: 'IN'},
              right: [423, 523],
            },
          },
          fields,
        },
      ];

      QueryAPI.loadObjectsByStubs(stubs, fields);

      jasmine.clock().tick(BATCH_TIMEOUT + 1);

      expect(ggrcAjax).toHaveBeenCalledWith(jasmine.objectContaining({
        data: JSON.stringify(expectedQuery),
      }));

      jasmine.clock().uninstall();
    });

    it('returns flatten result of query', (done) => {
      const stubs = [
        new canMap({id: 123, type: 'Type1'}),
        new canMap({id: 223, type: 'Type1'}),
        new canMap({id: 323, type: 'Type1'}),
        new canMap({id: 423, type: 'Type2'}),
        new canMap({id: 523, type: 'Type2'}),
      ];
      const fields = ['id', 'type', 'title'];
      const generateObject = (type, fields, id) => ({
        ...fields.reduce((res, field) => ({
          ...res,
          [field]: `test ${field}`,
        }), {}),
        type,
        id,
      });

      const expectedResult = stubs.map((stub) =>
        generateObject(stub.attr('type'), fields, stub.attr('id')));

      const generateQueryApiResponse = ({
        object_name: type,
        filters: {expression: expr},
        fields,
      }) => ({
        [type]: {
          values: expr.right.map((id) => generateObject(type, fields, id)),
        },
      });

      ggrcAjax.and.callFake(({data}) => Promise.resolve(
        JSON.parse(data).map(generateQueryApiResponse),
      ));

      QueryAPI.loadObjectsByStubs(stubs, fields).then((res) => {
        expect(res).toEqual(expectedResult);
        done();
      });
    });
  });

  describe('loadObjectsByTypes() method', () => {
    const BATCH_TIMEOUT = 100;
    let ggrcAjax;

    beforeEach(() => {
      spyOn(AjaxExtensions, 'ggrcAjax').and.returnValue($.Deferred());
      ggrcAjax = AjaxExtensions.ggrcAjax;
    });

    it('makes request with based on passed object types and fields ' +
    'configuration', () => {
      jasmine.clock().install();

      const object = {id: 12345, type: 'FakeType'};
      const types = ['Type1', 'Type2', 'Type3'];
      const fields = ['id', 'type', 'title'];
      const expectedQuery = types.map((type) => ({
        object_name: type,
        filters: {
          expression: {
            object_name: object.type,
            op: {name: 'relevant'},
            ids: [String(object.id)],
          },
        },
        fields,
      }));

      QueryAPI.loadObjectsByTypes(object, types, fields);

      jasmine.clock().tick(BATCH_TIMEOUT + 1);

      expect(ggrcAjax).toHaveBeenCalledWith(jasmine.objectContaining({
        data: JSON.stringify(expectedQuery),
      }));

      jasmine.clock().uninstall();
    });

    it('returns flatten result of query', (done) => {
      const object = new canMap({id: 12345, type: 'FakeType'});
      const types = ['Type1', 'Type2', 'Type3'];
      const fields = ['id', 'type', 'title'];
      const generateObject = (type, fields) => fields.reduce((res, prop) => ({
        ...res,
        [prop]: `test ${prop}`,
        type,
      }), {});

      const expectedResult = types.map((type) => generateObject(type, fields));

      const generateQueryApiResponse = ({
        object_name: type,
        fields,
      }) => ({
        [type]: {
          values: [generateObject(type, fields)],
        },
      });

      ggrcAjax.and.callFake(({data}) => Promise.resolve(
        JSON.parse(data).map(generateQueryApiResponse),
      ));

      QueryAPI.loadObjectsByTypes(object, types, fields).then((res) => {
        expect(res).toEqual(expectedResult);
        done();
      });
    });
  });
});
