/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../autocomplete-dropdown';

describe('autocomplete-dropdown component', () => {
  let options;
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
    options = [{value: 'TiTle'}, {value: 'code'}, {value: 'STATE'}];
  });

  describe('isEmpty variable', () => {
    it('is set to false if "filteredOptions" list is not empty', () => {
      viewModel.attr('filteredOptions', [1, 2]);

      expect(viewModel.attr('isEmpty')).toBe(false);
    });

    it('is set to true if "filteredOptions" list is empty', () => {
      viewModel.attr('filteredOptions', []);

      expect(viewModel.attr('isEmpty')).toBe(true);
    });
  });

  describe('initOptions() method', () => {
    it('sets "filteredOptions" to original list from "options" attr', () => {
      viewModel.attr('filteredOptions', []);
      viewModel.attr('options', options);

      viewModel.initOptions();

      expect(viewModel.attr('filteredOptions')).toBe(viewModel.attr('options'));
    });
  });

  describe('filterOptions() method', () => {
    it('sets "filteredOptions" to list filtered by passed value', () => {
      let item = {
        val: jasmine.createSpy().and.returnValue('t'),
      };
      viewModel.attr('filteredOptions', []);
      viewModel.attr('options', options);

      viewModel.filterOptions(item);

      expect(viewModel.attr('filteredOptions').length).toBe(2);
    });
  });

  describe('openDropdown() method', () => {
    it('sets "canOpen" to true', () => {
      viewModel.attr('canOpen', false);

      viewModel.openDropdown(event);

      expect(viewModel.attr('canOpen')).toBe(true);
    });
  });

  describe('closeDropdown() method', () => {
    it('sets "isOpen" to false', () => {
      viewModel.attr('isOpen', true);

      viewModel.closeDropdown(event);

      expect(viewModel.attr('isOpen')).toBe(false);
    });

    it('sets "canOpen" to false', () => {
      viewModel.attr('canOpen', true);

      viewModel.closeDropdown(event);

      expect(viewModel.attr('canOpen')).toBe(false);
    });
  });

  describe('changeOpenCloseState() method', () => {
    it('sets "isOpen" to true if "canOpen" equals "true"', () => {
      viewModel.attr('isOpen', false);
      viewModel.attr('canOpen', true);

      viewModel.changeOpenCloseState(event);

      expect(viewModel.attr('isOpen')).toBe(true);
    });

    it('doesn\'t change "isOpen" value if "canOpen" equals "false"', () => {
      viewModel.attr('isOpen', false);
      viewModel.attr('canOpen', false);

      viewModel.changeOpenCloseState(event);

      expect(viewModel.attr('isOpen')).toBe(false);
    });

    it('sets "canOpen" to false', () => {
      viewModel.attr('canOpen', true);

      viewModel.changeOpenCloseState(event);

      expect(viewModel.attr('canOpen')).toBe(false);
    });

    it('calles "initOptions" method on opening dropdown', () => {
      viewModel.attr('isOpen', false);
      viewModel.attr('canOpen', true);
      spyOn(viewModel, 'initOptions');

      viewModel.changeOpenCloseState(event);

      expect(viewModel.initOptions).toHaveBeenCalled();
    });

    it('calles "closeDropdown" method selecting dropdown value', () => {
      viewModel.attr('isOpen', true);
      spyOn(viewModel, 'closeDropdown');

      viewModel.changeOpenCloseState(event);

      expect(viewModel.closeDropdown).toHaveBeenCalled();
    });
  });

  describe('onChange() method', () => {
    it('sets "value" to selected item value', () => {
      viewModel.attr('value', 'Title');
      let item = {value: 'Code'};

      viewModel.onChange(item);

      expect(viewModel.attr('value')).toBe(item.value);
    });
  });

  describe('"{window} click" handler', () => {
    let event;

    beforeAll(() => {
      let events = Component.prototype.events;
      event = events['{window} click'].bind({viewModel});
    });

    it('calls "changeOpenCloseState" method if click outside dropdown', () => {
      spyOn(viewModel, 'changeOpenCloseState');

      event();

      expect(viewModel.changeOpenCloseState).toHaveBeenCalled();
    });
  });
});
