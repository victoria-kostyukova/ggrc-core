/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from '../tree-item-actions';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import * as Permission from '../../../permission';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as Mapper from '../../../models/mappers/mappings';
import Cacheable from '../../../models/cacheable';

describe('tree-item-actions component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    viewModel.instance = new canMap();
  });

  describe('isAllowedToMap get() method', () => {
    beforeEach(() => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
    });
    describe('returns false', () => {
      it('if there is no objects to map to instance type', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(Mapper, 'getMappingList').and.returnValue([]);
        viewModel.instance.attr('type', 'Workflow');

        let result = viewModel.isAllowedToMap;

        expect(result).toBe(false);
      });

      it('if user has no rights to update instance', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(false);
        let result = viewModel.isAllowedToMap;

        expect(result).toBe(false);
      });
    });

    describe('returns true', () => {
      it('if there are objects to map to instance type and ' +
        'user has permissions to update instance', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(Mapper, 'getMappingList').and.returnValue(['Object1']);
        viewModel.instance.attr('type', 'Type');

        let result = viewModel.isAllowedToMap;

        expect(result).toBe(true);
      });
    });
  });

  describe('isAllowedToEdit get() method', () => {
    describe('returns false', () => {
      it('if instance is archived', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
        viewModel.instance.attr('type', 'Type');
        viewModel.instance.attr('archived', true);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });

      it('if instance is snapshot', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(true);
        viewModel.instance.attr('type', 'Type');
        viewModel.instance.attr('archived', false);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });

      it('if instance type is in forbiddenEditList', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
        viewModel.instance.attr('type', 'Cycle');
        viewModel.instance.attr('archived', false);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });

      it('if user has not permissions to update instance', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(false);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
        viewModel.instance.attr('type', 'Type');
        viewModel.instance.attr('archived', false);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });

      it('if object is changeable externally', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);

        let instance = makeFakeInstance({
          model: Cacheable,
          staticProps: {
            isChangeableExternally: true,
          },
        })({
          archived: false,
        });

        viewModel.instance = instance;

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });

      it('if instance is readonly', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
        viewModel.instance.attr('type', 'Type');
        viewModel.instance.attr('archived', false);
        viewModel.instance.attr('readonly', true);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(false);
      });
    });

    describe('returns true', () => {
      it('if allowed to edit instance', () => {
        spyOn(Permission, 'isAllowedFor').and.returnValue(true);
        spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
        viewModel.instance.attr('type', 'Type');
        viewModel.instance.attr('archived', false);
        viewModel.instance.attr('readonly', false);

        let result = viewModel.isAllowedToEdit;
        expect(result).toBe(true);
      });
    });
  });
});
