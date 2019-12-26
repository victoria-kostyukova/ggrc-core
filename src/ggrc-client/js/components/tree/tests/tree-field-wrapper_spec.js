/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tree-field-wrapper';

describe('tree-field-wrapper component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('refreshItems() method', () => {
    it('sets empty result when nothing is uploaded', () => {
      spyOn(vm, 'getItems').and.returnValue($.Deferred().resolve([]));
      vm.refreshItems();

      expect(vm.items.length).toBe(0);
    });
  });

  describe('getItems() method', () => {
    it('doesn\'t trigger \'loadItems\' for empty source', (done) => {
      vm.source = [];
      spyOn(vm, 'loadItems');
      vm.getItems().then((result) => {
        expect(result.length).toBe(0);
        expect(vm.loadItems).not.toHaveBeenCalled();
        done();
      });
    });

    it('doesn\'t trigger \'loadItems\' for not defined source', (done) => {
      vm.source = null;
      spyOn(vm, 'loadItems');
      vm.getItems().then((result) => {
        expect(result.length).toBe(0);
        expect(vm.loadItems).not.toHaveBeenCalled();
        done();
      });
    });

    it('triggers \'loadItems\' for items without required data', (done) => {
      let source = [{}, {}, {}];
      vm.source = source;
      spyOn(vm, 'loadItems')
        .and.returnValue($.Deferred().resolve(source));
      vm.getItems().then((result) => {
        expect(result.length).toBe(3);
        expect(vm.loadItems).toHaveBeenCalled();
        done();
      });
    });

    it('doesn\'t trigger \'loadItems\' for items with required data',
      (done) => {
        let source = [{email: 'foo'}, {email: 'bar'}, {email: 'baz'}];
        vm.field = 'email';
        vm.source = source;
        spyOn(vm, 'loadItems')
          .and.returnValue($.Deferred().resolve(source));
        vm.getItems().then((result) => {
          expect(result.length).toBe(source.length);
          expect(vm.loadItems).not.toHaveBeenCalled();
          done();
        });
      });
  });
});
