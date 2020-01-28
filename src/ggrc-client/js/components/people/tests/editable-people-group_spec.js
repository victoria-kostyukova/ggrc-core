/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../editable-people-group';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('editable-people-group', () => {
  let ViewModel;
  let peopleItems = [
    {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6},
  ];

  beforeEach(function () {
    ViewModel = getComponentVM(Component);
    ViewModel.editableMode = false;
  });

  describe('"showSeeMoreLink" property', function () {
    it(`"showSeeMoreLink" should be FALSE.
        edit mode is true, can edit is true`,
    function () {
      ViewModel.people = peopleItems;
      ViewModel.canEdit = true;
      ViewModel.editableMode = true;
      expect(ViewModel.showSeeMoreLink).toBe(false);
    });

    it(`"showSeeMoreLink" should be TRUE.
        edit mode is false, can edit is true`,
    function () {
      ViewModel.people = peopleItems;
      ViewModel.canEdit = true;
      expect(ViewModel.showSeeMoreLink).toBe(true);
    });

    it(`"showSeeMoreLink" should be FALSE.
        edit mode is false, can edit is false, saving is not in progress`,
    function () {
      ViewModel.people = peopleItems;
      ViewModel.canEdit = false;
      ViewModel.updatableGroupId = null;
      expect(ViewModel.showSeeMoreLink).toBe(false);
    });

    it('"showSeeMoreLink" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        let people = peopleItems.slice(0, 4);
        ViewModel.people = people;
        ViewModel.canEdit = true;

        expect(ViewModel.showSeeMoreLink).toBe(false);
      }
    );
  });

  describe('"showPeopleGroupModal" property', function () {
    it('"showPeopleGroupModal" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        let people = peopleItems.slice(0, 4);
        ViewModel.people = people;

        // trigger editableMode setter
        ViewModel.editableMode = true;

        expect(ViewModel.showPeopleGroupModal).toBe(false);
      }
    );

    it(`"showPeopleGroupModal" should be TRUE when people limit exceeded
      and editable mode is on`,
    function () {
      ViewModel.people = peopleItems;

      // trigger editableMode setter
      ViewModel.editableMode = true;

      expect(ViewModel.showPeopleGroupModal).toBe(true);
    }
    );

    it(`"showPeopleGroupModal" should be FALSE when people limit is exceeded
      and editable mode is off`, () => {
      ViewModel.people = peopleItems;

      // trigger editableMode setter
      ViewModel.editableMode = false;

      expect(ViewModel.showPeopleGroupModal).toBe(false);
    });
  });

  describe('"isReadonly" property', () => {
    it('should be FALSE when can edit is true', () => {
      ViewModel.canEdit = true;

      expect(ViewModel.isReadonly).toBe(false);
    });

    it('should be FALSE when one of the people group is saving', () => {
      ViewModel.updatableGroupId = 'id';
      ViewModel.canEdit = false;

      expect(ViewModel.isReadonly).toBe(false);
    });

    it('should be TRUE when can edit is false and saving is not in progress,',
      () => {
        ViewModel.canEdit = false;
        ViewModel.updatableGroupId = null;

        expect(ViewModel.isReadonly).toBe(true);
      });
  });

  describe('"showPeople" property', () => {
    it('should return full list when group is not editable', () => {
      ViewModel.people = peopleItems;
      ViewModel.canEdit = false;
      ViewModel.updatableGroupId = null;

      expect(ViewModel.showPeople.length).toBe(peopleItems.length);
    });

    it('should return full list when limit is not exceeded', () => {
      let people = peopleItems.slice(0, 4);
      ViewModel.people = people;
      ViewModel.canEdit = true;

      expect(ViewModel.showPeople.length).toBe(people.length);
    });

    it(`should return shorten list
      when limit is exceeded and group is editable`, () => {
      ViewModel.canEdit = true;
      ViewModel.people = peopleItems;

      expect(ViewModel.showPeople.length).toBe(4);
    });
  });
});
