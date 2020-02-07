/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../sub-tree-wrapper';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('sub-tree-wrapper component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
    vm.getDepthFilter = () => {
      return '';
    };
  });

  describe('loadItems() method', () => {
    let method;
    beforeEach(() => {
      vm.parent = {
        type: 'Foo',
        id: 13,
      };

      method = vm.loadItems.bind(vm);
    });

    it('doesnt call server-side if childModels not defined', (done) => {
      spyOn(TreeViewUtils, 'loadItemsForSubTier');

      method().then(() => {
        expect(TreeViewUtils.loadItemsForSubTier).not.toHaveBeenCalled();

        done();
      });
    });

    it('returns empty list', (done) => {
      vm.childModels = ['a', 'b', 'c'];
      spyOn(TreeViewUtils, 'loadItemsForSubTier').and
        .returnValue($.Deferred().resolve({
          directlyItems: [],
          notDirectlyItems: [],
          showMore: false,
        }));

      method().then(() => {
        expect(vm.loading).toBeFalsy();
        expect(vm.directlyItems.length).toEqual(0);
        expect(vm.notDirectlyItems.length).toEqual(0);
        expect(vm.showMore).toBeFalsy();
        expect(vm.dataIsReady).toBeTruthy();
        expect(vm.notResult).toBeTruthy();

        done();
      });
    });

    it('returns valid data from server-side', (done) => {
      vm.childModels = ['a', 'b', 'c'];
      spyOn(TreeViewUtils, 'loadItemsForSubTier').and
        .returnValue($.Deferred().resolve({
          directlyItems: [{id: 1}, {id: 2}, {id: 3}],
          notDirectlyItems: [{id: 4}, {id: 5}, {id: 6}, {id: 7}],
          showMore: false,
        }));

      method().then(() => {
        expect(vm.loading).toBeFalsy();
        expect(vm.directlyItems.length).toEqual(3);
        expect(vm.notDirectlyItems.length).toEqual(4);
        expect(vm.showMore).toBeFalsy();
        expect(vm.dataIsReady).toBeTruthy();
        expect(vm.notResult).toBeFalsy();

        done();
      });
    });
  });

  describe('refreshItems() method', () => {
    describe('when sub tree is open then', () => {
      beforeEach(() => {
        vm.dataIsReady = true;
        vm.isOpen = true;
      });

      it('loads items', () => {
        spyOn(vm, 'loadItems');
        vm.refreshItems();
        expect(vm.loadItems).toHaveBeenCalled();
      });
    });

    describe('when sub tree is closed then', () => {
      beforeEach(() => {
        vm.dataIsReady = true;
        vm.isOpen = false;
      });

      it('marks items in a way that they must be updated when sub tree will ' +
      'be opened next time', () => {
        vm.refreshItems();
        expect(vm.dataIsReady).toBe(false);
      });
    });
  });
});
