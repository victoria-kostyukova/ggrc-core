/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tree-item';

describe('tree-item component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('selectableSize property', () => {
    it('selectedColumns.length < 4', () => {
      vm.selectedColumns = ['a', 'b', 'c'];

      expect(vm.selectableSize).toEqual(1);
    });

    it('selectedColumns.length = 5', () => {
      vm.selectedColumns = ['a', 'b', 'c', 'd', 'e'];

      expect(vm.selectableSize).toEqual(2);
    });

    it('selectedColumns.length > 7', () => {
      vm.selectedColumns = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

      expect(vm.selectableSize).toEqual(3);
    });
  });
});
