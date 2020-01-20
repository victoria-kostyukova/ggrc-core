/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map/can-map';
import canList from 'can-list/can-list';
import canModel from 'can-model/src/can-model';

import {isValidAttr, validateAttr} from '../../utils/validation-utils';

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
});
