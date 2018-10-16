/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

'use strict';

import {isEmptyCustomAttribute as isEmptyCA} from '../utils/ca-utils';
import {
  ddValidationMapToValue,
  isCommentRequired,
  isEvidenceRequired,
  isUrlRequired,
  setCustomAttributeValue,
} from '../utils/ca-utils';

describe('ca-utils', function () {
  describe('isEmptyCustomAttribute() method', function () {
    describe('check undefined value', function () {
      it('returns true for undefined', function () {
        let result = isEmptyCA(undefined);
        expect(result).toBe(true);
      });
    });

    describe('check Rich Text value', function () {
      it('returns true for empty div', function () {
        let result = isEmptyCA('<div></div>', 'Rich Text');
        expect(result).toBe(true);
      });

      it('returns true for div with a line break', function () {
        let result = isEmptyCA('<div><br></div>', 'Rich Text');
        expect(result).toBe(true);
      });

      it('returns true for div with a empty list', function () {
        let result = isEmptyCA('<div><ul><li></li></ul></div>', 'Rich Text');
        expect(result).toBe(true);
      });

      it('returns true for div with a empty paragraph', function () {
        let result = isEmptyCA('<div><p></p></div>', 'Rich Text');
        expect(result).toBe(true);
      });

      it('returns false for div with the text', function () {
        let result = isEmptyCA('<div>Very important text!</div>', 'Rich Text');
        expect(result).toBe(false);
      });

      it('returns false for not empty list', function () {
        let result = isEmptyCA('<div><ul><li>One</li><li>Two</li></ul></div>',
          'Rich Text');
        expect(result).toBe(false);
      });
    });

    describe('check Checkbox value', function () {
      it('returns false for unchecked', function () {
        let result = isEmptyCA('0', 'Checkbox');
        expect(result).toBe(true);
      });

      it('returns true for checked', function () {
        let result = isEmptyCA('1', 'Checkbox');
        expect(result).toBe(false);
      });
    });

    describe('check Text value', function () {
      it('returns false for not empty', function () {
        let result = isEmptyCA('some text', 'Text');
        expect(result).toBe(false);
      });

      it('returns true for empty', function () {
        let result = isEmptyCA('', 'Text');
        expect(result).toBe(true);
      });
    });

    describe('check Map:Person type', function () {
      it('returns false for selected', function () {
        let result = isEmptyCA('Person', 'Map:Person');
        expect(result).toBe(false);
      });

      it('returns true for not selected', function () {
        let result = isEmptyCA('', 'Map:Person');
        expect(result).toBe(true);
      });

      it('returns true for not selected cav', function () {
        let result = isEmptyCA('', 'Map:Person', {attribute_object: null});
        expect(result).toBe(true);
      });

      it('returns false for selected cav', function () {
        let result = isEmptyCA('', 'Map:Person', {attribute_object: 'Person'});
        expect(result).toBe(false);
      });
    });

    describe('check Date type', function () {
      it('returns false for selected', function () {
        let result = isEmptyCA('01/01/2016', 'Date');
        expect(result).toBe(false);
      });

      it('returns true for not selected', function () {
        let result = isEmptyCA('', 'Date');
        expect(result).toBe(true);
      });
    });

    describe('check Dropdown type', function () {
      it('returns false for selected', function () {
        let result = isEmptyCA('value', 'Dropdown');
        expect(result).toBe(false);
      });

      it('returns true for not selected', function () {
        let result = isEmptyCA('', 'Dropdown');
        expect(result).toBe(true);
      });
    });

    describe('check invalid type', function () {
      it('returns false for invalid type', function () {
        let result = isEmptyCA('some value', 'Invalid');
        expect(result).toBe(false);
      });
    });
  });

  describe('methods to validate requirements', function () {
    let dropdownField;

    beforeEach(function () {
      dropdownField = new can.Map({
        id: 2,
        type: 'dropdown',
        validationConfig: {
          'nothing required': ddValidationMapToValue(),
          'comment required': ddValidationMapToValue({
            comment: true,
          }),
          'evidence required': ddValidationMapToValue({
            attachment: true,
          }),
          'url required': ddValidationMapToValue({
            url: true,
          }),
          'comment & evidence required': ddValidationMapToValue({
            comment: true,
            attachment: true,
          }),
          'comment & url required': ddValidationMapToValue({
            comment: true,
            url: true,
          }),
          'url & evidence required': ddValidationMapToValue({
            url: true,
            attachment: true,
          }),
          'comment, evidence, url required': ddValidationMapToValue({
            comment: true,
            attachment: true,
            url: true,
          }),
          one: ddValidationMapToValue({
            comment: true,
            attachment: true,
          }),
          two: ddValidationMapToValue({
            comment: true,
            attachment: true,
          }),
        },
        preconditions_failed: [],
        validation: {
          mandatory: false,
        },
        errorsMap: {
          comment: false,
          evidence: false,
          url: false,
        },
      });
    });

    describe('check isCommentRequired() method', function () {
      it('should return TRUE if comments required', function () {
        ['one', 'two',
          'comment required',
          'comment & evidence required',
          'comment & url required',
          'comment, evidence, url required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isCommentRequired(dropdownField)).toEqual(true);
        });
      });

      it('should return FALSE if comments NOT required', function () {
        ['nothing required',
          'evidence required',
          'url required',
          'url & evidence required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isCommentRequired(dropdownField)).toEqual(false);
        });
      });
    });

    describe('check isEvidenceRequired() method', function () {
      it('should return TRUE if evidence required', function () {
        ['one', 'two',
          'evidence required',
          'url & evidence required',
          'comment & evidence required',
          'comment, evidence, url required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isEvidenceRequired(dropdownField)).toEqual(true);
        });
      });

      it('should return FALSE if evidence NOT required', function () {
        ['nothing required',
          'comment required',
          'url required',
          'comment & url required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isEvidenceRequired(dropdownField)).toEqual(false);
        });
      });
    });

    describe('check isURLRequired() method', function () {
      it('should return TRUE if url required', function () {
        ['url required',
          'comment & url required',
          'comment, evidence, url required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isUrlRequired(dropdownField)).toEqual(true);
        });
      });

      it('should return FALSE if url NOT required', function () {
        ['nothing required',
          'comment required',
          'evidence required',
          'comment & evidence required',
        ].forEach((value) => {
          dropdownField.attr('value', value);
          expect(isUrlRequired(dropdownField)).toEqual(false);
        });
      });
    });
  });

  describe('setCustomAttributeValue() method', function () {
    let ca;

    beforeEach(function () {
      ca = new can.Map();
    });

    describe('if attributeType is "person"', function () {
      beforeEach(function () {
        ca.attr('attributeType', 'person');
      });

      it('assigns "Person" to "attribute_value" attr', function () {
        setCustomAttributeValue(ca);

        expect(ca.attr('attribute_value')).toBe('Person');
      });

      it('assigns object with specified id to "attribute_object" attr',
        function () {
          let value = 'mockValue';
          setCustomAttributeValue(ca, value);

          expect(ca.attr('attribute_object').serialize()).toEqual({
            type: 'Person',
            id: value,
          });
        });

      it('assigns value to "attribute_object_id" attr', function () {
        let value = 'mockValue';
        setCustomAttributeValue(ca, value);

        expect(ca.attr('attribute_object_id')).toBe(value);
      });

      it('assigns null to attribute_object_id and attribute_object attrs' +
      'if value is falsy', function () {
        const falsyValues = ['', null, undefined, false, 0, NaN];

        falsyValues.forEach((falsy) => {
          setCustomAttributeValue(ca, falsy);

          expect(ca.attr('attribute_object_id')).toBeNull();
          expect(ca.attr('attribute_object')).toBeNull();
        });
      });
    });
  });
});
