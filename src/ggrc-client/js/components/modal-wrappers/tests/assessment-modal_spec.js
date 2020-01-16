/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import Component from '../assessment-modal';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as AclUtils from '../../../plugins/utils/acl-utils';
import Assessment from '../../../models/business-models/assessment';

describe('<assessment-modal/> component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);

    spyOn(SnapshotUtils, 'toObject').and.returnValue({
      title: 'Foo',
      description: 'Bar',
      originalLink: 'Baz',
    });
  });

  describe('loadData() method', () => {
    it('sets the correct data to mappingsList field', (done) => {
      let model = makeFakeInstance({model: Assessment})();

      spyOn(model, 'getRelatedObjects').and
        .returnValue($.Deferred().resolve({
          Snapshot: [{}, {}, {}],
        }));

      vm.attr('instance', model);
      vm.attr('mappingsList', []);

      vm.loadData().then(() => {
        expect(vm.attr('mappingsList').length).toBe(3);

        done();
      });
    });
  });

  describe('isTrackedPropertiesChanged() method', () => {
    let instance;
    let backupInstance;

    beforeEach(() => {
      instance = makeFakeInstance({model: Assessment})();
      vm.attr('instance', instance);
      backupInstance = makeFakeInstance({model: Assessment})();
      vm.attr('backupInstance', backupInstance);
    });

    it('calls buildAclRoles()', () => {
      vm.attr('instance.access_control_list', ['p1']);
      vm.attr('backupInstance.access_control_list', ['p1', 'p2']);
      spyOn(vm, 'buildAclRoles');

      vm.isTrackedPropertiesChanged();

      expect(vm.buildAclRoles).toHaveBeenCalledTimes(2);
      expect(vm.buildAclRoles.calls.argsFor(0)[0]).toEqual(['p1']);
      expect(vm.buildAclRoles.calls.argsFor(1)[0]).toEqual(['p1', 'p2']);
    });

    it('returns false if instance and backupInstance tracked properties ' +
    'are equal', () => {
      spyOn(vm, 'buildAclRoles').and.returnValue(['p1']);

      expect(vm.isTrackedPropertiesChanged()).toBe(false);
    });

    it('returns true if instance and backupInstance tracked properties ' +
    'are not equal', () => {
      vm.attr('instance.fakeProperty', 'fakeValue');
      spyOn(vm, 'buildAclRoles').and.returnValue(['p1']);

      expect(vm.isTrackedPropertiesChanged()).toBe(true);
    });
  });

  describe('buildAclRoles() method', () => {
    it('returns built roles', () => {
      const roles = [{
        ac_role_id: 123,
      }, {
        ac_role_id: 72,
        person: {
          id: 1001,
        },
      }, {
        ac_role_id: 72,
        person: {
          id: 101,
        },
      }];

      spyOn(AclUtils, 'getRoleById')
        .withArgs(123)
        .and.returnValue({
          name: 'CustomRole',
        })
        .withArgs(72)
        .and.returnValue({
          name: 'Creators',
        });

      expect(vm.buildAclRoles(roles)).toEqual([{
        roleId: '72',
        peopleIds: [101, 1001],
      }]);
    });
  });

  describe('events', () => {
    let events;
    let handler;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('inserted handler', () => {
      let instance;

      beforeEach(() => {
        instance = makeFakeInstance({model: Assessment})();
        vm.attr('instance', instance);
        spyOn(vm, 'loadData');

        handler = events.inserted.bind({viewModel: vm});
      });

      it('calls loadData() if it is not new instance', () => {
        vm.attr('isNewInstance', false);

        handler();
        expect(vm.loadData).toHaveBeenCalled();
      });

      it('does not call loadData() if it is new instance', () => {
        vm.attr('isNewInstance', true);

        handler();
        expect(vm.loadData).not.toHaveBeenCalled();
      });

      it('saves instance in backupInstance attr', () => {
        handler();
        expect(vm.attr('backupInstance').attr())
          .toEqual(vm.attr('instance').attr());
      });

      it('sets isInserted attr to true', () => {
        vm.attr('isInserted', false);

        handler();
        expect(vm.attr('isInserted')).toBe(true);
      });
    });

    describe('{viewModel.instance} change handler', () => {
      let instance;

      beforeEach(() => {
        instance = makeFakeInstance({model: Assessment})();
        vm.attr('instance', instance);
        vm.attr('showStatusChangeMessage', false);
        spyOn(vm, 'isTrackedPropertiesChanged').and.returnValue(true);

        handler = events['{viewModel.instance} change'].bind({
          viewModel: vm,
        });
      });

      it('sets showStatusChangeMessage attr ' +
      'to results of isTrackedPropertiesChanged() ' +
      'call if it is not new instance, it is already inserted and ' +
      'instance in one of the done statuses',
      () => {
        vm.attr('instance.status', 'Completed');
        vm.attr('isNewInstance', false);
        vm.attr('isInserted', true);

        handler();
        expect(vm.attr('showStatusChangeMessage')).toBe(true);
      });

      it('does not update showStatusChangeMessage attr '
      + 'if it is new instance', () => {
        vm.attr('isNewInstance', true);
        vm.attr('isInserted', true);
        vm.attr('instance.status', 'Completed');

        handler();
        expect(vm.attr('showStatusChangeMessage')).toBe(false);
      });

      it('does not update showStatusChangeMessage attr ' +
      'if it is not inserted', () => {
        vm.attr('isInserted', false);
        vm.attr('isNewInstance', false);
        vm.attr('instance.status', 'Completed');

        handler();
        expect(vm.attr('showStatusChangeMessage')).toBe(false);
      });

      it('does not update showStatusChangeMessage attr ' +
      'if instance is not in one ' +
      'of the done statuses', () => {
        vm.attr('instance.status', 'In progress');
        vm.attr('isNewInstance', false);
        vm.attr('isInserted', true);

        handler();
        expect(vm.attr('showStatusChangeMessage')).toBe(false);
      });
    });
  });
});
