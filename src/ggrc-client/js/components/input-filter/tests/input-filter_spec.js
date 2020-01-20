/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../input-filter';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('input-filter component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('exclude() method', () => {
    let method;
    let testString = 'test';

    beforeAll(() => {
      method = viewModel.exclude;
    });

    it('should exclude single symbol entry', () => {
      const result = method(testString, 'e');

      expect(result).toBe('tst');
    });

    it('should exclude multiple entries', () => {
      const result = method(testString, 't');

      expect(result).toBe('es');
    });

    it('should not do anything with empty string', () => {
      const result = method(testString, '');

      expect(result).toBe('test');
    });
  });
});
