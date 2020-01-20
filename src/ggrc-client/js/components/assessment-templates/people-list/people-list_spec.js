/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import {
  getComponentVM,
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import Component from './people-list';
import AssessmentTemplate from '../../../models/business-models/assessment-template';

describe('people-list component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    let instance = makeFakeInstance({model: AssessmentTemplate})({
      default_people: {},
    });
    viewModel.attr('instance', instance);
  });

  describe('init() method', function () {
    it('calls unpackPeopleData ', function () {
      const init = Component.prototype.init.bind({viewModel});

      spyOn(viewModel, 'unpackPeopleData');

      init();

      expect(viewModel.unpackPeopleData).toHaveBeenCalled();
    });
  });

  describe('packPeopleData() method', function () {
    it('packs  selectedValue data into a string', function () {
      let result;

      viewModel.attr('selectedValue', 'Rabbits');

      result = viewModel.packPeopleData();

      expect(result).toEqual('Rabbits');
    });

    it('uses the list of chosen peopleList if selectedValue' +
      'is set to "other"',
    function () {
      const assessorIds = [125, 256, 278];

      viewModel.attr('selectedValue', 'other');
      viewModel.attr('peopleList', assessorIds);

      const result = viewModel.packPeopleData();

      expect(Array.from(result)).toEqual(assessorIds);
    });
  });

  describe('unpackPeopleData() method', function () {
    const defaultPeopleType = 'assignees';

    beforeEach(() => {
      viewModel.attr('peopleListAttr', `default_people.${defaultPeopleType}`);
    });

    it('builds an IDs array from the peopleList', function () {
      const peopleList = [5, 7, 12];
      viewModel.attr('instance.default_people', {
        [defaultPeopleType]: new canList(peopleList),
      });

      viewModel.attr('peopleList', []);
      viewModel.unpackPeopleData();

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual(peopleList);
    });

    it(`sets the selectedValue to "other"
      when there is type of default people`, function () {
      viewModel.attr('instance.default_people', {
        [defaultPeopleType]: new canList([5, 7, 12]),
      });

      viewModel.unpackPeopleData();

      expect(viewModel.attr('selectedValue')).toEqual('other');
    });

    it(`clears the peopleList IDs array when type of default people
      not instanceof canList`, function () {
      viewModel.attr('peopleList', [42, 2, 3]);
      viewModel.attr('instance.default_people', {
        [defaultPeopleType]: 'Some User Group',
      });

      viewModel.unpackPeopleData();

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual([]);
    });

    it('sets the selectedValue to type of default people', function () {
      const data = 'Some User Group';
      viewModel.attr('peopleList', [42, 2, 3]);
      viewModel.attr('instance.default_people', {
        [defaultPeopleType]: data,
      });

      viewModel.unpackPeopleData();

      expect(viewModel.attr('selectedValue')).toEqual(data);
    });
  });

  describe('personAdded() method', function () {
    let eventObj;

    beforeEach(function () {
      eventObj = $.Event();
    });

    it('adds the new person ID to the persons list', function () {
      eventObj.selectedItem = {id: 42};

      viewModel.attr('peopleList', [7, 1]);
      viewModel.personAdded(eventObj);

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual([7, 1, 42]);
    });

    it('silently ignores duplicate entries', function () {
      const peopleList = [7, 9];
      eventObj.selectedItem = {id: 7};

      viewModel.attr('peopleList', peopleList);
      viewModel.personAdded(eventObj);

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual(peopleList);
    });
  });

  describe('removePerson() method', function () {
    it('removes the new person ID from the persons list', function () {
      const person = {id: 4};

      viewModel.attr('peopleList', [7, 4, 3]);
      viewModel.removePerson(person);

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual([7, 3]);
    });

    it('silently ignores removing non-existing entries', function () {
      const person = {id: 50};
      const peopleList = [7, 5, 10];

      viewModel.attr('peopleList', peopleList);
      viewModel.removePerson(person);

      const actualData = Array.from(viewModel.attr('peopleList'));

      expect(actualData).toEqual(peopleList);
    });
  });

  describe('dropdownChanged() method', function () {
    it('calls updatePeopleList method ',
      function () {
        spyOn(viewModel, 'updatePeopleList');

        viewModel.dropdownChanged();

        expect(viewModel.updatePeopleList).toHaveBeenCalled();
      }
    );
  });

  describe('updatePeopleList() method', function () {
    it('sets data in instance', function () {
      const peopleListAttr = 'default_people.assignees';
      const packData = 'some data';

      spyOn(viewModel, 'packPeopleData').and.returnValue(packData);

      viewModel.attr('peopleListAttr', peopleListAttr);
      viewModel.updatePeopleList();

      expect(viewModel.attr(`instance.${peopleListAttr}`))
        .toEqual(packData);
    });
  });

  describe('peopleValues() setter', function () {
    const peopleValues = new canList([
      {value: 'Auditors', title: 'Auditors'},
      {value: 'Secondary Assignees', title: 'Secondary Assignees'},
      {value: 'Control Operators', title: 'Control Operators'},
      {value: 'Admin', title: 'Object Admins'},
    ]);
    const defaultValue = AssessmentTemplate.defaults.default_people.verifiers;

    beforeEach(function () {
      viewModel.attr('listName', 'verifiers');
    });

    it(`does not change selectedValue if it is present
    in new peopleValues list`,
    function () {
      viewModel.attr('selectedValue', 'Admin');
      spyOn(viewModel, 'updatePeopleList');

      viewModel.attr('peopleValues', peopleValues);

      expect(viewModel.attr('selectedValue')).toBe('Admin');
    });

    it(`sets selectedValue to default if it is not present in
    new peopleValues list`,
    function () {
      viewModel.attr('selectedValue', 'Primary Contacts');
      spyOn(viewModel, 'updatePeopleList');

      viewModel.attr('peopleValues', peopleValues);

      expect(viewModel.attr('selectedValue')).toBe(defaultValue);
    });

    it(`calls updatePeopleList if selectedValue is not present in
    new peopleValues list`,
    function () {
      viewModel.attr('selectedValue', 'Primary Contacts');
      spyOn(viewModel, 'updatePeopleList');

      viewModel.attr('peopleValues', peopleValues);

      expect(viewModel.updatePeopleList).toHaveBeenCalled();
    });
  });

  describe('"hidable" attribute', () => {
    it('should return TRUE. Selected not OTHER value', () => {
      viewModel.attr('selectedValue', 'Auditors');
      expect(viewModel.attr('hidable')).toBeTruthy();
    });

    it('should return TRUE. ' +
    'Selected OTHER value, but "peopleList" is not empty', () => {
      viewModel.attr('selectedValue', 'other');
      viewModel.attr('peopleList', [{id: 5}]);
      expect(viewModel.attr('hidable')).toBeTruthy();
    });

    it('should return FALSE. ' +
    'Selected OTHER value, but "peopleList" is empty', () => {
      viewModel.attr('selectedValue', 'other');
      viewModel.attr('peopleList', []);
      expect(viewModel.attr('hidable')).toBeFalsy();
    });

    it('should return FALSE. "Mandatory" is true. ' +
    'Selected not OTHER value', () => {
      viewModel.attr('mandatory', true);
      viewModel.attr('selectedValue', 'Auditors');
      expect(viewModel.attr('hidable')).toBeFalsy();
    });

    it('should return FALSE. "Mandatory" is true. ' +
    'Selected OTHER value, but "peopleList" is not empty', () => {
      viewModel.attr('mandatory', true);
      viewModel.attr('selectedValue', 'other');
      viewModel.attr('peopleList', [{id: 5}]);
      expect(viewModel.attr('hidable')).toBeFalsy();
    });

    it('should return FALSE. "Mandatory" is true. ' +
    'Selected OTHER value, but "peopleList" is empty', () => {
      viewModel.attr('mandatory', true);
      viewModel.attr('selectedValue', 'other');
      viewModel.attr('peopleList', []);
      expect(viewModel.attr('hidable')).toBeFalsy();
    });
  });
});
