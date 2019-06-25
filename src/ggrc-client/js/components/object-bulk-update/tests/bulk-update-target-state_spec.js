/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../bulk-update-target-state.js';

let objectStateToWarningMap = {
  CycleTaskGroupObjectTask: {
    'In Progress': 'Please be aware that Finished, Declined and Verified ' +
      'tasks cannot be moved to In Progress state.',
    Finished: 'Please be aware that Assigned and Verified ' +
      'tasks cannot be moved to Finished state.',
    Declined: 'Please be aware that Assigned, In Progress and Verified ' +
      'tasks cannot be moved to Declined state.',
    Verified: 'Please be aware that Assigned, In Progress and Declined ' +
      'tasks cannot be moved to Verified state.',
  },
};
let viewModel;

describe('bulk-update-target-state component', function () {
  beforeAll(function () {
    viewModel = getComponentVM(Component);
  });
  describe('warningMessage property', function () {
    it('should return appropriate warnings for objects', function () {
      let objectStatesMap = {
        CycleTaskGroupObjectTask: ['Assigned', 'In Progress', 'Finished',
          'Declined', 'Deprecated', 'Verified'],
      };

      loForEach(objectStatesMap, function (states, obj) {
        viewModel.attr('modelName', obj);

        loForEach(states, function (state) {
          let warning;
          let expected = objectStateToWarningMap[obj][state] || '';
          viewModel.attr('targetState', state);

          warning = viewModel.attr('warningMessage');

          expect(warning).toEqual(expected);
        });
      });
    });
  });
});
