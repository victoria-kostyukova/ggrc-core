/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loDifference from 'lodash/difference';
import moment from 'moment';
import {makeFakeInstance} from '../../../../js_specs/spec_helpers';
import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../tree-item-extra-info';
import CycleTaskGroupObjectTask from '../../../models/business-models/cycle-task-group-object-task';
import * as businessModels from '../../../models/business-models';
import TreeViewConfig from '../../../apps/base_widgets';

describe('tree-item-extra-info component', function () {
  let viewModel;
  let activeModel = [
    'Regulation',
    'Contract',
    'Policy',
    'Standard',
    'Requirement',
  ];

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  describe('is active if', function () {
    it('workflow_state is defined', function () {
      viewModel.attr('instance', {workflow_state: 'far'});
      expect(viewModel.attr('isActive')).toBeTruthy();
    });

    activeModel.forEach(function (model) {
      it('instance is ' + model, function () {
        viewModel.attr('instance', makeFakeInstance(
          {model: businessModels[model]}
        )());
        expect(viewModel.attr('isActive')).toBeTruthy();
      });
    });
  });

  describe('is not active if', function () {
    let allModels = Object.keys(TreeViewConfig.attr('base_widgets_by_type'));
    let notActiveModels = loDifference(allModels, activeModel);

    it('workflow_state is not defined', function () {
      viewModel.attr('instance', {title: 'FooBar'});
      expect(viewModel.attr('isActive')).toBeFalsy();
    });

    notActiveModels.forEach(function (model) {
      if (businessModels[model]) {
        it('instance is ' + model, function () {
          viewModel.attr('instance', makeFakeInstance(
            {model: businessModels[model]}
          )());
          expect(viewModel.attr('isActive')).toBeFalsy();
        });
      }
    });
  });

  describe('isOverdue property', function () {
    it('returns true if workflow_status is "Overdue"', function () {
      let result;
      viewModel.attr('instance', {
        workflow_state: 'Overdue',
      });

      result = viewModel.attr('isOverdue');

      expect(result).toBe(true);
    });

    it('returns false if workflow_status is not "Overdue"', function () {
      let result;
      viewModel.attr('instance', {
        workflow_state: 'AnyState',
      });

      result = viewModel.attr('isOverdue');

      expect(result).toBe(false);
    });

    it('returns true if instance is "CycleTasks" and overdue', function () {
      let result;
      let instance = makeFakeInstance({
        model: CycleTaskGroupObjectTask,
      })();
      instance.attr('end_date', moment().subtract(5, 'd'));
      viewModel.attr('instance', instance);

      result = viewModel.attr('isOverdue');

      expect(result).toBe(true);
    });

    it('returns false if instance is "CycleTasks" and not overdue',
      function () {
        let result;
        let instance = makeFakeInstance({
          model: CycleTaskGroupObjectTask,
        })();
        instance.attr('end_date', moment().add(5, 'd'));
        viewModel.attr('instance', instance);

        result = viewModel.attr('isOverdue');

        expect(result).toBe(false);
      });
  });

  describe('endDate property', () => {
    let result;

    it('returns "Today" for today', () => {
      viewModel.attr('instance', {
        end_date: new Date(),
      });
      result = viewModel.attr('endDate');
      expect(result).toEqual('Today');
    });

    it('returns date for tomorrow', () => {
      let tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
      let expected = moment(tomorrow).format('MM/DD/YYYY');

      viewModel.attr('instance', {
        end_date: tomorrow,
      });
      result = viewModel.attr('endDate');
      expect(result).toEqual(expected);
    });

    it('returns date for yesterday', () => {
      let yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
      let expected = moment(yesterday).format('MM/DD/YYYY');

      viewModel.attr('instance', {
        end_date: yesterday,
      });
      result = viewModel.attr('endDate');
      expect(result).toEqual(expected);
    });

    it('returns date string when date is passed in', () => {
      viewModel.attr('instance', {
        end_date: new Date(2000, 2, 2),
      });
      result = viewModel.attr('endDate');
      expect(result).toEqual('03/02/2000');
    });

    it('returns "Today" for falsey', () => {
      viewModel.attr('instance', {
        end_date: null,
      });
      result = viewModel.attr('endDate');
      expect(result).toEqual('Today');
    });
  });

  describe('processPendingContent() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'addContent');
    });

    it('extracts pending content from pendingContent field', () => {
      const pendingContent = [
        () => Promise.resolve(),
        () => Promise.resolve(),
      ];
      viewModel.attr('pendingContent').push(...pendingContent);

      viewModel.processPendingContent();

      expect(viewModel.attr('pendingContent.length')).toBe(0);
    });

    it('calls addContent() with resolved pending content', () => {
      const expected = [
        Promise.resolve('Content 1'),
        Promise.resolve('Content 2'),
      ];
      const pendingContent = expected.map((promise) => () => promise);
      viewModel.attr('pendingContent').push(...pendingContent);

      viewModel.processPendingContent();

      expect(viewModel.addContent).toHaveBeenCalledWith(...expected);
    });
  });

  describe('addDeferredContent() method', () => {
    it('pushes passed callback from event to pendingContent', () => {
      const event = {
        deferredCallback: () => Promise.resolve(),
      };
      viewModel.attr('pendingContent', []);

      viewModel.addDeferredContent(event);

      expect(viewModel.attr('pendingContent').serialize()).toEqual([
        event.deferredCallback,
      ]);
    });
  });

  describe('addContent() method', () => {
    beforeEach(() => {
      spyOn($, 'when').and.returnValue(new Promise(() => {}));
    });

    it('sets spin field to true', () => {
      viewModel.addContent();
      expect(viewModel.attr('spin')).toBe(true);
    });

    it('pushes passed deferred objects to contentPromises', () => {
      const promises = [
        Promise.resolve(),
        Promise.resolve(),
      ];

      viewModel.addContent(...promises);

      expect(viewModel.attr('contentPromises').serialize()).toEqual(promises);
    });

    it('updates dfdReady field with updated contentPromises', () => {
      const promises = [
        Promise.resolve(),
        Promise.resolve(),
      ];

      viewModel.addContent(promises);

      expect(viewModel.attr('dfdReady')).toEqual(jasmine.any(Promise));
    });

    describe('after resolving of contentPromises', () => {
      beforeEach(() => {
        $.when.and.returnValue(Promise.resolve());
      });

      it('sets spin field to false', async (done) => {
        viewModel.addContent();

        await viewModel.attr('dfdReady');

        expect(viewModel.attr('spin')).toBe(false);
        done();
      });
    });
  });
});
