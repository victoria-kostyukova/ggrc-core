/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../permalink-component';


describe('permalink component', () => {
  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
  });

  it('set "text" value to empty string if "viewLink" is not defined', () => {
    viewModel.attr('instance', {
      type: 'Facility',
    });

    expect(viewModel.attr('text')).toBe('');
  });

  it('set "text" value using combination of app host & "viewLink"', () => {
    viewModel.attr('instance', {
      type: 'Facility',
      viewLink: '/facility/1',
    });

    expect(viewModel.attr('text'))
      .toBe(`${window.location.origin}${viewModel.attr('instance.viewLink')}`);
  });

  it('set "text" value to empty string if "workflow.id" is not defined' +
     'for Cycle', () => {
    viewModel.attr('instance', {
      type: 'Cycle',
    });
    expect(viewModel.attr('text')).toBe('');
  });

  it('set "text" value using combination of app host & "workflow.id"' +
     'for Cycle', () => {
    viewModel.attr('instance', {
      type: 'Cycle',
      workflow: {id: 4},
    });
    expect(viewModel.attr('text'))
      .toBe(`${window.location.origin}/workflows/4#!current`);
  });

  it('set "text" value to empty string if "workflow.id" is not defined' +
     'for CycleTaskGroupObjectTask', () => {
    viewModel.attr('instance', {
      type: 'CycleTaskGroupObjectTask',
    });
    expect(viewModel.attr('text')).toBe('');
  });

  it('set "text" value using combination of app host & "workflow.id"' +
     'for CycleTaskGroupObjectTask', () => {
    viewModel.attr('instance', {
      type: 'CycleTaskGroupObjectTask',
      workflow: {id: 5},
    });
    expect(viewModel.attr('text'))
      .toBe(`${window.location.origin}/workflows/5#!current`);
  });
});
