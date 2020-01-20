/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../sub-tree-item';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import CycleTaskGroupObjectTask from '../../../models/business-models/cycle-task-group-object-task';
import {trigger} from 'can-event';

describe('sub-tree-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('get() of isMega', () => {
    it('should return "instance.is_mega" attr', () => {
      viewModel.attr('instance', {is_mega: true});
      expect(viewModel.attr('isMega')).toBe(true);
    });
  });

  describe('get() of dueDate', () => {
    it('should return "instance.next_due_date" attr', () => {
      viewModel.attr('instance', {next_due_date: '2019-05-15'});
      expect(viewModel.attr('dueDate')).toBe('2019-05-15');
    });

    it('should return "instance.end_date" attr ' +
    'if "instance.next_due_date" attr is falsy value', () => {
      viewModel.attr('instance', {end_date: '2019-07-15'});
      expect(viewModel.attr('dueDate')).toBe('2019-07-15');
    });
  });

  describe('get() of dueDateCssClass', () => {
    it('should return "state-overdue" ' +
    'if "instance.isOverdue" attr is truthy value', () => {
      viewModel.attr('instance', {isOverdue: true});
      expect(viewModel.attr('dueDateCssClass')).toBe('state-overdue');
    });

    it('should return "" if "instance.isOverdue" attr is falsy value', () => {
      viewModel.attr('instance', {isOverdue: false});
      expect(viewModel.attr('dueDateCssClass')).toBe('');
    });
  });

  describe('get() of isCycleTaskGroupObjectTask', () => {
    it('should return true if "instance" attr ' +
    'is instanceof CycleTaskGroupObjectTask', () => {
      viewModel.attr('instance', new CycleTaskGroupObjectTask);
      expect(viewModel.attr('isCycleTaskGroupObjectTask')).toBe(true);
    });

    it('should return false if "instance" attr ' +
    'is not instanceof CycleTaskGroupObjectTask', () => {
      viewModel.attr('instance', {});
      expect(viewModel.attr('isCycleTaskGroupObjectTask')).toBe(false);
    });
  });

  describe('get() of cssClasses', () => {
    it('should return css classes if "instance.snapshot" attr ' +
    'is truthy value', () => {
      viewModel.attr('instance', {snapshot: true});
      expect(viewModel.attr('cssClasses')).toBe('snapshot');
    });

    it('should return css classes with joined "extraCss" attr', () => {
      viewModel.attr('instance', {});
      viewModel.attr('extraCss', 'class1 class2');
      expect(viewModel.attr('cssClasses')).toBe('class1 class2');
    });

    it('should return css classes if "instance.snapshot" and "extraCss" attr ' +
    'are truthy values', () => {
      viewModel.attr('instance', {snapshot: true});
      viewModel.attr('extraCss', 'class1 class2');
      expect(viewModel.attr('cssClasses')).toBe('snapshot class1 class2');
    });
  });

  describe('get() of title', () => {
    it('should return "instance.title" attr ' +
    'if it is truthy value', () => {
      viewModel.attr('instance', {title: 'title'});
      expect(viewModel.attr('title')).toBe('title');
    });

    it('should return "instance.name" attr ' +
    'if "instance.title" attr is falsy value', () => {
      viewModel.attr('instance', {name: 'name'});
      expect(viewModel.attr('title')).toBe('name');
    });

    it('should return "instance.email" attr ' +
    'if "instance.title" and ' +
    '"instance.name" attr are falsy values', () => {
      viewModel.attr('instance', {email: 'email'});
      expect(viewModel.attr('title')).toBe('email');
    });

    it('should return "" if "instance.title", ' +
    '"instance.name" and "instance.email" attr are falsy values', () => {
      viewModel.attr('instance', {});
      expect(viewModel.attr('title')).toBe('');
    });
  });

  describe('inserted event', () => {
    it('should set "$el" attribute', () => {
      let handler = Component.prototype.events['inserted'];
      handler.call({
        viewModel,
        element: '<div></div>',
      });
      expect(viewModel.attr('$el')).toBe('<div></div>');
    });
  });

  describe('"{viewModel.instance} destroyed" event', () => {
    it('triggers "refreshTree" event', () => {
      spyOn($.prototype, 'closest').and.returnValue(['closest']);
      spyOn(trigger, 'call');
      let handler =
        Component.prototype.events['{viewModel.instance} destroyed'];
      handler.call({
        viewModel,
        element: '<div></div>',
      });
      expect(trigger.call).toHaveBeenCalledWith('closest', 'refreshTree');
    });
  });
});
