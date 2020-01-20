/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../js_specs/spec-helpers';
import component from '../people-autocomplete-dropdown/people-autocomplete-dropdown';

describe('people-autocomplete-dropdown component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(component);
  });

  describe('showResults setter', () => {
    let addEventListenerSpy;
    let removeEventListenerSpy;

    beforeEach(() => {
      addEventListenerSpy = spyOn(window, 'addEventListener');
      removeEventListenerSpy = spyOn(window, 'removeEventListener');
    });

    it('adds event listener for click event when set to true', () => {
      vm.attr('showResults', true);
      expect(addEventListenerSpy)
        .toHaveBeenCalledWith('click', vm.boundOnWindowClick);
    });

    it('removes event listener for click event when set to false', () => {
      vm.attr('showResults', false);
      expect(removeEventListenerSpy)
        .toHaveBeenCalledWith('click', vm.boundOnWindowClick);
    });

    it('sets new value', () => {
      vm.attr('showResults', true);
      expect(vm.attr('showResults')).toBe(true);
      vm.attr('showResults', false);
      expect(vm.attr('showResults')).toBe(false);
    });
  });

  describe('onWindowClick() method', () => {
    it('sets showResults to false', () => {
      vm.attr('showResults', true);
      vm.onWindowClick();
      expect(vm.attr('showResults')).toBe(false);
    });
  });

  describe('personSelected() method', () => {
    it('sets showResults to false', () => {
      vm.attr('showResults', true);
      vm.personSelected({});
      expect(vm.attr('showResults')).toBe(false);
    });

    it('resets currentValue', () => {
      vm.attr('currentValue', 'someone@example.com');
      vm.personSelected({});
      expect(vm.attr('currentValue')).toBe(null);
    });
  });
});
