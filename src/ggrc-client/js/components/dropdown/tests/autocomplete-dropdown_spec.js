/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../autocomplete-dropdown';

describe('autocomplete-dropdown component', () => {
  'use strict';

  let options;
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
    options = [{value: 'TiTle'}, {value: 'code'}, {value: 'STATE'}];
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

  describe('openCloseDropdown() method', () => {
    let event;

    beforeEach(function () {
      event = jasmine.createSpyObj(['stopPropagation']);
    });

    it('sets "isOpen" to true if component is not opened yet', () => {
      viewModel.attr('isDisabled', false);
      viewModel.attr('isOpen', false);

      viewModel.openCloseDropdown(event);

      expect(viewModel.attr('isOpen')).toBe(true);
    });

    it('sets "isOpen" to false if component is already opened', () => {
      viewModel.attr('isDisabled', false);
      viewModel.attr('isOpen', true);

      viewModel.openCloseDropdown(event);

      expect(viewModel.attr('isOpen')).toBe(false);
    });

    it('doesn\'t change "isOpen" if "isDisabled" is true', () => {
      viewModel.attr('isDisabled', true);
      viewModel.attr('isOpen', false);

      viewModel.openCloseDropdown(event);

      expect(viewModel.attr('isOpen')).toBe(false);
    });

    it('calles "initOptions" method on opening dropdown', () => {
      viewModel.attr('isDisabled', false);
      spyOn(viewModel, 'initOptions');

      viewModel.openCloseDropdown(event);

      expect(viewModel.initOptions).toHaveBeenCalled();
    });
  });

  describe('onChange() method', () => {
    it('sets "value" to selected item value', () => {
      viewModel.attr('value', 'Title');
      let item = {value: 'Code'};

      viewModel.onChange(item);

      expect(viewModel.attr('value')).toBe(item.value);
    });

    it('sets "isOpen" to false', () => {
      viewModel.attr('isOpen', true);

      viewModel.onChange({});

      expect(viewModel.attr('isOpen')).toBe(false);
    });
  });

  describe('"{window} click" handler', () => {
    let event;

    beforeAll(() => {
      let events = Component.prototype.events;
      event = events['{window} click'].bind({viewModel});
    });

    it('sets "isOpen" to false if click outside dropdown', () => {
      viewModel.attr('isOpen', true);

      event();

      expect(viewModel.attr('isOpen')).toBe(false);
    });
  });
});
