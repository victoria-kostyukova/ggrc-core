/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../editable-people-group';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('editable-people-group', function () {
  'use strict';

  let viewModel;
  let peopleItems = [
    {id: 1}, {id: 2}, {id: 3}, {id: 4}, {id: 5}, {id: 6},
  ];

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    viewModel.attr('editableMode', false);
  });

  describe('"showSeeMoreLink" property', function () {
    it(`"showSeeMoreLink" should be FALSE.
        edit mode is true, can edit is true`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', true);
      viewModel.attr('editableMode', true);
      expect(viewModel.attr('showSeeMoreLink')).toBe(false);
    });

    it(`"showSeeMoreLink" should be TRUE.
        edit mode is false, can edit is true`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', true);
      expect(viewModel.attr('showSeeMoreLink')).toBe(true);
    });

    it(`"showSeeMoreLink" should be FALSE.
        edit mode is false, can edit is false, saving is not in progress`,
    function () {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', false);
      viewModel.attr('updatableGroupId', null);
      expect(viewModel.attr('showSeeMoreLink')).toBe(false);
    });

    it('"showSeeMoreLink" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        let people = peopleItems.slice(0, 4);
        viewModel.attr('people', people);
        viewModel.attr('canEdit', true);

        expect(viewModel.attr('showSeeMoreLink')).toBe(false);
      }
    );
  });

  describe('"showPeopleGroupModal" property', function () {
    it('"showPeopleGroupModal" should be FALSE. People length less than 5',
      function () {
        // get 4 persons
        let people = peopleItems.slice(0, 4);
        viewModel.attr('people', people);

        // trigger editableMode setter
        viewModel.attr('editableMode', true);

        expect(viewModel.attr('showPeopleGroupModal')).toBe(false);
      }
    );

    it(`"showPeopleGroupModal" should be TRUE when people limit exceeded
      and editable mode is on`,
    function () {
      viewModel.attr('people', peopleItems);

      // trigger editableMode setter
      viewModel.attr('editableMode', true);

      expect(viewModel.attr('showPeopleGroupModal')).toBe(true);
    }
    );

    it(`"showPeopleGroupModal" should be FALSE when people limit is exceeded
      and editable mode is off`, () => {
      viewModel.attr('people', peopleItems);

      // trigger editableMode setter
      viewModel.attr('editableMode', false);

      expect(viewModel.attr('showPeopleGroupModal')).toBe(false);
    });
  });

  describe('"isReadonly" property', () => {
    it('should be FALSE when can edit is true', () => {
      viewModel.attr('canEdit', true);

      expect(viewModel.attr('isReadonly')).toBe(false);
    });

    it('should be FALSE when one of the people group is saving', () => {
      viewModel.attr('updatableGroupId', 'id');
      viewModel.attr('canEdit', false);

      expect(viewModel.attr('isReadonly')).toBe(false);
    });

    it('should be TRUE when can edit is false and saving is not in progress,',
      () => {
        viewModel.attr('canEdit', false);
        viewModel.attr('updatableGroupId', null);

        expect(viewModel.attr('isReadonly')).toBe(true);
      });
  });

  describe('"showPeople" property', () => {
    it('should return full list when group is not editable', () => {
      viewModel.attr('people', peopleItems);
      viewModel.attr('canEdit', false);
      viewModel.attr('updatableGroupId', null);

      expect(viewModel.attr('showPeople').length).toBe(peopleItems.length);
    });

    it('should return full list when limit is not exceeded', () => {
      let people = peopleItems.slice(0, 4);
      viewModel.attr('people', people);
      viewModel.attr('canEdit', true);

      expect(viewModel.attr('showPeople').length).toBe(people.length);
    });

    it(`should return shorten list
      when limit is exceeded and group is editable`, () => {
      viewModel.attr('canEdit', true);
      viewModel.attr('people', peopleItems);

      expect(viewModel.attr('showPeople').length).toBe(4);
    });
  });
});
