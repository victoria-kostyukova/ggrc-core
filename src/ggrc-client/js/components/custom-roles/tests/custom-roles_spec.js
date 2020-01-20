/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import ViewModel from '../custom-roles-vm';
import Program from '../../../models/business-models/program';
import Assessment from '../../../models/business-models/assessment';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';

describe('custom-roles view model', () => {
  let vm;
  let instance;

  beforeEach(() => {
    vm = new ViewModel();
  });

  describe('isReadonly prop', () => {
    it('returns false if there is no instance', () => {
      let falseInstances = [null, undefined, '', 0, false, NaN];

      falseInstances.forEach((instance) => {
        vm.attr('instance', instance);
        expect(vm.attr('isReadonly')).toBe(false);
      });
    });

    it('returns false if instance is defined, isProposable is false and ' +
    'readonly is false',
    () => {
      instance = makeFakeInstance({model: Assessment})({
        readonly: false,
      });
      vm.attr('instance', instance);
      vm.attr('readOnly', false);

      expect(vm.attr('isReadonly')).toBe(false);
    });

    it('returns true if instance is defined, isProposable is true and ' +
    'readonly is false',
    () => {
      instance = makeFakeInstance({model: Program})({
        readonly: false,
      });
      vm.attr('instance', instance);
      vm.attr('readOnly', false);

      expect(vm.attr('isReadonly')).toBe(true);
    });

    it('returns true if instance is defined, isProposable is false and ' +
    'readonly is true',
    () => {
      instance = makeFakeInstance({model: Assessment})({
        readonly: true,
      });
      vm.attr('instance', instance);
      vm.attr('readOnly', false);
      expect(vm.attr('isReadonly')).toBe(true);
    });

    it('returns true if instance is defined, isProposable is false, ' +
    'readonly is false and component readOnly is true',
    () => {
      instance = makeFakeInstance({model: Assessment})({
        readonly: false,
      });
      vm.attr('instance', instance);
      vm.attr('readOnly', true);
      expect(vm.attr('isReadonly')).toBe(true);
    });
  });

  describe('filterACL() method', () => {
    let acl;

    beforeEach(() => {
      vm.attr('instance', {});
    });

    it('replaces access_control_list of instance ' +
    'excluding elements without id', () => {
      acl = [{id: 123}, {}, {id: 321}];

      vm.attr('instance.access_control_list', acl);
      vm.filterACL();

      expect(vm.attr('instance.access_control_list').serialize())
        .toEqual(acl.filter((role) => role.id));
    });
  });

  describe('save() method', () => {
    let args;
    let saveDfd;

    beforeEach(() => {
      args = {};
      saveDfd = new $.Deferred();
      vm.attr('instance', {
        save: jasmine.createSpy().and.returnValue(saveDfd),
      });
      spyOn(vm.attr('instance'), 'dispatch');
    });

    it('sets groupId of args to updatableGroupId attribute', () => {
      vm.attr('updatableGroupId', null);
      args.groupId = 123;
      vm.save(args);
      expect(vm.attr('updatableGroupId')).toBe(args.groupId);
    });

    describe('after getting response', () => {
      beforeEach(() => {
        saveDfd.resolve();
        spyOn(vm, 'filterACL');
      });

      it('calls filterACL', (done) => {
        vm.save(args).then(() => {
          expect(vm.filterACL).toHaveBeenCalled();
          done();
        });
      });

      it('sets null to updatableGroupId attribute', (done) => {
        vm.save(args).then(() => {
          expect(vm.attr('updatableGroupId')).toBe(null);
          done();
        });
      });
    });
  });
});
