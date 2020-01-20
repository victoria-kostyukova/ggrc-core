/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {
  makeFakeModel,
  getComponentVM,
} from '../../../../js_specs/spec-helpers';
import * as aclUtils from '../../../plugins/utils/acl-utils';
import Component from '../access-control-list-roles-helper';
import Cacheable from '../../../models/cacheable';
import AccessControlList from '../../../models/mixins/access-control-list';

describe('access-control-list-roles-helper component', function () {
  'use strict';

  let viewModel;
  let DummyModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    DummyModel = makeFakeModel({
      model: Cacheable,
      staticProps: {
        mixins: [
          AccessControlList,
        ],
      },
    });
  });

  describe('"setAutoPopulatedRoles" method', function () {
    let instance;

    it('should set current user for 2 roles', function () {
      spyOn(aclUtils, 'getRolesForType').and.returnValue([
        {
          object_type: 'DummyModel',
          id: 5,
          name: 'Admin',
          default_to_current_user: true,
        },
        {
          object_type: 'DummyModel',
          id: 7,
          name: 'SuperAdmin',
          default_to_current_user: true,
        },
        {
          object_type: 'DummyModel',
          id: 8,
          name: 'Primary contacts',
          default_to_current_user: false,
        },
      ]);

      instance = new DummyModel({id: 25});
      viewModel.attr('instance', instance);
      expect(instance.access_control_list.length).toEqual(0);
      viewModel.setAutoPopulatedRoles();
      expect(instance.access_control_list.length).toEqual(2);
      expect(instance.access_control_list[0].ac_role_id)
        .toEqual(5);
      expect(instance.access_control_list[1].ac_role_id)
        .toEqual(7);
      expect(instance.access_control_list[0].person.id)
        .toEqual(1);
    });

    it('should set current user for 1 role', function () {
      spyOn(aclUtils, 'getRolesForType').and.returnValue([
        {
          object_type: 'DummyModel',
          id: 6,
          name: 'Primary Contact',
          default_to_current_user: true,
        },
      ]);

      instance = new DummyModel({id: 25});
      viewModel.attr('instance', instance);
      expect(instance.access_control_list.length).toEqual(0);
      viewModel.setAutoPopulatedRoles();
      expect(instance.access_control_list.length).toEqual(1);
      expect(instance.access_control_list[0].ac_role_id)
        .toEqual(6);
      expect(instance.access_control_list[0].person.id)
        .toEqual(1);
    });
  });
});
