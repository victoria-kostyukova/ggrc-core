/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canMap from 'can-map';
import Component from './assessment-template-clone';
import * as AjaxUtils from '../../plugins/ajax_extensions';

describe('assessment-template-clone component', () => {
  let events;

  beforeAll(() => {
    events = Component.prototype.events;
  });

  describe('events', () => {
    let handler;
    let vm;

    describe('inserted handler', () => {
      beforeEach(() => {
        vm = new canMap({
          onSubmit: jasmine.createSpy(),
        });
        handler = events.inserted.bind({viewModel: vm});
      });

      it('calls onSubmit()', () => {
        handler();
        expect(vm.onSubmit).toHaveBeenCalled();
      });
    });

    describe('closeModal handler', () => {
      let el;
      let modalDismiss;

      beforeEach(() => {
        modalDismiss = {
          trigger: jasmine.createSpy(),
        };
        el = {
          find: () => modalDismiss,
        };

        handler = events.closeModal.bind({element: el});
      });

      it('triggers click event on element with "modal-dismiss" class', () => {
        handler();
        expect(modalDismiss.trigger).toHaveBeenCalledWith('click');
      });
    });

    describe('"{window} preload" handler', () => {
      let that;
      let ev;
      let $target;
      let spy;

      beforeEach(() => {
        $target = $('<div></div>');
        $('body').append($target);

        spy = spyOn($.fn, 'data');
        that = {
          closeModal: jasmine.createSpy(),
        };
        ev = {target: $target};

        handler = events['{window} preload'].bind(that);
      });

      afterEach(() => {
        $target.remove();
      });

      it('calls closeModal handler if modal is in cloner', () => {
        spy.and.returnValue({
          options: {
            inCloner: true,
          },
        });
        handler({}, ev);
        expect(that.closeModal).toHaveBeenCalled();
      });

      it('does not call closeModal handler if modal is not in cloner', () => {
        spy.and.returnValue({
          options: {},
        });
        handler({}, ev);
        expect(that.closeModal).not.toHaveBeenCalled();
      });
    });

    describe('".btn-cancel click" handler', () => {
      let that;

      beforeEach(() => {
        that = {
          closeModal: jasmine.createSpy(),
        };

        handler = events['.btn-cancel click'].bind(that);
      });

      it('calls closeModal()', () => {
        handler();
        expect(that.closeModal).toHaveBeenCalled();
      });
    });

    describe('".btn-clone click" handler', () => {
      let that;
      let vm;
      let dfd;

      beforeEach(() => {
        vm = new canMap();
        spyOn(vm, 'dispatch');
        dfd = new $.Deferred();
        that = {
          viewModel: vm,
          closeModal: jasmine.createSpy(),
          cloneObjects: jasmine.createSpy().and.returnValue(dfd),
        };

        handler = events['.btn-clone click'].bind(that);
      });

      it('sets true to viewModel.is_saving attribute', () => {
        vm.attr('is_saving', false);
        handler();
        expect(vm.attr('is_saving')).toBe(true);
      });

      it('calls cloneObjects()', () => {
        handler();
        expect(that.cloneObjects).toHaveBeenCalled();
      });

      describe('in case of success', () => {
        beforeEach(() => {
          dfd.resolve();
        });

        it('sets false to viewModel.is_saving attribute', (done) => {
          that.viewModel.attr('is_saving', true);
          handler();

          dfd.done(() => {
            expect(that.viewModel.attr('is_saving')).toBe(false);
            done();
          });
        });

        it('calls closeModal()', (done) => {
          handler();

          dfd.done(() => {
            expect(that.closeModal).toHaveBeenCalled();
            done();
          });
        });

        it('dispatches "refreshTreeView" event', (done) => {
          handler();

          dfd.done(() => {
            expect(vm.dispatch).toHaveBeenCalledWith('refreshTreeView');
            done();
          });
        });
      });

      describe('in case of fail', () => {
        beforeEach(() => {
          dfd.reject();
        });

        it('sets false to viewModel.is_saving attribute', (done) => {
          that.viewModel.attr('is_saving', true);
          handler();
          dfd.fail(() => {
            expect(that.viewModel.attr('is_saving')).toBe(false);
            done();
          });
        });
      });
    });

    describe('cloneObjects handler', () => {
      let vm;
      let expectedResult;

      beforeEach(() => {
        vm = new canMap({
          selected: [{id: 1}, {id: 2}, {id: 3}],
          join_object_id: 321,
        });
        expectedResult = 'mockDfd';
        spyOn(AjaxUtils, 'ggrcPost').and.returnValue(expectedResult);
        handler = events.cloneObjects.bind({viewModel: vm});
      });

      it('returns response of post request for clone', () => {
        let expectedArguments = [{
          sourceObjectIds: loMap(vm.attr('selected'), (item) => item.id),
          destination: {
            type: 'Audit',
            id: vm.attr('join_object_id'),
          },
        }];
        expect(handler()).toBe(expectedResult);
        expect(AjaxUtils.ggrcPost).toHaveBeenCalledWith(
          '/api/assessment_template/clone',
          expectedArguments
        );
      });
    });
  });
});
