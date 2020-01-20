/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component,
{FLOAT_NUMBER_PATTERN, INT_NUMBER_PATTERN, NEGATIVE_NUMBER_PATTERN}
  from '../numberbox-component';

describe('numberbox component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  function checkAllNumbers(testMethod) {
    let keyValue;
    let result;

    for (let i = 0; i < 10; i++) {
      keyValue = `${i}`;
      result = testMethod(keyValue);
      expect(result).toBeTruthy();
    }
  }

  function checkNotNumberSymbols(testMethod) {
    const charSet = 'abcdef[]{}=+()@#$%^&*!,/?ZXYW';
    let result;

    for (let i = 0; i < charSet.length; i++) {
      result = testMethod(charSet[i]);
      expect(result).toBeFalsy();
    }
  }

  describe('"checkIntKey" method', () => {
    it('should return TRUE. all values are numbers', () => {
      const method = viewModel.checkIntKey.bind(viewModel);
      checkAllNumbers(method);
    });

    it('should return FALSE for all not number symbols', () => {
      const method = viewModel.checkIntKey.bind(viewModel);
      checkNotNumberSymbols(method);
    });

    it('should return FALSE. "minus" char. "enableNegative" false', () => {
      viewModel.attr('enableNegative', false);
      expect(viewModel.checkIntKey('-')).toBeFalsy();
    });

    it('should return TRUE. "minus" char. "enableNegative" true', () => {
      viewModel.attr('enableNegative', true);
      expect(viewModel.checkIntKey('-')).toBeTruthy();
    });
  });

  describe('"checkFloatKey" method', () => {
    it('should return TRUE. all values are numbers', () => {
      const method = viewModel.checkFloatKey.bind(viewModel);
      checkAllNumbers(method);
    });

    it('should return FALSE for all not number symbols', () => {
      const method = viewModel.checkFloatKey.bind(viewModel);
      checkNotNumberSymbols(method);
    });

    it('should return TRUE. "minus" char. "enableNegative" true', () => {
      viewModel.attr('enableNegative', true);
      expect(viewModel.checkFloatKey('-')).toBeTruthy();
    });

    it('should return FALSE. "minus" char. "enableNegative" false', () => {
      viewModel.attr('enableNegative', false);
      expect(viewModel.checkFloatKey('-')).toBeFalsy();
    });

    it('should return TRUE. "." char', () => {
      expect(viewModel.checkFloatKey('.')).toBeTruthy();
    });
  });

  describe('"validateValue" method', () => {
    let validateValueMethod;

    beforeEach(() => {
      viewModel.attr('enableNegative', false);
      viewModel.attr('enableFloat', false);

      validateValueMethod = viewModel.validateValue.bind(viewModel);
    });

    it('should reset value. wrong float', () => {
      const wrongFloats = ['.', '', '.12', '43.52.11', '44..23', '3.'];
      viewModel.attr('enableFloat', true);

      wrongFloats.forEach((wrongFloat) => {
        viewModel.attr('value', wrongFloat);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual('');
      });
    });

    it('should not reset value. correct float', () => {
      const correctFloats = ['1', '12', '12.3', '0.3', '0.00009', '999.99'];
      viewModel.attr('enableFloat', true);

      correctFloats.forEach((correctFloat) => {
        viewModel.attr('value', correctFloat);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual(correctFloat);
      });
    });

    it('should reset value. wrong negative float', () => {
      const wrongFloats = ['-', '.', '', '--1.2', '-43.-11', '44-23', '3-'];
      viewModel.attr('enableFloat', true);
      viewModel.attr('enableNegative', true);

      wrongFloats.forEach((wrongFloat) => {
        viewModel.attr('value', wrongFloat);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual('');
      });
    });

    it('should not reset value. correct negative float', () => {
      const correctFloats = ['-1', '-12.3', '-0.3', '-0.00009', '-999.99'];
      viewModel.attr('enableFloat', true);
      viewModel.attr('enableNegative', true);

      correctFloats.forEach((correctFloat) => {
        viewModel.attr('value', correctFloat);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual(correctFloat);
      });
    });

    it('should reset value. wrong negative int', () => {
      const negativeInts = ['-', '', '--1', '1234-', '55-90'];
      viewModel.attr('enableNegative', true);

      negativeInts.forEach((negativeInt) => {
        viewModel.attr('value', negativeInt);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual('');
      });
    });

    it('should not reset value. correct negative int', () => {
      const negativeInts = ['-1', '-123', '-1', '-123', '-5590'];
      viewModel.attr('enableNegative', true);

      negativeInts.forEach((negativeInt) => {
        viewModel.attr('value', negativeInt);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual(negativeInt);
      });
    });

    it('should reset value if value is falsly', () => {
      const falslyValues = [null, undefined];

      falslyValues.forEach((falslyValue) => {
        viewModel.attr('value', falslyValue);
        validateValueMethod();
        expect(viewModel.attr('value')).toEqual('');
      });
    });
  });

  describe('"buildValidationPattern" method', () => {
    let buildValidationPattern;

    beforeEach(() => {
      viewModel.attr('enableNegative', false);
      viewModel.attr('enableFloat', false);

      buildValidationPattern = viewModel.buildValidationPattern
        .bind(viewModel);
    });

    it('check int number pattern', () => {
      const expectedPattern = '^' + INT_NUMBER_PATTERN + '$';
      expect(buildValidationPattern()).toEqual(expectedPattern);
    });

    it('check float number pattern', () => {
      const expectedPattern = '^' + FLOAT_NUMBER_PATTERN + '$';
      viewModel.attr('enableFloat', true);
      expect(buildValidationPattern()).toEqual(expectedPattern);
    });

    it('check negative int number pattern', () => {
      const expectedPattern = '^' +
        NEGATIVE_NUMBER_PATTERN +
        INT_NUMBER_PATTERN +
        '$';

      viewModel.attr('enableNegative', true);
      expect(buildValidationPattern()).toEqual(expectedPattern);
    });

    it('check negative float number pattern', () => {
      const expectedPattern = '^' +
        NEGATIVE_NUMBER_PATTERN +
        FLOAT_NUMBER_PATTERN +
        '$';

      viewModel.attr('enableNegative', true);
      viewModel.attr('enableFloat', true);
      expect(buildValidationPattern()).toEqual(expectedPattern);
    });
  });
});
