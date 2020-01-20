/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../js_specs/spec-helpers';
import component from './person-autocomplete-field';

describe('person-autocomplete-field', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(component);
  });

  describe('personSelected() method', () => {
    let person;

    beforeEach(() => {
      person = {email: 'someone@example.com', name: 'someone'};
    });

    it('sets person email', () => {
      vm.attr('personEmail', '');
      vm.personSelected({person});
      expect(vm.attr('personEmail')).toBe('someone@example.com');
    });

    it('sets person name', () => {
      vm.attr('personName', '');
      vm.personSelected({person});
      expect(vm.attr('personName')).toBe('someone');
    });
  });

  describe('onKeyDown() method', () => {
    let event;

    beforeEach(() => {
      event = {
        preventDefault() {
        },
      };
    });

    it('prevents default browser behavior when arrow is clicked', () => {
      const preventDefaultSpy = spyOn(event, 'preventDefault');
      vm.onKeyDown({...event, code: 'ArrowUp'});
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('calls onActionKey with event.keyCode when special key is clicked',
      () => {
        const onActionKeySpy = spyOn(vm, 'onActionKey');
        vm.onKeyDown({...event, code: 'ArrowUp', keyCode: 12345});
        expect(onActionKeySpy).toHaveBeenCalledWith(12345);
      });
  });

  describe('onKeyUp() method', () => {
    let event;

    beforeEach(() => {
      event = {target: {value: 'someone@example.com'}};
    });

    it('sets personEmail to the event target value', () => {
      vm.attr('personEmail', '');
      vm.onKeyUp(event);
      expect(vm.attr('personEmail')).toBe('someone@example.com');
    });

    it('sets searchValue to the event target value if you type char', () => {
      vm.attr('searchValue', '');
      vm.onKeyUp(event);
      expect(vm.attr('searchValue')).toBe('someone@example.com');
    });

    it('doesn\'t set searchValue to the event target value if you '
      + 'click dropdown navigation key', () => {
      vm.attr('searchValue', '');
      vm.onKeyUp({...event, code: 'ArrowDown'});
      expect(vm.attr('searchValue')).toBe('');
    });

    it('dispatches keyUp event with original key, code and keyCode', (done) => {
      vm.bind('keyUp', (localEvent) => {
        expect(localEvent.key).toBe(1);
        expect(localEvent.code).toBe(2);
        expect(localEvent.keyCode).toBe(3);
        done();
      });
      vm.onKeyUp({...event, key: 1, code: 2, keyCode: 3});
    });
  });
});
