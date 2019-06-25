/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loFilter from 'lodash/filter';
import canMap from 'can-map';
import canEvent from 'can-event';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../multiselect-dropdown';

describe('multiselect-dropdown component', function () {
  'use strict';

  let events;
  let viewModel;

  beforeAll(function () {
    events = Component.prototype.events;
  });

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('openDropdown() method', function () {
    it('sets "canBeOpen" to true if component is not disabled', function () {
      viewModel.attr('canBeOpen', false);
      viewModel.attr('disabled', false);

      viewModel.openDropdown();

      expect(viewModel.attr('canBeOpen')).toBe(true);
    });

    it('does not set "canBeOpen" if component is disabled', function () {
      viewModel.attr('canBeOpen', false);
      viewModel.attr('disabled', true);

      viewModel.openDropdown();

      expect(viewModel.attr('canBeOpen')).toBe(false);
    });
  });

  describe('events', function () {
    describe('"{window} click" handler', function () {
      let method;
      let that;

      beforeEach(function () {
        that = {
          viewModel: viewModel,
        };
        method = events['{window} click'].bind(that);
      });

      it('calls changeOpenCloseState if component is not disabled',
        function () {
          viewModel.changeOpenCloseState =
          jasmine.createSpy('changeOpenCloseState');
          viewModel.attr('disabled', false);

          method();

          expect(viewModel.changeOpenCloseState).toHaveBeenCalled();
        });

      it('does not call changeOpenCloseState if component is disabled',
        function () {
          viewModel.changeOpenCloseState =
          jasmine.createSpy('changeOpenCloseState');
          viewModel.attr('disabled', true);

          method();

          expect(viewModel.changeOpenCloseState).not.toHaveBeenCalled();
        });
    });
  });

  describe('updateSelected() method', function () {
    let options;

    beforeEach(function () {
      options = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: true},
      ];
      viewModel.attr('options', options);
      spyOn(viewModel, 'dispatch');
    });

    it('sets _stateWasUpdated attr to true', () => {
      viewModel.attr('_stateWasUpdated', false);

      viewModel.updateSelected();

      expect(viewModel.attr('_stateWasUpdated')).toBe(true);
    });

    it('assigns new list into selected from options', () => {
      const expectedSelected = loFilter(options, (item) => {
        return item.checked;
      });
      viewModel.attr('options', options);
      viewModel.attr('selected', []);

      viewModel.updateSelected();

      expect(viewModel.attr('selected').serialize()).toEqual(expectedSelected);
    });

    it('dispatches event with "selectedChanged" type and selected items',
      () => {
        viewModel.attr('element', {});
        viewModel.attr('options', options);
        viewModel.attr('selected', []);
        spyOn(canEvent, 'trigger');

        viewModel.updateSelected();

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'selectedChanged',
          selected: viewModel.attr('selected'),
        });
      });
  });

  describe('_displayValue attribute', function () {
    let options;
    let draftItem;
    let activeItem;
    let openItem;

    beforeEach(function () {
      options = new canMap([
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
    beforeEach(function () {
      viewModel.attr('options', [{value: 'someOption'}]);
      spyOn(viewModel, 'dispatch');
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
        spyOn(canEvent, 'trigger');
        viewModel.attr('isOpen', true);
        viewModel.attr('_stateWasUpdated', false);

        // simulate "window.click" event
        viewModel.changeOpenCloseState();

        expect(viewModel.attr('isOpen')).toEqual(false);
        expect(viewModel.attr('canBeOpen')).toEqual(false);
        expect(viewModel.dispatch.calls.count()).toEqual(0);
      }
    );

    it('close dropdown with changing of options',
      function () {
        spyOn(canEvent, 'trigger');
        viewModel.attr('isOpen', true);
        viewModel.attr('_stateWasUpdated', false);

        viewModel.updateSelected();

        // simulate "window.click" event
        viewModel.changeOpenCloseState();

        expect(viewModel.attr('isOpen')).toEqual(false);
        expect(viewModel.attr('canBeOpen')).toEqual(false);
        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'dropdownClose',
          selected: viewModel.attr('selected'),
        });
      }
    );
  });
});
