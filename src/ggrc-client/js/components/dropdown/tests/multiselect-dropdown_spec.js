/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import canEvent from 'can-event';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
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

  describe('_displayValue attribute', function () {
    beforeEach(function () {
      const visibleOptions = [
        {value: 'Select All', checked: false, isSelectAll: true},
        {value: 'Draft', checked: false},
        {value: 'Active', checked: false},
        {value: 'Open', checked: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
    });

    it('check "_displayValue" after updateSelected()', function () {
      viewModel.attr('visibleOptions')[1].attr('checked', true);
      viewModel.updateSelected();

      expect(viewModel.attr('_displayValue'))
        .toEqual('Draft, Open');
    });

    it('check "_displayValue" after remove item from "selected"', function () {
      viewModel.attr('visibleOptions')[1].attr('checked', false);

      viewModel.updateSelected();

      expect(viewModel.attr('_displayValue'))
        .toEqual('Open');
    }
    );
  });

  describe('setVisibleOptions() method', function () {
    it('sets visibleOptions from options and one additional internal option',
      function () {
        const options = [
          {value: 1, checked: true},
          {value: 2, checked: false},
          {value: 3, checked: true},
        ];
        viewModel.attr('options', options);

        spyOn(viewModel, 'isAllSelected').and.returnValue(false);

        const expectedVisibleOptions = [
          {
            value: 'Select All',
            checked: false,
            isSelectAll: true,
            highlighted: false,
          },
          {
            value: 1,
            checked: true,
            highlighted: false,
          },
          {
            value: 2,
            checked: false,
            highlighted: false,
          },
          {
            value: 3,
            checked: true,
            highlighted: false,
          },
        ];

        viewModel.setVisibleOptions(viewModel.attr('options'));

        expect(viewModel.attr('visibleOptions').serialize())
          .toEqual(expectedVisibleOptions);
      });
  });

  describe('isAllSelected() method', function () {
    let options;

    it('returns true if all options are checked', function () {
      options = [
        {value: 1, checked: true},
        {value: 2, checked: true},
        {value: 3, checked: true},
      ];
      viewModel.attr('options', options);

      expect(viewModel.isAllSelected()).toBe(true);
    });

    it('returns false if not all options are checked', function () {
      options = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: true},
      ];
      viewModel.attr('options', options);

      expect(viewModel.isAllSelected()).toBe(false);
    });
  });

  describe('getHighlightedOptionIndex() method', function () {
    it('returns index of the highlighted option', function () {
      const visibleOptions = [
        {value: 1, checked: true, highlighted: false},
        {value: 2, checked: false, highlighted: true},
        {value: 3, checked: true, highlighted: false},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      expect(viewModel.getHighlightedOptionIndex()).toBe(1);
    });

    it('returns -1 if there is no highlighted option ', function () {
      const visibleOptions = [
        {value: 1, checked: true, highlighted: false},
        {value: 2, checked: false, highlighted: false},
        {value: 3, checked: true, highlighted: false},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      expect(viewModel.getHighlightedOptionIndex()).toBe(-1);
    });
  });

  describe('updateSelected() method', function () {
    let visibleOptions;

    beforeEach(function () {
      visibleOptions = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: true},
        {value: 4, checked: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
    });

    it('sets _stateWasUpdated attr to true', () => {
      viewModel.attr('_stateWasUpdated', false);

      viewModel.updateSelected();

      expect(viewModel.attr('_stateWasUpdated')).toBe(true);
    });

    it('assigns new list into selected from visibleOptions', () => {
      const expectedSelected = visibleOptions.filter((item) =>
        !item.isSelectAll && item.checked);

      viewModel.attr('visibleOptions', visibleOptions);

      viewModel.updateSelected();

      expect(viewModel.attr('selected').serialize()).toEqual(expectedSelected);
    });

    it('dispatches "selectedChanged" with selected options', () => {
      spyOn(viewModel, 'dispatch');

      viewModel.updateSelected();

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'selectedChanged',
        selected: viewModel.attr('selected'),
      });
    });
  });

  describe('dropdownClosed() method', function () {
    it('calls removeHighlight method', function () {
      spyOn(viewModel, 'removeHighlight');

      viewModel.dropdownClosed();

      expect(viewModel.removeHighlight).toHaveBeenCalled();
    });

    it('dispatches "dropdownClose" with selected options ' +
    'if _stateWasUpdated attr is true', function () {
      viewModel.attr('_stateWasUpdated', true);
      spyOn(viewModel, 'dispatch');

      viewModel.dropdownClosed();

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'dropdownClose',
        selected: viewModel.attr('selected'),
      });
    });

    it('sets _stateWasUpdated attr to false if it is true', function () {
      viewModel.attr('_stateWasUpdated', true);

      viewModel.dropdownClosed();

      expect(viewModel.attr('_stateWasUpdated')).toBe(false);
    });

    it('does not dispatch "dropdownClose" if _stateWasUpdated attr is false',
      function () {
        viewModel.attr('_stateWasUpdated', false);
        spyOn(viewModel, 'dispatch');

        viewModel.dropdownClosed();

        expect(viewModel.dispatch).not.toHaveBeenCalled();
      });
  });

  describe('changeOpenCloseState() method', function () {
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

  describe('selectAll() method', function () {
    it('sets "checked" to true for all options', function () {
      const visibleOptions = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      const expectedVisibleOptions = [
        {value: 1, checked: true},
        {value: 2, checked: true},
        {value: 3, checked: true, isSelectAll: true},
      ];

      viewModel.selectAll();

      expect(viewModel.attr('visibleOptions').serialize())
        .toEqual(expectedVisibleOptions);
    });
  });

  describe('unselectAll() method', function () {
    it('sets "checked" to false for all options', function () {
      const visibleOptions = [
        {value: 1, checked: true},
        {value: 2, checked: false},
        {value: 3, checked: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      const expectedVisibleOptions = [
        {value: 1, checked: false},
        {value: 2, checked: false},
        {value: 3, checked: false, isSelectAll: true},
      ];

      viewModel.unselectAll();

      expect(viewModel.attr('visibleOptions').serialize())
        .toEqual(expectedVisibleOptions);
    });
  });

  describe('selectAllOptionChange() method', function () {
    it('calls selectAll method if internal option "checked" attr is false',
      function () {
        const visibleOptions = [
          {value: 1, checked: true},
          {value: 2, checked: false},
          {value: 3, checked: false, isSelectAll: true},
        ];
        viewModel.attr('visibleOptions', visibleOptions);
        spyOn(viewModel, 'selectAll');

        viewModel.selectAllOptionChange(viewModel.attr('visibleOptions')[2]);

        expect(viewModel.selectAll).toHaveBeenCalled();
      });

    it('calls unselectAll method if internal option "checked" attr is true',
      function () {
        const visibleOptions = [
          {value: 1, checked: true},
          {value: 2, checked: true},
          {value: 3, checked: true, isSelectAll: true},
        ];
        viewModel.attr('visibleOptions', visibleOptions);
        spyOn(viewModel, 'unselectAll');

        viewModel.selectAllOptionChange(viewModel.attr('visibleOptions')[2]);

        expect(viewModel.unselectAll).toHaveBeenCalled();
      });
  });

  describe('optionChange() method', function () {
    beforeEach(function () {
      const visibleOptions = [
        {value: '1', checked: false, highlighted: false},
        {value: '2', checked: true, highlighted: true},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
    });

    it('sets "checked" attr to opposite value', function () {
      viewModel.optionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.attr('visibleOptions')[0].checked).toBe(true);
    });

    it('calls updateSelected method', function () {
      spyOn(viewModel, 'updateSelected');

      viewModel.optionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.updateSelected).toHaveBeenCalled();
    });

    it('sets "checked" attr for internal option to true ' +
    'if all option are selected', function () {
      spyOn(viewModel, 'isAllSelected').and.returnValue(true);

      viewModel.optionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.attr('visibleOptions')[2].checked).toBe(true);
      expect(viewModel.isAllSelected).toHaveBeenCalled();
    });

    it('sets "checked" attr for internal option to false ' +
    'if not all option are selected', function () {
      spyOn(viewModel, 'isAllSelected').and.returnValue(false);

      viewModel.optionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.attr('visibleOptions')[2].checked).toBe(false);
      expect(viewModel.isAllSelected).toHaveBeenCalled();
    });
  });

  describe('visibleOptionChange() method', function () {
    beforeEach(function () {
      const visibleOptions = [
        {value: '1', checked: false, highlighted: false},
        {value: '2', checked: true, highlighted: true},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      spyOn(viewModel, 'scrollTop');
    });

    it('calls chooseOption method ' +
    'if "highlighted" attr of passed option is false', function () {
      spyOn(viewModel, 'chooseOption');

      viewModel.visibleOptionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.chooseOption)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[0]);
    });

    it('calls selectAllOptionChange method ' +
    'if "isSelectAll" attr of passed option is true', function () {
      spyOn(viewModel, 'selectAllOptionChange');

      viewModel.visibleOptionChange(viewModel.attr('visibleOptions')[2]);

      expect(viewModel.selectAllOptionChange)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[2]);
    });

    it('calls optionChange method ' +
    'if "isSelectAll" attr of passed option is false', function () {
      spyOn(viewModel, 'optionChange');

      viewModel.visibleOptionChange(viewModel.attr('visibleOptions')[0]);

      expect(viewModel.optionChange)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[0]);
    });
  });

  describe('selectOption() method', function () {
    it('calls visibleOptionChange method if find option with ' +
    '"highlighted" attr is true', function () {
      const visibleOptions = [
        {value: 1, checked: true, highlighted: false},
        {value: 2, checked: false, highlighted: true},
        {value: 3, checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'visibleOptionChange');

      viewModel.selectOption();

      expect(viewModel.visibleOptionChange).toHaveBeenCalled();
    });

    it('does not call visibleOptionChange method if does not find option ' +
    'with "highlighted" attr is true', function () {
      const visibleOptions = [
        {value: 1, checked: true, highlighted: false},
        {value: 2, checked: false, highlighted: false},
        {value: 3, checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'visibleOptionChange');

      viewModel.selectOption();

      expect(viewModel.visibleOptionChange).not.toHaveBeenCalled();
    });
  });

  describe('highlightNext() method', function () {
    it('calls chooseOption methods if highlighted option is found ' +
    'and it is not last option ', function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: true},
        {value: '2', checked: false, highlighted: false},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(0);
      spyOn(viewModel, 'chooseOption');

      viewModel.highlightNext();

      expect(viewModel.chooseOption)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[1]);
    });

    it('calls chooseOption method for the first option ' +
    'if highlighted option is not found', function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: false},
        {value: '2', checked: false, highlighted: false},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(-1);
      spyOn(viewModel, 'chooseOption');

      viewModel.highlightNext();

      expect(viewModel.chooseOption)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[0]);
    });

    it('does not call chooseOption method if highlighted option is found ' +
    'and it is the last option', function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: false},
        {value: '2', checked: false, highlighted: false},
        {value: '3', checked: false, highlighted: true, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(2);
      spyOn(viewModel, 'chooseOption');

      expect(viewModel.chooseOption).not.toHaveBeenCalled();
      expect(viewModel.highlightNext()).toBeUndefined();
    });
  });

  describe('highlightPrevious() method', function () {
    it('calls chooseOption method if highlighted option is found ' +
    'and it is not the first option',
    function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: false},
        {value: '2', checked: false, highlighted: true},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(1);
      spyOn(viewModel, 'chooseOption');

      viewModel.highlightPrevious();

      expect(viewModel.chooseOption)
        .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[0]);
    });

    it('does not call chooseOption method if highlighted option is found ' +
    'and it is the first option', function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: true},
        {value: '2', checked: false, highlighted: false},
        {value: '3', checked: false, highlighted: false, isSelectAll: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
      spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(0);
      spyOn(viewModel, 'chooseOption');

      expect(viewModel.chooseOption).not.toHaveBeenCalled();
    });

    it('does not call chooseOption method if highlighted option is not found',
      function () {
        const visibleOptions = [
          {value: '1', checked: true, highlighted: false},
          {value: '2', checked: false, highlighted: false},
          {value: '3', checked: false, highlighted: false, isSelectAll: true},
        ];
        viewModel.attr('visibleOptions', visibleOptions);
        spyOn(viewModel, 'getHighlightedOptionIndex').and.returnValue(-1);
        spyOn(viewModel, 'chooseOption');

        expect(viewModel.chooseOption).not.toHaveBeenCalled();
      });
  });

  describe('processUserInput() method', function () {
    beforeEach(function () {
      const visibleOptions = [
        {value: 'Select All', checked: false, isSelectAll: true},
        {value: 'Assessment', checked: true},
        {value: 'Standards', checked: false},
        {value: 'Stands', checked: false},
      ];
      viewModel.attr('visibleOptions', visibleOptions);
    });

    it('adds to "userInput" attr new passed value ' +
    'and clears it when timeout ends', function () {
      jasmine.clock().install();

      viewModel.processUserInput('T');
      jasmine.clock().tick(100);
      expect(viewModel.attr('userInput')).toEqual('t');

      viewModel.processUserInput('h');
      jasmine.clock().tick(100);
      expect(viewModel.attr('userInput')).toEqual('th');

      viewModel.processUserInput('r');
      jasmine.clock().tick(700);
      expect(viewModel.attr('userInput')).toEqual('');

      jasmine.clock().uninstall();
    });

    it('calls chooseOption method if find option ' +
    'whose "value" attr starts with passed value' +
    'excluding an additional internal option', function () {
      const foundOption = viewModel.attr('visibleOptions')[2];

      spyOn(viewModel, 'chooseOption');

      viewModel.processUserInput('S');

      expect(viewModel.chooseOption).toHaveBeenCalledWith(foundOption);
    });

    it('does not call chooseOption method if does not find option ' +
    'whose "value" attr starts with passed value',
    function () {
      spyOn(viewModel, 'chooseOption');

      viewModel.processUserInput('I');

      expect(viewModel.chooseOption).not.toHaveBeenCalled();
    });
  });

  describe('highlightOption() method', function () {
    it('sets "highlighted" attr to true for passed option', function () {
      const visibleOptions = new canMap({
        value: 'Assessment',
        checked: true,
        highlighted: false,
      });

      viewModel.highlightOption(visibleOptions);

      expect(visibleOptions.highlighted).toBe(true);
    });
  });

  describe('removeHighlight() method', function () {
    it('sets "highlighted" attr to false for all visibleOptions', function () {
      const visibleOptions = [
        {value: '1', checked: true, highlighted: true},
        {value: '2', checked: false, highlighted: true},
      ];
      viewModel.attr('visibleOptions', visibleOptions);

      viewModel.removeHighlight(visibleOptions);

      viewModel.attr('visibleOptions').forEach((option) => {
        expect(option.attr('highlighted')).toBe(false);
      });
    });
  });

  describe('chooseOption() method', function () {
    it('calls removeHighlight, highlightOption and scrollTop methods',
      function () {
        const visibleOptions = [
          {value: '1', checked: true, highlighted: true},
          {value: '2', checked: false, highlighted: true},
        ];
        viewModel.attr('visibleOptions', visibleOptions);

        spyOn(viewModel, 'removeHighlight');
        spyOn(viewModel, 'highlightOption');
        spyOn(viewModel, 'scrollTop');

        viewModel.chooseOption(viewModel.attr('visibleOptions')[0]);

        expect(viewModel.removeHighlight).toHaveBeenCalled();
        expect(viewModel.highlightOption)
          .toHaveBeenCalledWith(viewModel.attr('visibleOptions')[0]);
        expect(viewModel.scrollTop).toHaveBeenCalled();
      });
  });

  describe('dropdownBodyClick() method', function () {
    it('calls stopPropagation for passed event', function () {
      const event = {
        stopPropagation: jasmine.createSpy('stopPropagation'),
      };

      viewModel.dropdownBodyClick(event);

      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('events', function () {
    describe('"inserted" handler', function () {
      let handler;

      beforeEach(function () {
        handler = events['inserted'].bind({viewModel});
      });

      it('calls setVisibleOptions method',
        function () {
          spyOn(viewModel, 'setVisibleOptions');

          handler();

          expect(viewModel.setVisibleOptions).toHaveBeenCalled();
        });
    });

    describe('"{viewModel} options" handler', function () {
      let handler;

      beforeEach(function () {
        handler = events['{viewModel} options'].bind({viewModel});
      });

      it('calls setVisibleOptions method',
        function () {
          spyOn(viewModel, 'setVisibleOptions');

          handler();

          expect(viewModel.setVisibleOptions).toHaveBeenCalled();
        });
    });

    describe('"{window} click" handler', function () {
      let handler;

      beforeEach(function () {
        handler = events['{window} click'].bind({viewModel});
      });

      it('calls changeOpenCloseState method if "disabled" attr is false',
        function () {
          viewModel.attr('disabled', false);

          spyOn(viewModel, 'changeOpenCloseState');

          handler();

          expect(viewModel.changeOpenCloseState).toHaveBeenCalled();
        });

      it('does not call changeOpenCloseState method if "disabled" attr is true',
        function () {
          viewModel.attr('disabled', true);

          spyOn(viewModel, 'changeOpenCloseState');

          handler();

          expect(viewModel.changeOpenCloseState).not.toHaveBeenCalled();
        });
    });

    describe('"keyup" handler', function () {
      const ESCAPE_KEY = 'Escape';
      const ENTER_KEY = 'Enter';
      let element;
      let event;
      let handler;

      beforeEach(function () {
        handler = events['keyup'].bind({viewModel});
        event = {
          stopPropagation: jasmine.createSpy('stopPropagation'),
        };
      });

      it('calls stopPropagation for passed event if "isOpen" attr is true ' +
      'and event.key is "Enter"', function () {
        viewModel.attr('isOpen', true);

        event.key = ENTER_KEY;

        handler(element, event);

        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('calls changeOpenCloseState and stopPropagation for passed event ' +
      'if "isOpen" attr is true and event.key is "Escape"', function () {
        viewModel.attr('isOpen', true);

        event.key = ESCAPE_KEY;

        spyOn(viewModel, 'changeOpenCloseState');

        handler(element, event);

        expect(viewModel.changeOpenCloseState).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('does not call changeOpenCloseState and stopPropagation ' +
      'for passed event if "isOpen" attr is false ' +
      'and event.key is "Escape"', function () {
        viewModel.attr('isOpen', false);

        event.key = ESCAPE_KEY;

        spyOn(viewModel, 'changeOpenCloseState');

        handler(element, event);

        expect(viewModel.changeOpenCloseState).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });
    });

    describe('"{window} keydown" handler', function () {
      let element;
      let event;
      let handler;

      beforeEach(function () {
        handler = events['{window} keydown'].bind({viewModel});
        event = {
          preventDefault: jasmine.createSpy('preventDefault'),
          stopPropagation: jasmine.createSpy('stopPropagation'),
        };
      });

      it('calls selectOption if "isOpen" attr is true ' +
      'and event.key is "Enter"', function () {
        viewModel.attr('isOpen', true);

        event.key = 'Enter';

        spyOn(viewModel, 'selectOption');

        handler(element, event);

        expect(viewModel.selectOption).toHaveBeenCalled();
      });

      it('calls highlightNext if "isOpen" attr is true ' +
      'and event.key is "ArrowDown"', function () {
        viewModel.attr('isOpen', true);

        event.key = 'ArrowDown';

        spyOn(viewModel, 'highlightNext');

        handler(element, event);

        expect(viewModel.highlightNext).toHaveBeenCalled();
      });

      it('calls highlightPrevious if "isOpen" attr is true ' +
      'and event.key is "ArrowUp"', function () {
        viewModel.attr('isOpen', true);

        event.key = 'ArrowUp';

        spyOn(viewModel, 'highlightPrevious');

        handler(element, event);

        expect(viewModel.highlightPrevious).toHaveBeenCalled();
      });

      it('calls processUserInput if "isOpen" attr is true ' +
      'and event.key passes regExp test', function () {
        viewModel.attr('isOpen', true);

        event.key = 'S';

        spyOn(viewModel, 'processUserInput');

        handler(element, event);

        expect(viewModel.processUserInput).toHaveBeenCalled();
      });

      it('does not call processUserInput if "isOpen" attr is true ' +
      'and event.key does not pass regExp test', function () {
        viewModel.attr('isOpen', true);

        event.key = 'Tab';

        spyOn(viewModel, 'processUserInput');

        handler(element, event);

        expect(viewModel.processUserInput).not.toHaveBeenCalled();
      });

      it('calls preventDefault and stopPropagation for any event.key ' +
      'if "isOpen" attr is true', function () {
        viewModel.attr('isOpen', true);

        event.key = 'Enter';

        handler(element, event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('does not call preventDefault and stopPropagation for any event.key ' +
      'if "isOpen" attr is false', function () {
        viewModel.attr('isOpen', false);

        event.key = 'Enter';

        handler(element, event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });
    });

    describe('".multiselect-dropdown__element mouseenter" handler',
      function () {
        let handler;
        let element;
        let event;

        beforeEach(function () {
          const visibleOptions = [
            {value: 'Assessment', checked: true},
            {value: 'Programs', checked: false},
          ];
          viewModel.attr('visibleOptions', visibleOptions);

          element = $('<li class="multiselect-dropdown__element"></li>');

          spyOn(viewModel, 'removeHighlight');
          spyOn(viewModel, 'highlightOption');

          handler = events['.multiselect-dropdown__element mouseenter']
            .bind({viewModel});
        });

        it('does not call removeHighlight and highlightOption ' +
        'if does not find option with "value" attr equal to ' +
        'event.currentTarget.innerText', function () {
          event = {
            currentTarget: {
              innerText: 'Active',
            },
          };

          handler(element, event);

          expect(viewModel.removeHighlight).not.toHaveBeenCalled();
          expect(viewModel.highlightOption).not.toHaveBeenCalled();
        });
      });
  });
});
