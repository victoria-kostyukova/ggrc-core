/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../three-dots-menu';

describe('three-dots-menu component', function () {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
  });

  describe('manageEmptyList() method', function () {
    let menuNode;

    it('sets disabled field to true if the menu node does not contain <li>',
      function () {
        menuNode = $(`
          <ul role="menu">
            <empty-component></empty-component>
          </ul>`);
        vm.manageEmptyList(menuNode);
        expect(vm.attr('disabled')).toBe(true);
      });

    it('sets disabled field to false if the menu node contains <li>',
      function () {
        menuNode = $(`
          <ul role="menu">
            <not-empty-component>
              <li>123</li>
            </not-empty-component>
          </ul>`);
        vm.manageEmptyList(menuNode);
        expect(vm.attr('disabled')).toBe(false);
      });
  });

  describe('mutationCallback() method', function () {
    let mutationList;

    beforeEach(function () {
      mutationList = [];
    });

    it('calls manageEmptyList method for each mutation with passed menu node',
      function () {
        spyOn(vm, 'manageEmptyList');

        mutationList.push(
          {target: {}},
          {target: {}}
        );
        vm.mutationCallback(mutationList);

        mutationList.forEach((mutation) => {
          const menuNode = mutation.target;
          expect(vm.manageEmptyList).toHaveBeenCalledWith(menuNode);
        });
      });
  });

  describe('initObserver() method', function () {
    let element;

    beforeEach(function () {
      [element] = $('<ul role="menu"></ul>');
    });

    it('sets observer field to the new instance of MutationObserver object',
      function () {
        vm.initObserver(element);
        expect(vm.attr('observer')).toEqual(jasmine.any(MutationObserver));
      });

    describe('calls observe method which', function () {
      let observer;

      beforeEach(function () {
        observer = {
          observe: jasmine.createSpy('observe'),
        };
        spyOn(window, 'MutationObserver').and.returnValue(observer);
      });

      it('observes passed menu node', function () {
        const MENU_NODE_ARG_ORDER = 0;
        vm.initObserver(element);
        expect(observer.observe.calls.argsFor(0)[MENU_NODE_ARG_ORDER])
          .toBe(element);
      });

      it('watches only childList changes', function () {
        const CONFIG_ARG_ORDER = 1;
        const expectedConfig = {childList: true};
        vm.initObserver(element);
        expect(observer.observe.calls.argsFor(0)[CONFIG_ARG_ORDER])
          .toEqual(expectedConfig);
      });
    });
  });

  describe('events scope', () => {
    let events;
    let eventsContext;

    beforeEach(function () {
      events = Component.prototype.events;
      eventsContext = {
        viewModel: vm,
      };
    });

    describe('inserted() event', function () {
      let method;
      let $element;

      beforeEach(function () {
        $element = $(
          `<div>
            <ul role="menu"></ul>
          </div>`
        );
      });

      beforeEach(function () {
        method = events.inserted.bind(eventsContext);
      });

      it('calls viewModel.initObserver() method with passed menu node',
        function () {
          const [menuNode] = $element.find('[role=menu]');
          spyOn(vm, 'initObserver');
          method($element);
          expect(vm.initObserver).toHaveBeenCalledWith(menuNode);
        });

      it('calls viewModel.manageEmptyList() method with passed menu node',
        function () {
          const [menuNode] = $element.find('[role=menu]');
          spyOn(vm, 'manageEmptyList');
          method($element);
          expect(vm.manageEmptyList).toHaveBeenCalledWith(menuNode);
        });
    });

    describe('removed() event', function () {
      let method;

      beforeEach(function () {
        method = events.removed.bind(eventsContext);
      });

      it('calls disconnect method for observer field', function () {
        const observer = {
          disconnect: jasmine.createSpy('disconnect'),
        };
        vm.attr('observer', observer);
        method();
        expect(observer.disconnect).toHaveBeenCalled();
      });
    });
  });
});
