/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-custom-roles';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import DeferredTransaction from '../../../plugins/utils/deferred-transaction-utils';

describe('assessment-custom-roles component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('save() method', () => {
    let args;
    let instanceSave;

    beforeEach(() => {
      args = {};
      instanceSave = $.Deferred();
      vm.attr('instance', {
        save: () => instanceSave,
      });
      vm.attr('deferredSave', new DeferredTransaction((resolve, reject) => {
        vm.attr('instance').save().done(resolve).fail(reject);
      }, 0));
      spyOn(vm, 'filterACL');
    });

    describe('after getting response', () => {
      beforeEach(() => {
        spyOn(vm.attr('deferredSave'), 'push')
          .and.returnValue(instanceSave);
        instanceSave.resolve();
      });

      it('calls filterACL', (done) => {
        vm.save(args);

        instanceSave.then(() => {
          expect(vm.filterACL).toHaveBeenCalled();
          done();
        });
      });

      it('sets null to updatableGroupId attribute', (done) => {
        vm.save(args);

        instanceSave.then(() => {
          expect(vm.attr('updatableGroupId')).toBe(null);
          done();
        });
      });
    });

    it('pushes callback into deferredSave which sets updatableGroupId',
      (done) => {
        let pushSpy = spyOn(vm.attr('deferredSave'), 'push')
          .and.returnValue(instanceSave);
        args.groupId = 711;

        vm.save(args);
        pushSpy.calls.allArgs()[0][0]();
        expect(vm.attr('updatableGroupId')).toBe(args.groupId);
        done();
      });

    it('calls filterACL after save', (done) => {
      spyOn(vm.attr('deferredSave'), 'push')
        .and.returnValue(instanceSave.resolve());

      vm.save(args);

      instanceSave.then(() => {
        expect(vm.filterACL).toHaveBeenCalled();
        done();
      });
    });
  });
});
