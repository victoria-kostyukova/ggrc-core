/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as AjaxExtensions from '../../ajax-extensions';
import service, {getAsmtCountForVerify} from '../../utils/bulk-update-service';
import * as QueryApiUtils from '../../utils/query-api-utils';

describe('GGRC BulkUpdateService', function () {
  describe('update() method', function () {
    let method;
    let ajaxRes;

    beforeEach(function () {
      method = service.update;
      ajaxRes = {
      };
      ajaxRes.done = jasmine.createSpy().and.returnValue(ajaxRes);
      ajaxRes.fail = jasmine.createSpy().and.returnValue(ajaxRes);

      spyOn(AjaxExtensions, 'ggrcAjax')
        .and.returnValue(ajaxRes);
    });

    it('makes ajax call with transformed data', function () {
      let model = {
        table_plural: 'some_model',
      };
      let data = [{
        id: 1,
      }];

      method(model, data, {state: 'In Progress'});

      expect(AjaxExtensions.ggrcAjax)
        .toHaveBeenCalledWith({
          url: '/api/some_model',
          method: 'PATCH',
          contentType: 'application/json',
          data: '[{"id":1,"state":"In Progress"}]',
        });
    });
  });

  describe('getAsmtCountForVerify() method', () => {
    let dfd;
    let filters;

    beforeEach(() => {
      dfd = $.Deferred();
      filters = {
        expression: {
          left: {
            object_name: 'Person',
            op: {
              name: 'relevant',
            },
            ids: [
              GGRC.current_user.id,
            ],
          },
          op: {
            name: 'AND',
          },
          right: {
            left: {
              left: 'status',
              op: {
                name: '=',
              },
              right: 'In Review',
            },
            op: {
              name: 'AND',
            },
            right: {
              left: {
                left: 'archived',
                op: {
                  name: '=',
                },
                right: 'false',
              },
              op: {
                name: 'AND',
              },
              right: {
                left: 'verifiers',
                op: {
                  name: '~',
                },
                right: GGRC.current_user.email,
              },
            },
          },
        },
      };
    });

    it('returns deferred object with assessments count', (done) => {
      spyOn(QueryApiUtils, 'buildParam').withArgs(
        'Assessment',
        {},
        null,
        [],
        filters)
        .and.returnValue({});
      spyOn(QueryApiUtils, 'batchRequests').withArgs({type: 'count'})
        .and.returnValue(dfd);

      dfd.resolve({
        Assessment: {
          count: 3,
        },
      });

      getAsmtCountForVerify().then((count) => {
        expect(count).toEqual(3);
        done();
      });
    });
  });
});
