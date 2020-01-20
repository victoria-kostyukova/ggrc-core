/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {_processSaveResponses} from '../save-queue';

describe('SaveQueue module', function () {
  'use strict';

  describe('_processSaveResponses() method', function () {
    let bucket;
    let method; // the method under test

    beforeEach(function () {
      let thisContext = {};

      method = _processSaveResponses.bind(thisContext);

      bucket = {
        objs: [],
        type: 'audit',
        plural: 'audits',
        background: false,
        save_responses: [],
        in_flight: false,
      };
    });

    // a helper function for generating fake response objects as stored in
    // buckets' save_responses list
    function makeResponse(objType, objId) {
      let modelInstance = {
        type: objType,
        id: objId,
        _save: jasmine.createSpy('_save'),
        _dfd: new $.Deferred(),
      };

      let response = [
        [modelInstance],
        [
          [201, {audit: modelInstance}],
        ],
      ];

      return response;
    }

    it('clears the given bucket\'s response list', function () {
      let resp = makeResponse('Audit', 1);
      let resp2 = makeResponse('Audit', 2);
      bucket.save_responses = [resp, resp2];

      method(bucket);

      expect(bucket.save_responses).toEqual([]);
    });
  });
});
