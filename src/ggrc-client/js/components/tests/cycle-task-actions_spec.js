/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import tracker from '../../tracker';
import * as WorkflowHelpers from '../../plugins/utils/workflow-utils';
import Component from '../cycle-task-actions/cycle-task-actions';
import {getComponentVM} from '../../../js_specs/spec-helpers';

describe('cycle-task-actions component', function () {
  'use strict';

  let vm;
  let fakeEvent;

  beforeEach(function () {
    vm = getComponentVM(Component);
    fakeEvent = {
      stopPropagation: jasmine.createSpy(),
    };
  });

  describe('changeStatus() method', function () {
    let changeStatus;
    let fakeElement;

    beforeEach(function () {
      spyOn(tracker, 'start').and.returnValue(() => {});

      vm.attr('oldValues', []);
      vm.attr('instance', {
        status: 'In Progress',
      });

      changeStatus = vm.changeStatus.bind(vm);

      fakeElement = document.createElement('div');
      fakeElement.dataset.value = 'Verified';
    });

    it('puts status and adds previous one for undo', async function (done) {
      spyOn(vm, 'setStatus').and.returnValue(Promise.resolve(true));

      await changeStatus(null, fakeElement, fakeEvent);
      expect(vm.attr('oldValues').length).toEqual(1);
      expect(vm.attr('oldValues')[0].status).toEqual('In Progress');
      expect(vm.setStatus).toHaveBeenCalledWith('Verified');
      done();
    });

    it('puts status, adds previous one for undo and fires "expand" event',
      async function (done) {
        spyOn(vm, 'setStatus').and.returnValue(Promise.resolve(true));

        await changeStatus(null, fakeElement, fakeEvent);
        expect(vm.attr('oldValues').length).toEqual(1);
        expect(vm.attr('oldValues')[0].status).toEqual('In Progress');
        expect(vm.setStatus).toHaveBeenCalledWith('Verified');
        done();
      }
    );

    it('doesn\'t change previous status if setStatus returned false',
      async function (done) {
        spyOn(vm, 'setStatus').and.returnValue(Promise.resolve(false));

        await changeStatus(null, fakeElement, fakeEvent);
        expect(vm.attr('oldValues').length).toEqual(0);
        expect(vm.setStatus).toHaveBeenCalledWith('Verified');
        done();
      });
  });

  describe('undo() method', function () {
    let undo;

    beforeEach(function () {
      spyOn(vm, 'setStatus');

      undo = vm.undo.bind(vm);
    });

    it('sets previous status', function () {
      vm.attr('oldValues', [{status: 'test'}]);

      undo(null, null, fakeEvent);

      expect(vm.setStatus).toHaveBeenCalledWith('test');
    });
  });

  describe('setStatus() method', () => {
    beforeEach(function () {
      vm.attr('instance', {});
      spyOn(WorkflowHelpers, 'updateStatus');
    });

    it('disables component before status updating', function () {
      vm.setStatus(status);
      expect(vm.attr('disabled')).toBe(true);
    });

    it('enables component after status updating', async function (done) {
      await vm.setStatus(status);
      expect(vm.attr('disabled')).toBe(false);
      done();
    });

    it('updates status for cycle task', async function (done) {
      const status = 'New State';
      await vm.setStatus(status);
      expect(WorkflowHelpers.updateStatus).toHaveBeenCalledWith(
        vm.attr('instance'),
        status
      );
      done();
    });
  });
});
