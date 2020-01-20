/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Comment from '../comment';

describe('Comment model', function () {
  describe('display_name() method', function () {
    let fakeComment;
    let method;

    beforeEach(function () {
      fakeComment = new canMap({});
      method = Comment.prototype.display_name.bind(fakeComment);
    });

    it('returns an empty string if comment does not have a description set',
      function () {
        let result;
        fakeComment.attr('description', undefined);
        result = method();
        expect(result).toEqual('');
      }
    );

    it('returns comment\'s description if the latter exists', function () {
      let result;
      fakeComment.attr('description', 'The comment content.');
      result = method();
      expect(result).toEqual('The comment content.');
    });
  });
});
