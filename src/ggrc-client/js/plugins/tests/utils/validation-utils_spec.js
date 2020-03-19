/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map/can-map';
import canList from 'can-list/can-list';
import canModel from 'can-model/src/can-model';

import {isValidAttr, validateAttr, validateInputValue} from '../../utils/validation-utils';

describe('validation utils', () => {
  describe('validateAttr util', () => {
    let testModel;

    beforeAll(() => {
      testModel = new canModel();
    });

    it('should return undefined. model is valid', () => {
      testModel.attr('errors', undefined);
      const result = validateAttr(testModel, 'issue_tracker.title');
      expect(result).toBeUndefined();
    });

    it('should return undefined. issue_tracker is valid', () => {
      const errors = new canMap({});
      testModel.attr('errors', errors);
      const result = validateAttr(testModel, 'issue_tracker.title');
      expect(result).toBeUndefined();
    });

    it('should return undefined. title is valid', () => {
      const errors = new canMap({});
      testModel.attr('errors', errors);
      const result = validateAttr(testModel, 'title');
      expect(result).toBeUndefined();
    });

    it('should return error message for simple attrubute',
      () => {
        const errors = new canMap({
          title: new canList([
            'cannot be blank',
            'missed componed id',
          ]),
        });

        testModel.attr('errors', errors);
        const result = validateAttr(testModel, 'title');
        expect(result).toEqual('cannot be blank; missed componed id');
      }
    );

    it('should return error message. issue_tracker has title error',
      () => {
        const errors = new canMap({
          issue_tracker: new canList([
            'something wrong',
            {title: 'cannot be blank'},
          ]),
        });

        testModel.attr('errors', errors);
        const result = validateAttr(testModel, 'issue_tracker.title');
        expect(result).toEqual('cannot be blank');
      }
    );

    it('should return error message. issue_tracker has title errors',
      () => {
        const errors = new canMap({
          issue_tracker: new canList([
            'something wrong',
            {title: 'cannot be blank'},
            {title: 'max length is 100500'},
          ]),
        });

        testModel.attr('errors', errors);
        const result = validateAttr(testModel, 'issue_tracker.title');
        expect(result).toEqual('cannot be blank; max length is 100500');
      }
    );
  });

  describe('isValidAttr util', () => {
    let testModel;

    beforeAll(() => {
      testModel = new canModel();
    });

    it('should return TRUE. model is valid', () => {
      testModel.attr('errors', undefined);
      const result = isValidAttr(testModel, 'issue_tracker.title');
      expect(result).toBeTruthy();
    });

    it('should return TRUE. issue_tracker is valid', () => {
      const errors = new canMap({});
      testModel.attr('errors', errors);
      const result = isValidAttr(testModel, 'issue_tracker.title');
      expect(result).toBeTruthy();
    });

    it('should return TRUE. title is valid', () => {
      const errors = new canMap({});
      testModel.attr('errors', errors);
      const result = isValidAttr(testModel, 'title');
      expect(result).toBeTruthy();
    });

    it('should return FALSE. simple attr is not valid',
      () => {
        const errors = new canMap({
          title: new canList([
            'cannot be blank',
            'missed componed id',
          ]),
        });

        testModel.attr('errors', errors);
        const result = isValidAttr(testModel, 'title');
        expect(result).toBeFalsy();
      }
    );

    it('should return FALSE. issue_tracker has title error',
      () => {
        const errors = new canMap({
          issue_tracker: new canList([
            'something wrong',
            {title: 'cannot be blank'},
          ]),
        });

        testModel.attr('errors', errors);
        const result = isValidAttr(testModel, 'issue_tracker.title');
        expect(result).toBeFalsy();
      }
    );

    it('should return FALSE. issue_tracker has title errors',
      () => {
        const errors = new canMap({
          issue_tracker: new canList([
            'something wrong',
            {title: 'cannot be blank'},
            {title: 'max length is 100500'},
          ]),
        });

        testModel.attr('errors', errors);
        const result = isValidAttr(testModel, 'issue_tracker.title');
        expect(result).toBeFalsy();
      }
    );
  });

  describe('validateInputValue() util', () => {
    let instance;
    let field;

    beforeEach(() => {
      instance = new canModel();
      field = 'testField';
    });

    it('returns FALSE if instance doesn\'t have field', () => {
      instance.attr(field, null);

      const result = validateInputValue(field, instance);

      expect(result).toBe(false);
    });

    it('returns FALSE if instance doesn\'t have transient field', () => {
      instance.attr(`_transient.${field}`, null);

      const result = validateInputValue(field, instance);

      expect(result).toBe(false);
    });

    it('returns FALSE if title of field equals title of transient field',
      () => {
        instance.attr(`_transient.${field}`, {title: 'test_title'});
        instance.attr(field, {title: 'test_title'});

        const result = validateInputValue(field, instance);

        expect(result).toBe(false);
      });

    it('returns TRUE if title of field doesn\'t equal' +
      'title of transient field', () => {
      instance.attr(`_transient.${field}`, {title: 'test_title'});
      instance.attr(field, {title: 'test_title2'});

      const result = validateInputValue(field, instance);

      expect(result).toBe(true);
    });
  });
});
