/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../comment-input';

describe('comment-input component', function () {
  'use strict';

  let testingText = 'Lorem ipsum ' +
    'dolor sit amet, consectetur adipiscing elit.' +
    ' Mauris accumsan porta nisl ut lobortis.' +
    ' Proin sollicitudin enim ante,' +
    ' sit amet elementum ipsum fringilla sed';

  describe('.setValues() method', function () {
    let scope;

    beforeEach(function () {
      scope = getComponentVM(Component);
    });

    it('should update: value and isEmpty. length is > 0 ', function () {
      scope.attr('value', testingText);

      expect(scope.attr('value')).toBe(testingText);
      expect(scope.attr('isEmpty')).toBe(false);
    });
    it('should update: value and isEmpty. length is equal 0 ', function () {
      scope.attr('value', null);

      expect(scope.attr('value')).toBe('');
      expect(scope.attr('isEmpty')).toBe(true);
    });
    it('should update multiple times: value and isEmpty.', function () {
      scope.attr('value', null);

      expect(scope.attr('value')).toBe('');
      expect(scope.attr('isEmpty')).toBe(true);

      scope.attr('value', testingText);

      expect(scope.attr('value')).toBe(testingText);
      expect(scope.attr('isEmpty')).toBe(false);

      scope.attr('value', null);

      expect(scope.attr('value')).toBe('');
      expect(scope.attr('isEmpty')).toBe(true);
    });
  });
});
