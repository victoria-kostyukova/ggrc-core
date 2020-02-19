/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Component from '../person-form-field';
import canMap from 'can-map';

describe('person-form-field component', function () {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    spyOn(viewModel, 'dispatch');
    viewModel.attr('fieldId', 1);
    viewModel.dispatch.calls.reset();
  });

  describe('"addPerson" method', function () {
    it(`adds a person to value list 
      if new person is not in the list`, function () {
      viewModel.attr('value', [{id: 1, context_id: null}]);
      viewModel.addPerson({selectedItem: {id: 2}});

      const expectResult = [
        {id: 1, context_id: null},
        {id: 2, context_id: null},
      ];
      expect(viewModel.attr('value').serialize())
        .toEqual(expectResult);
    });

    it(`does not add a person to value list 
      if person is already in the list`, function () {
      viewModel.attr('value', [{id: 1, context_id: null}]);
      viewModel.addPerson({selectedItem: {id: 1}});

      const expectResult = [{id: 1, context_id: null}];
      expect(viewModel.attr('value').serialize())
        .toEqual(expectResult);
    });

    it(`fire valueChanged event
      if new person is not in the list`, function () {
      viewModel.attr('value', [{id: 1}]);
      viewModel.addPerson({selectedItem: {id: 2}});

      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'valueChanged',
        fieldId: 1,
        value: viewModel.attr('value'),
      });
    });

    it(`does not fire valueChanged event
      if new person is already in the list`, function () {
      viewModel.attr('value', [{id: 1}, {id: 2}]);
      viewModel.addPerson({selectedItem: new canMap({id: 2})});

      expect(viewModel.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('"removePerson" method', function () {
    beforeEach(function () {
      viewModel.attr('value', [
        new canMap({id: 1}),
        new canMap({id: 2}),
      ]);
    });

    it('removes a person from value list', function () {
      viewModel.removePerson({person: {id: 2}});

      const expectResult = [{id: 1}];
      expect(viewModel.attr('value').serialize())
        .toEqual(expectResult);
    });

    it('fires valueChanged event', function () {
      viewModel.removePerson({person: {id: 2}});

      const expectValue = [viewModel.attr('value.0')];
      expect(viewModel.dispatch).toHaveBeenCalledWith({
        type: 'valueChanged',
        fieldId: 1,
        value: expectValue,
      });
    });
  });
});
