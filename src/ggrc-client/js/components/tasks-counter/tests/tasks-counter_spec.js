/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tasks-counter';
import Person from '../../../models/business-models/person';

describe('tasks-counter component', function () {
  'use strict';

  let viewModel; // the viewModel under test

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('initializes default viewModel values', function () {
    it('sets the "tasksAmount" to 0', function () {
      expect(viewModel.attr('tasksAmount')).toEqual(0);
    });

    describe('sets the "tasksAmount" to 0 and ', function () {
      it('doens\'t allow to set it as negative', function () {
        viewModel.attr('tasksAmount', -100);
        expect(viewModel.attr('tasksAmount')).toEqual(0);
      });
    });

    it('sets the "hasOverdue" to 0', function () {
      expect(viewModel.attr('hasOverdue')).toEqual(false);
    });

    describe('computes "stateCss" attribute and sets to ', function () {
      it('"tasks-counter__empty-state", if tasksAmount is 0', function () {
        viewModel.attr('tasksAmount', 0);
        expect(viewModel.attr('stateCss'))
          .toEqual('tasks-counter__empty-state');
      });

      it('"tasks-counter__overdue-state",' +
        ' if tasksAmount > 0 and hasOverdue is true', function () {
        viewModel.attr('tasksAmount', 1);
        viewModel.attr('hasOverdue', true);
        expect(viewModel.attr('stateCss'))
          .toEqual('tasks-counter__overdue-state');
      });

      it('as empty string,' +
        ' if tasksAmount > 0 and hasOverdue is false', function () {
        viewModel.attr('tasksAmount', 1);
        viewModel.attr('hasOverdue', false);
        expect(viewModel.attr('stateCss'))
          .toEqual('');
      });
    });

    describe('on person attribute update should', function () {
      it('trigger execution of loadTasks method', function () {
        const person = {id: 1, email: 'user@google.com'};
        spyOn(viewModel, 'loadTasks');
        viewModel.attr('person', person);
        expect(viewModel.attr('person.id')).toEqual(1);
        expect(viewModel.loadTasks).toHaveBeenCalled();
      });
    });

    describe('.loadTasks() method should', function () {
      beforeEach(() => {
        spyOn(Person, 'findInCacheById')
          .and.callFake(() => {
            return {
              getTasksCount: () => $.Deferred().resolve({
                open_task_count: 5,
                has_overdue: true,
              }),
            };
          });
      });

      it('update hasOverdue and tasksAmount properties', function () {
        viewModel.loadTasks().then(() => {
          expect(Person.findInCacheById).toHaveBeenCalled();
          expect(viewModel.attr('tasksAmount')).toBe(5);
          expect(viewModel.attr('hasOverdue')).toBe(true);
        });
      });
    });
  });
});
