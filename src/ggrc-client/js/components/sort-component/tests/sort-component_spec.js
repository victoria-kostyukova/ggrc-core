/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../sort-component';

describe('sort-component component', () => {
  let ViewModel;

  beforeAll(() => {
    ViewModel = getComponentVM(Component);
  });

  describe('"sort()" method', () => {
    const testItems = ['B', 'C', 'A'];

    it('should sort items', () => {
      ViewModel.items = testItems;
      ViewModel.sort();

      const sortedItems = ViewModel.sortedItems;
      expect(sortedItems.length).toBe(3);
      expect(sortedItems[0]).toEqual('A');
      expect(sortedItems[1]).toEqual('B');
      expect(sortedItems[2]).toEqual('C');
    });
  });
});
