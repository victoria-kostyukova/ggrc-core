/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {
  ddValidationMapToValue,
  isCommentRequired,
  isEvidenceRequired,
  isUrlRequired,
  setCustomAttributeValue,
} from '../utils/ca-utils';

describe('ca-utils', function () {
  describe('methods to validate requirements', function () {
    let dropdownField;

    beforeEach(function () {
      dropdownField = new canMap({
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
      ca = new canMap();
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
    });
  });
});
