/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../read-more';

describe('read-more component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('toggle() method', () => {
    let eventMock;

    beforeEach(() => {
      eventMock = {
        stopPropagation: jasmine.createSpy(),
      };
    });

    it('calls stopPropagation()', () => {
      vm.toggle(eventMock);

      expect(eventMock.stopPropagation).toHaveBeenCalled();
    });

    it('switchs expanded attribute', () => {
      vm.attr('expanded', true);
      vm.toggle(eventMock);

      expect(vm.attr('expanded')).toBe(false);
      vm.toggle(eventMock);

      expect(vm.attr('expanded')).toBe(true);
    });
  });
  describe('set() of cssClass attribute', () => {
    it('returns empty string if viewModel.expanded is true', () => {
      vm.attr('expanded', true);
      expect(vm.attr('cssClass')).toEqual('');
    });
    it('returns specific css string ' +
    'if viewModel.expanded is false', () => {
      for (let i; i <= 10; i++) {
        vm.attr('maxLinesNumber', i);
        expect(vm.attr('cssClass')).toEqual('ellipsis-truncation-' + i);
      }
    });
  });

  describe('init() event', () => {
    let OriginalObserver;
    let init;
    const element = `
      <div>
        parent
        <span> child </span>
      </div>
    `;

    const FakeIntersectionObserver = class FakeIntersectionObserver {
      constructor(callback) {
        this.callback = callback;
      }
      observe() {
      }
      unobserve() {
      }
    };

    beforeAll(() => {
      OriginalObserver = window.IntersectionObserver;
      window.IntersectionObserver = FakeIntersectionObserver;
    });

    afterAll(() => {
      window.IntersectionObserver = OriginalObserver;
    });

    beforeEach(() => {
      spyOn(vm, 'updateOverflowing');

      init = Component.prototype.init.bind(
        {
          viewModel: vm,
        },
        element
      );
    });

    describe('should call IntersectionObserver.observe when ' +
    'viewModel.isLazyRender is true', () => {
      beforeEach(() => {
        vm.attr('isLazyRender', true);
      });

      it('with child element', () => {
        spyOn(IntersectionObserver.prototype, 'observe');

        init();

        expect(IntersectionObserver.prototype.observe)
          .toHaveBeenCalledWith($(element).children()[0]);
      });

      it('and callback should call IntersectionObserver.unobserve when ' +
      'callback\'s arg has "isIntersecting" with "true" value', () => {
        spyOn(IntersectionObserver.prototype, 'observe')
          .and.callFake(function () {
            this.callback([{isIntersecting: true}]);
          });
        spyOn(IntersectionObserver.prototype, 'unobserve');

        init();
        expect(IntersectionObserver.prototype.unobserve).toHaveBeenCalled();
      });

      it('and callback should call viewModel.updateOverflowing when ' +
      'callback\'s arg has "isIntersecting" with "true" value', () => {
        spyOn(IntersectionObserver.prototype, 'observe')
          .and.callFake(function () {
            this.callback([{isIntersecting: true}]);
          });
        spyOn(IntersectionObserver.prototype, 'unobserve');

        init();
        expect(vm.updateOverflowing).toHaveBeenCalledWith(element);
      });

      it('and callback should NOT call IntersectionObserver.unobserve when ' +
      'callback\'s arg doesn\'t have "isIntersecting" with "true" value',
      () => {
        spyOn(IntersectionObserver.prototype, 'observe')
          .and.callFake(function () {
            this.callback([{isIntersecting: false}]);
          });
        spyOn(IntersectionObserver.prototype, 'unobserve');

        init();
        expect(IntersectionObserver.prototype.unobserve).not.toHaveBeenCalled();
      });

      it('and callback should NOT call viewModel.updateOverflowing when ' +
      'callback\'s arg doesn\'t have "isIntersecting" with "true" value',
      () => {
        spyOn(IntersectionObserver.prototype, 'observe')
          .and.callFake(function () {
            this.callback([{isIntersecting: false}]);
          });
        spyOn(IntersectionObserver.prototype, 'unobserve');

        init();
        expect(vm.updateOverflowing).not.toHaveBeenCalled();
      });
    });

    it('should NOT call IntersectionObserver.observe when ' +
    'viewModel.isLazyRender is false', () => {
      vm.attr('isLazyRender', false);
      spyOn(IntersectionObserver.prototype, 'observe');

      init();

      expect(IntersectionObserver.prototype.observe).not.toHaveBeenCalled();
    });
  });
});
