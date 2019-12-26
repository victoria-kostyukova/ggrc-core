/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import tracker from '../../tracker';
import * as WorkflowHelpers from '../../plugins/utils/workflow-utils';
import Component from '../cycle-task-actions/cycle-task-actions';
import {getComponentVM} from '../../../js_specs/spec-helpers';

describe('cycle-task-actions component', () => {
  let vm;
  let fakeEvent;

  beforeEach(() => {
    vm = getComponentVM(Component);
    fakeEvent = {
      stopPropagation: jasmine.createSpy(),
    };
  });

  describe('changeStatus() method', () => {
    let changeStatus;
    let fakeElement;

    beforeEach(() => {
      spyOn(tracker, 'start').and.returnValue(() => {});

      vm.oldValues = [];
      vm.instance = new canMap({
        status: 'In Progress',
      });

      changeStatus = vm.changeStatus.bind(vm);

      fakeElement = document.createElement('div');
      fakeElement.dataset.value = 'Verified';
    });

    it('puts status and adds previous one for undo', async (done) => {
      spyOn(vm, 'setStatus')
        .and.returnValue(Promise.resolve(true));

      await changeStatus(null, fakeElement, fakeEvent);
      expect(vm.oldValues.length).toEqual(1);
      expect(vm.oldValues[0].status).toEqual('In Progress');
      expect(vm.setStatus).toHaveBeenCalledWith('Verified');
      done();
    });

    it('puts status, adds previous one for undo and fires "expand" event',
      async (done) => {
        spyOn(vm, 'setStatus')
          .and.returnValue(Promise.resolve(true));

        await changeStatus(null, fakeElement, fakeEvent);
        expect(vm.oldValues.length).toEqual(1);
        expect(vm.oldValues[0].status).toEqual('In Progress');
        expect(vm.setStatus).toHaveBeenCalledWith('Verified');
        done();
      }
    );

    it('doesn\'t change previous status if setStatus returned false',
      async (done) => {
        spyOn(vm, 'setStatus')
          .and.returnValue(Promise.resolve(false));

        await changeStatus(null, fakeElement, fakeEvent);
        expect(vm.oldValues.length).toEqual(0);
        expect(vm.setStatus).toHaveBeenCalledWith('Verified');
        done();
      });
  });

  describe('undo() method', () => {
    let undo;

    beforeEach(() => {
      spyOn(vm, 'setStatus');

      undo = vm.undo.bind(vm);
    });

    it('sets previous status', () => {
      vm.oldValues = [{status: 'test'}];

      undo(null, null, fakeEvent);

      expect(vm.setStatus).toHaveBeenCalledWith('test');
    });
  });

  describe('setStatus() method', () => {
    beforeEach(() => {
      vm.instance = new canMap({});
      spyOn(WorkflowHelpers, 'updateStatus');
    });

    it('disables component before status updating', () => {
      vm.setStatus(status);
      expect(vm.disabled).toBe(true);
    });

    it('enables component after status updating', async (done) => {
      await vm.setStatus(status);
      expect(vm.disabled).toBe(false);
      done();
    });

    it('updates status for cycle task', async (done) => {
      const status = 'New State';
      await vm.setStatus(status);
      expect(WorkflowHelpers.updateStatus).toHaveBeenCalledWith(
        vm.instance,
        status
      );
      done();
    });
  });
});
