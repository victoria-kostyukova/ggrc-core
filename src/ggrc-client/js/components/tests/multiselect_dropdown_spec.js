/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../js_specs/spec_helpers';
import Component from '../dropdown/multiselect-dropdown';

describe('multiselect-dropdown component', function () {
  'use strict';

  describe('updateSelected() method', function () {
    let options;
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);

      options = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: true}
      ];
      viewModel.attr('options', options);
    });

    it('sets _stateWasUpdated attr to true', () => {
      viewModel.attr('_stateWasUpdated', false);

      viewModel.updateSelected();

      expect(viewModel.attr('_stateWasUpdated')).toBe(true);
    });

    it('assigns new list into selected from options', () => {
      const expectedSelected = _.filter(options, (item) => {
        return item.checked;
      });

      viewModel.attr('options', options);
      viewModel.attr('selected', []);

      viewModel.updateSelected();

      expect(viewModel.attr('selected').serialize()).toEqual(expectedSelected);
    });

    it('triggers "multiselect:changed" event if element attr is defined',
      () => {
        viewModel.attr('element', {});
        viewModel.attr('options', options);
        viewModel.attr('selected', []);
        spyOn(can, 'trigger');

        viewModel.updateSelected();

        expect(can.trigger).toHaveBeenCalledWith(
          viewModel.element,
          'multiselect:changed',
          [viewModel.attr('selected')],
        );
      });
  });

  describe('_displayValue attribute', function () {
    let viewModel;
    let options;
    let draftItem;
    let activeItem;
    let openItem;

    beforeEach(function () {
      viewModel = getComponentVM(Component);

      options = new can.Map([
        {
          value: 'Draft',
        },
        {
          value: 'Active',
        },
        {
          value: 'Open',
        },
        {
          value: 'Deprecated',
        },
      ]);

      viewModel.attr('options', options);

      draftItem = options[0];
      activeItem = options[1];
      openItem = options[2];
    });

    it('check "_displayValue" after updateSelected()',
      function () {
        draftItem.attr('checked', true);
        activeItem.attr('checked', true);

        // select items
        viewModel.updateSelected(draftItem);

        expect(viewModel.attr('_displayValue'))
          .toEqual(draftItem.value + ', ' + activeItem.value);
      }
    );

    it('check "_displayValue" after remove item from "seleted"',
      function () {
        draftItem.attr('checked', true);
        activeItem.attr('checked', true);
        openItem.attr('checked', true);

        // select items
        viewModel.updateSelected();

        // remove activeItem from 'selected' array
        activeItem.attr('checked', false);
        viewModel.updateSelected();

        // '_displayValue' should contain values of 'draftItem' and 'openItem' items
        expect(viewModel.attr('_displayValue'))
          .toEqual(draftItem.value + ', ' + openItem.value);
      }
    );
  });

  describe('"open/close" state of component', function () {
    let viewModel;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
      viewModel.attr('options', [{value: 'someOption'}]);
    });

    it('open dropdown',
      function () {
        // click on dropdown input
        viewModel.openDropdown();

        // "window.click" event is triggered after click on dropdown input
        viewModel.changeOpenCloseState();
        expect(viewModel.attr('isOpen')).toEqual(true);
        expect(viewModel.attr('canBeOpen')).toEqual(false);
      }
    );

    it('close dropdown without changing of options',
      function () {
        spyOn(can, 'trigger');
        viewModel.attr('isOpen', true);
        viewModel.attr('_stateWasUpdated', false);

        // simulate "window.click" event
        viewModel.changeOpenCloseState();

        expect(viewModel.attr('isOpen')).toEqual(false);
        expect(viewModel.attr('canBeOpen')).toEqual(false);
        expect(can.trigger.calls.count()).toEqual(0);
      }
    );

    it('close dropdown with changing of options',
      function () {
        spyOn(can, 'trigger');
        viewModel.attr('isOpen', true);
        viewModel.attr('_stateWasUpdated', false);

        viewModel.updateSelected();

        // simulate "window.click" event
        viewModel.changeOpenCloseState();

        expect(viewModel.attr('isOpen')).toEqual(false);
        expect(viewModel.attr('canBeOpen')).toEqual(false);
        expect(can.trigger.calls.count()).toEqual(1);
      }
    );
  });
});
