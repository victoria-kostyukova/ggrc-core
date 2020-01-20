/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../instance-fields-diff';

describe('instance-fields-diff component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"buildDiffObject" function', () => {
    let currentInstance;
    let buildDiffObject;

    beforeEach(() => {
      currentInstance = {
        title: 'My current title',
        description: 'My current description',
        status: 'Draft',
      };

      viewModel.attr('currentInstance', currentInstance);
      viewModel.attr('diff', []);

      viewModel.getAttrDisplayName = getAttrDisplayNameStub;
      buildDiffObject = viewModel.buildDiffObject.bind(viewModel);
    });

    function getAttrDisplayNameStub(key) {
      return key;
    }

    it('diff should contain 2 items', () => {
      const expectedTitle = 'title...';
      const expectedDescription = 'description...';
      let diff;

      viewModel.attr('modifiedFields', {
        title: expectedTitle,
        description: expectedDescription,
      });
      buildDiffObject();

      diff = viewModel.attr('diff');
      expect(diff.length).toBe(2);
      expect(diff[0].attrName).toEqual('title');
      expect(diff[0].currentVal[0]).toEqual(currentInstance.title);
      expect(diff[0].modifiedVal[0]).toEqual(expectedTitle);
      expect(diff[1].attrName).toEqual('description');
      expect(diff[1].currentVal[0]).toEqual(currentInstance.description);
      expect(diff[1].modifiedVal[0]).toEqual(expectedDescription);
    });

    it('modified value should be empty', () => {
      let diff;

      viewModel.attr('modifiedFields', {
        title: '',
      });
      buildDiffObject();

      diff = viewModel.attr('diff');
      expect(diff.length).toBe(1);
      expect(diff[0].attrName).toEqual('title');
      expect(diff[0].currentVal[0]).toEqual(currentInstance.title);
      expect(diff[0].modifiedVal[0]).toEqual(viewModel.attr('emptyValue'));
    });

    it('current value should be empty', () => {
      const expectedValue = 'new value';
      let diff;

      viewModel.attr('modifiedFields', {
        newInstanceProporty: expectedValue,
      });
      buildDiffObject();

      diff = viewModel.attr('diff');
      expect(diff.length).toBe(1);
      expect(diff[0].attrName).toEqual('newInstanceProporty');
      expect(diff[0].modifiedVal[0]).toEqual(expectedValue);
      expect(diff[0].currentVal[0]).toEqual(viewModel.attr('emptyValue'));
    });
  });

  describe('"specificDislayValues" function', () => {
    let method;

    beforeAll(() => {
      method = viewModel.specificDislayValues;
    });

    it('should return "Yes" value for "fraud_related" key', () => {
      const expectedResult = 'Yes';
      const key = 'fraud_related';

      let result = method('1', key);
      expect(result).toEqual(expectedResult);

      result = method(true, key);
      expect(result).toEqual(expectedResult);
    });

    it('should return "No" value for "fraud_related" key', () => {
      const expectedResult = 'No';
      const key = 'fraud_related';

      let result = method('0', key);
      expect(result).toEqual(expectedResult);

      result = method(false, key);
      expect(result).toEqual(expectedResult);
    });

    it('should return "Key" value for "key_control" key', () => {
      const expectedResult = 'Key';
      const key = 'key_control';

      let result = method('1', key);
      expect(result).toEqual(expectedResult);

      result = method(true, key);
      expect(result).toEqual(expectedResult);
    });

    it('should return "Non-Key" value for "key_control" key', () => {
      const expectedResult = 'Non-Key';
      const key = 'key_control';

      let result = method('0', key);
      expect(result).toEqual(expectedResult);

      result = method(false, key);
      expect(result).toEqual(expectedResult);
    });
  });
});
