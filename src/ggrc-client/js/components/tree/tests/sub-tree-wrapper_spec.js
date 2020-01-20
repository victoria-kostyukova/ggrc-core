/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../sub-tree-wrapper';
import * as TreeViewUtils from '../../../plugins/utils/tree-view-utils';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('sub-tree-wrapper component', function () {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
    vm.getDepthFilter = function () {
      return '';
    };
  });

  describe('loadItems() method', function () {
    let method;
    beforeEach(function () {
      vm.attr('parent', {
        type: 'Foo',
        id: 13,
      });

      method = vm.loadItems.bind(vm);
    });

    it('doesnt call server-side if childModels not defined', function (done) {
      spyOn(TreeViewUtils, 'loadItemsForSubTier');

      method().then(function () {
        expect(TreeViewUtils.loadItemsForSubTier).not.toHaveBeenCalled();

        done();
      });
    });

    it('returns empty list', function (done) {
      vm.attr('childModels', ['a', 'b', 'c']);
      spyOn(TreeViewUtils, 'loadItemsForSubTier').and
        .returnValue($.Deferred().resolve({
          directlyItems: [],
          notDirectlyItems: [],
          showMore: false,
        }));

      method().then(function () {
        expect(vm.attr('loading')).toBeFalsy();
        expect(vm.attr('directlyItems').length).toEqual(0);
        expect(vm.attr('notDirectlyItems').length).toEqual(0);
        expect(vm.attr('showMore')).toBeFalsy();
        expect(vm.attr('dataIsReady')).toBeTruthy();
        expect(vm.attr('notResult')).toBeTruthy();

        done();
      });
    });

    it('returns valid data from server-side', function (done) {
      vm.attr('childModels', ['a', 'b', 'c']);
      spyOn(TreeViewUtils, 'loadItemsForSubTier').and
        .returnValue($.Deferred().resolve({
          directlyItems: [{id: 1}, {id: 2}, {id: 3}],
          notDirectlyItems: [{id: 4}, {id: 5}, {id: 6}, {id: 7}],
          showMore: false,
        }));

      method().then(function () {
        expect(vm.attr('loading')).toBeFalsy();
        expect(vm.attr('directlyItems').length).toEqual(3);
        expect(vm.attr('notDirectlyItems').length).toEqual(4);
        expect(vm.attr('showMore')).toBeFalsy();
        expect(vm.attr('dataIsReady')).toBeTruthy();
        expect(vm.attr('notResult')).toBeFalsy();

        done();
      });
    });
  });

  describe('refreshItems() method', () => {
    describe('when sub tree is open then', () => {
      beforeEach(function () {
        vm.attr('dataIsReady', true);
        vm.attr('isOpen', true);
      });

      it('loads items', function () {
        spyOn(vm, 'loadItems');
        vm.refreshItems();
        expect(vm.loadItems).toHaveBeenCalled();
      });
    });

    describe('when sub tree is closed then', () => {
      beforeEach(function () {
        vm.attr('dataIsReady', true);
        vm.attr('isOpen', false);
      });

      it('marks items in a way that they must be updated when sub tree will ' +
      'be opened next time', function () {
        vm.refreshItems();
        expect(vm.attr('dataIsReady')).toBe(false);
      });
    });
  });
});
