/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../tree-header';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('tree-header component', () => {
  let vm;

  function generateColumns(names) {
    return names.map(function (name) {
      return {
        attr_name: name,
      };
    });
  }

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('setColumns() method', () => {
    let method;
    beforeEach(() => {
      method = vm.setColumns.bind(vm);
    });

    it('dispatches "updateColumns" event with selected columns', () => {
      vm.columns = [
        {name: 'col1', selected: true},
        {name: 'col2', selected: false},
        {name: 'col3', selected: true},
        {name: 'col4', selected: true},
        {name: 'col5', selected: false},
        {name: 'col6', selected: true},
      ];

      spyOn(vm, 'dispatch');

      method();

      expect(vm.dispatch).toHaveBeenCalledWith({
        type: 'updateColumns',
        columns: ['col1', 'col3', 'col4', 'col6'],
      });
    });
  });

  describe('initializeColumns() method', () => {
    let method;
    beforeEach(() => {
      method = vm.initializeColumns.bind(vm);
    });

    it('dispatches "updateColumns" event with selected columns', () => {
      const expectedColumns = [
        {name: 'col1', selected: true},
        {name: 'col2', selected: false},
        {name: 'col3', selected: true},
        {name: 'col4', selected: false},
        {name: 'col5', selected: false},
      ];

      vm.availableColumns =
        generateColumns(['col1', 'col2', 'col3', 'col4', 'col5']);
      vm.selectedColumns = generateColumns(['col1', 'col3']);

      method();

      expect(vm.columns.length).toBe(expectedColumns.length);
      for (let i = 0; i < expectedColumns.length; i++) {
        expect(vm.columns[i].selected)
          .toBe(expectedColumns[i].selected);
      }
    });
  });

  describe('onOrderChange() method', () => {
    it('dipatches sort event with field and direction', () => {
      const orderBy = {
        field: 'field',
        direction: 'asc',
      };
      spyOn(vm, 'dispatch');
      vm.orderBy = orderBy;
      vm.onOrderChange();

      expect(vm.dispatch).toHaveBeenCalledWith({
        type: 'sort',
        field: orderBy.field,
        sortDirection: orderBy.direction,
      });
    });
  });

  describe('events', () => {
    let events;

    beforeEach(() => {
      events = Component.prototype.events;
    });

    describe('"{viewModel.orderBy} change"() event', () => {
      let event;

      beforeEach(() => {
        event = events['{viewModel.orderBy} changed'].bind({
          viewModel: vm,
        });
      });

      it('calls onOrderChange', () => {
        spyOn(vm, 'onOrderChange');
        event();
        expect(vm.onOrderChange).toHaveBeenCalled();
      });
    });
  });
});
