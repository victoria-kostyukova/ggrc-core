/*
 Copyright (C) 2019 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../sort';

describe('sort component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('"sort()" method', () => {
    const testItems = ['B', 'C', 'A'];

    it('should sort items', () => {
      viewModel.attr('items', testItems);
      viewModel.sort();

      const sortedItems = viewModel.attr('sortedItems');
      expect(sortedItems.length).toBe(3);
      expect(sortedItems[0]).toEqual('A');
      expect(sortedItems[1]).toEqual('B');
      expect(sortedItems[2]).toEqual('C');
    });
  });
});
