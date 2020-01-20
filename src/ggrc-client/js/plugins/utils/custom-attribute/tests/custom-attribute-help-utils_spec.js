/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {hasEmptyValue} from '../custom-attribute-help-utils';
import CustomAttributeObject from '../custom-attribute-object';

describe('hasEmptyValue() function', () => {
  let caObject;

  beforeEach(function () {
    caObject = new CustomAttributeObject(
      new canMap(),
      new canMap(),
      new canMap()
    );
  });

  describe('when type of custom attribute value is string', () => {
    it('returns true ca value is empty', function () {
      let result;
      caObject.value = '';
      result = hasEmptyValue(caObject);
      expect(result).toBe(true);
    });

    it('returns true if ca value contains only whitespace characters',
      function () {
        let result;
        caObject.value = '\t  \n  \t';
        result = hasEmptyValue(caObject);
        expect(result).toBe(true);
      });

    it('returns false if ca value is not empty', function () {
      let result;
      caObject.value = 'Some text...';
      result = hasEmptyValue(caObject);
      expect(result).toBe(false);
    });
  });

  it('returns true if value is falsy', function () {
    let result;
    caObject.value = null;
    result = hasEmptyValue(caObject);
    expect(result).toBe(true);
  });

  it('returns false if value is truthy', function () {
    let result;
    caObject.value = 12345;
    result = hasEmptyValue(caObject);
    expect(result).toBe(false);
  });
});
