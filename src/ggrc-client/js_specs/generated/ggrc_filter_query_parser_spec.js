/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import QueryParser from '../../js/generated/ggrc_filter_query_parser';

describe('QueryParser', function () {
  'use strict';

  let parserStructure = {
    parse: jasmine.any(Function),
    joinQueries: jasmine.any(Function),
    generated: {
      parse: jasmine.any(Function),
      SyntaxError: jasmine.any(Function),
    },
  };

  it('should exist', function () {
    expect(QueryParser).toEqual(parserStructure);
  });

  describe('parse', function () {
    it('parses an empty query', function () {
      let emptyResult = {
        expression: {},
      };

      expect(QueryParser.parse('')).toEqual(emptyResult);
      expect(QueryParser.parse(' ')).toEqual(emptyResult);
      expect(QueryParser.parse(' \t ')).toEqual(emptyResult);
      expect(QueryParser.parse('\t')).toEqual(emptyResult);
      expect(QueryParser.parse('    \t')).toEqual(emptyResult);
    });

    it('parses exclude text search queries', function () {
      let textSearchQueries = [
        '!~a',
        '!~word',
        '!~ --this --is',
        '!~ order by something',
        '!~ order by s,thing',
        '!~ order by s,thin  "elese" g',
        '!~7531902 468',
      ];

      textSearchQueries.forEach(function (queryStr) {
        let text = queryStr.replace('!~', '').trim();
        expect(QueryParser.parse(queryStr)).toEqual({
          expression: {
            text: text,
            op: {name: 'exclude_text_search'},
          },
        });
      });
    });

    it('parses text search queries', function () {
      let textSearchQueries = [
        'a',
        'word',
        ' --this --is',
        ' order by s,thin  "elese" g',
        '~a',
        '~word',
        '~ --this --is',
        '~ order by something',
        '~ order by s,thing',
        '~ order by s,thin  "elese" g',
        '~7531902 468',
      ];

      textSearchQueries.forEach(function (queryStr) {
        let text = queryStr.replace('~', '').trim();
        expect(QueryParser.parse(queryStr)).toEqual({
          expression: {
            text: text,
            op: {name: 'text_search'},
          },
        });
      });
    });

    it('parses simple queries', () => {
      const operators = [
        '=',
        '!=',
        '<',
        '<=',
        '>',
        '>=',
        '~',
        '!~',
      ];

      operators.forEach((op) => {
        let simpleQueries = [
          `a${op}b`,
          ` with ${op} spaces`,
          `but${op} not_all_spaces  `,
          `"last updated"${op} 01/03/2018  `,
          `"last updated"${op} "with spaces"  `,
        ];

        simpleQueries.forEach(function (queryStr) {
          let query = queryStr.split(op);
          expect(QueryParser.parse(queryStr)).toEqual({
            expression: {
              left: query[0].trim().replace(/"/g, ''),
              op: {name: op},
              right: query[1].trim().replace(/"/g, ''),
            },
          });
        });
      });
    });

    it('parses \'is\' queries', function () {
      expect(QueryParser.parse('5words is empty')).toEqual({
        expression: {
          left: '5words',
          op: {name: 'is'},
          right: 'empty',
        },
      });
    });

    it('parses \'or\' queries', () => {
      let queries = [
        ' (n = 22 or n = 5)',
        'n = 22 OR n = 5  ',
        'n = 22 || n = 5 ',
        'n = 22||n = 5 ',
        'n = "22"||"n" = 5 ',
        'n = "22"    or ("n" = 5) ',
      ];

      queries.forEach((query) => {
        expect(QueryParser.parse(query))
          .toEqual({
            expression: {
              left: {left: 'n', op: {name: '='}, right: '22'},
              op: {name: 'OR'},
              right: {left: 'n', op: {name: '='}, right: '5'},
            },
          });
      });
    });

    it('parses \'and\' queries', () => {
      let queries = [
        ' (n = 22 and n = 5)',
        'n = 22 AND n = 5  ',
        'n = 22 && n = 5 ',
        'n = 22&&n = 5 ',
        'n = "22"&&"n" = 5 ',
        'n = "22"    and ("n" = 5) ',
      ];

      queries.forEach((query) => {
        expect(QueryParser.parse(query))
          .toEqual({
            expression: {
              left: {left: 'n', op: {name: '='}, right: '22'},
              op: {name: 'AND'},
              right: {left: 'n', op: {name: '='}, right: '5'},
            },
          });
      });
    });

    it('parses relevant queries', function () {
      expect(QueryParser.parse('#SomeClass,1,2,3,4#'))
        .toEqual({
          expression: {
            object_name: 'SomeClass',
            op: {name: 'relevant'},
            ids: ['1', '2', '3', '4'],
          },
        });

      expect(QueryParser.parse('#SomeClass,1,2,3,4# or #A,1# and #B,2#'))
        .toEqual({
          expression: {
            left: {
              object_name: 'SomeClass',
              op: {name: 'relevant'},
              ids: ['1', '2', '3', '4'],
            },
            op: {name: 'OR'},
            right: {
              left: {
                object_name: 'A',
                op: {name: 'relevant'},
                ids: ['1'],
              },
              op: {name: 'AND'},
              right: {
                object_name: 'B',
                op: {name: 'relevant'},
                ids: ['2'],
              },
            },
          },
        });

      expect(QueryParser.parse('#SomeClass,1,2,3,4# or #A,1#'))
        .toEqual({
          expression: {
            left: {
              object_name: 'SomeClass',
              op: {name: 'relevant'},
              ids: ['1', '2', '3', '4'],
            },
            op: {name: 'OR'},
            right: {
              object_name: 'A',
              op: {name: 'relevant'},
              ids: ['1'],
            },
          },
        });
    });

    it('parses complex queries', () => {
      expect(QueryParser
        .parse('(n = 22 and n = 5) and ("bacon ipsum" !~ bacon)'))
        .toEqual({
          expression: {
            left: {
              left: {left: 'n', op: {name: '='}, right: '22'},
              op: {name: 'AND'},
              right: {left: 'n', op: {name: '='}, right: '5'},
            },
            op: {name: 'AND'},
            right: {left: 'bacon ipsum', op: {name: '!~'}, right: 'bacon'},
          },
        });

      expect(QueryParser
        .parse('(n = 22 or n = 5) and ("bacon ipsum" !~ bacon)'))
        .toEqual({
          expression: {
            left: {
              left: {left: 'n', op: {name: '='}, right: '22'},
              op: {name: 'OR'},
              right: {left: 'n', op: {name: '='}, right: '5'},
            },
            op: {name: 'AND'},
            right: {left: 'bacon ipsum', op: {name: '!~'}, right: 'bacon'},
          },
        });

      expect(QueryParser
        .parse('n = 22 or n = 5 and "bacon ipsum" ~ bacon'))
        .toEqual({
          expression: {
            left: {left: 'n', op: {name: '='}, right: '22'},
            op: {name: 'OR'},
            right: {
              left: {left: 'n', op: {name: '='}, right: '5'},
              op: {name: 'AND'},
              right: {left: 'bacon ipsum', op: {name: '~'}, right: 'bacon'},
            },
          },
        });

      expect(QueryParser
        .parse('("bacon ipsum" ~ bacon) and ("bacon ipsum" !~ bacon)'))
        .toEqual({
          expression: {
            left: {left: 'bacon ipsum', op: {name: '~'}, right: 'bacon'},
            op: {name: 'AND'},
            right: {left: 'bacon ipsum', op: {name: '!~'}, right: 'bacon'},
          },
        });

      expect(QueryParser
        .parse('hello=worldoo or ~ bacon ipsum'))
        .toEqual({
          expression: {
            left: {left: 'hello', op: {name: '='}, right: 'worldoo'},
            op: {name: 'OR'},
            right: {text: 'bacon ipsum', op: {name: 'text_search'}},
          },
        });
    });

    it('parses IN queries', () => {
      let queries = [
        'title IN(title1,title2)',
        'title IN (title1, title2)',
        'title IN("title1","title2")',
        'title IN ("title1", "title2")',
        'title in (title1,title2)',
        'title in(title1, title2)',
        'title in ("title1","title2")',
        'title in("title1",    "title2")',
      ];

      queries.forEach((query) => {
        let result = QueryParser.parse(query);

        expect(result).toEqual({
          expression: {
            left: 'title',
            op: {name: 'IN'},
            right: ['title1', 'title2'],
          },
        });
      });
    });

    it('parses not_empty_revisions_for queries', () => {
      let query = 'Control not_empty_revisions_for 1';

      let result = QueryParser.parse(query);

      expect(result).toEqual({
        expression: {
          op: {name: 'not_empty_revisions'},
          resource_type: 'Control',
          resource_id: '1',
        },
      });
    });

    it('correctly handles escaped symbols inside quotes', function () {
      let queries = [
        'title ~ "test\\\\"',
        'title ~ "test\\%"',
        'title ~ "test\\_"',
        'title ~ "test\\""',
      ];

      loForEach(queries, function (query) {
        let value = query.split('~')[1].trim().replace(/^"|"$/g, '');
        let result = QueryParser.parse(query);

        expect(result.expression.right).toEqual(value);
      });
    });

    it('correctly handles escaped symbols outside quotes', function () {
      let queries = [
        'title ~ test\\\\',
        'title ~ test\\%',
        'title ~ test\\_',
        'title ~ test\\"',
      ];

      loForEach(queries, function (query) {
        let value = query.split('~')[1].trim();
        let result = QueryParser.parse(query);

        expect(result.expression.right).toEqual(value);
      });
    });

    it('does not change escaped symbols in case of text search', function () {
      let query = 'some \\\\ test \\% \\_ query';

      let result = QueryParser.parse(query);

      expect(result.expression.op.name).toBe('text_search');
      expect(result.expression.text).toBe(query);
    });

    it('correctly handles escaped symbol inside attribute name', function () {
      let query = '"my \\" quote" ~ aaa';
      let result = QueryParser.parse(query);

      expect(result.expression.left).toEqual('my \\" quote');
    });
  });

  describe('joinQueries', function () {
    it('joins two queries with AND by default', function () {
      let sameQueries = [
        ['a=b and c=d', 'a=b', 'c=d'],
        ['(a=b) and (c=d)', 'a=b', 'c=d'],
        ['(a=b or c=A) and (c=d)', 'a=b or c=A', 'c=d'],
        ['(a=b or c=A) and (c=d)', '(a=b or c=A) and (c=d)', ''],
        ['(a=b or c=A) and (c=d)', '', '(a=b or c=A) and (c=d)'],
        ['hello=worldoo and ~ bacon ipsum',
          'hello=worldoo',
          '~ bacon ipsum'],
      ];

      sameQueries.forEach(function (queries) {
        expect(
          JSON.stringify(QueryParser.parse(queries[0]))
        ).toEqual(
          JSON.stringify(
            QueryParser.joinQueries(
              QueryParser.parse(queries[1]),
              QueryParser.parse(queries[2])
            )
          )
        );
      });
    });

    it('joins two queries with OR', function () {
      let sameQueries = [
        ['a=b or c=d', 'a=b', 'c=d'],
        ['(a=b) or (c=d)', 'a=b', 'c=d'],
        ['(a=b and c=A) or (c=d)', 'a=b and c=A', 'c=d'],
        ['(hello=worldoo or n=22 ) or ~ bacon ipsum',
          '(hello=worldoo or n=22 )',
          '  ~ bacon ipsum'],
      ];

      sameQueries.forEach(function (queries) {
        expect(
          JSON.stringify(QueryParser.parse(queries[0]))
        ).toEqual(
          JSON.stringify(
            QueryParser.joinQueries(
              QueryParser.parse(queries[1]),
              QueryParser.parse(queries[2]),
              'OR'
            )
          )
        );
      });
    });
  });
});
