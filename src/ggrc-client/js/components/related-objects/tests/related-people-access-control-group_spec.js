/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as Permission from '../../../permission';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../related-people-access-control-group';

describe('related-people-access-control-group component', () => {
  let ViewModel;

  beforeEach(() => {
    ViewModel = getComponentVM(Component);
    ViewModel.instance = new canMap({});
  });

  describe('canEdit prop', () => {
    it('returns "false" when instance is snapshot', () => {
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);
      ViewModel.instance.archived = false;
      ViewModel.updatableGroupId = null;
      ViewModel.isNewInstance = false;

      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(true);

      expect(ViewModel.canEdit).toEqual(false);
    });

    it('returns "false" when instance is archived', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);
      ViewModel.updatableGroupId = null;
      ViewModel.isNewInstance = false;

      ViewModel.instance.attr('archived', true);

      expect(ViewModel.canEdit).toEqual(false);
    });

    it('returns "false" when there is updatableGroupId', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      ViewModel.instance.attr('archived', false);
      ViewModel.isNewInstance = false;
      spyOn(Permission, 'isAllowedFor').and.returnValue(true);

      ViewModel.updatableGroupId = 'groupId';

      expect(ViewModel.canEdit).toEqual(false);
    });

    it('returns "false" when user has no update permissions', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      ViewModel.instance.attr('archived', false);
      ViewModel.updatableGroupId = null;
      ViewModel.isNewInstance = false;

      spyOn(Permission, 'isAllowedFor').and.returnValue(false);

      expect(ViewModel.canEdit).toEqual(false);
    });

    it('returns "false" when is readonly', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(false);
      ViewModel.instance.attr('archived', false);
      ViewModel.updatableGroupId = null;
      ViewModel.isNewInstance = true;
      ViewModel.isReadonly = true;

      expect(ViewModel.canEdit).toEqual(false);
    });

    it('returns "true" when new instance', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      spyOn(Permission, 'isAllowedFor').and.returnValue(false);
      ViewModel.instance.attr('archived', false);
      ViewModel.updatableGroupId = null;

      ViewModel.isNewInstance = true;

      expect(ViewModel.canEdit).toEqual(true);
    });

    it('returns "true" when user has update permissions', () => {
      spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
      ViewModel.instance.attr('archived', false);
      ViewModel.updatableGroupId = null;
      ViewModel.isNewInstance = false;

      spyOn(Permission, 'isAllowedFor').and.returnValue(true);

      expect(ViewModel.canEdit).toEqual(true);
    });
  });

  describe('check methods for updating "people" property', () => {
    let peopleList = [
      {id: 1, desc: 'Existent Person'},
      {id: 2, desc: 'Non-Existent Person'},
    ];

    beforeEach(() => {
      ViewModel.people = [peopleList[0]];
      ViewModel.groupId = 1;
      ViewModel.title = peopleList[0].desc;
    });

    describe('"addPerson" method', () => {
      it('should add person to "people" list if not present', () => {
        ViewModel.addPerson(peopleList[1], ViewModel.groupId);
        expect(ViewModel.people.length).toBe(2);
      });

      it('should not add person to "people" list if present', () => {
        ViewModel.addPerson(peopleList[0], ViewModel.groupId);
        expect(ViewModel.people.length).toBe(1);
      });

      it('should replace person if singleUserRole attr is truthy',
        () => {
          ViewModel.singleUserRole = true;

          ViewModel.addPerson(peopleList[1], ViewModel.groupId);

          let people = ViewModel.people;
          expect(people.length).toBe(1);
          expect(people[0]).toEqual(jasmine.objectContaining(peopleList[1]));
        });
    });

    describe('"removePerson" method', () => {
      it('should remove person from "people" list if present', () => {
        ViewModel.removePerson({person: peopleList[0]});
        expect(ViewModel.people.length).toBe(0);
      });

      it('should not remove person from "people" list if not present', () => {
        let count = ViewModel.people.length;
        ViewModel.removePerson({person: peopleList[1]});
        expect(ViewModel.people.length).toBe(count);
      });
    });
  });
});
