/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import makeArray from 'can-util/js/make-array/make-array';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../mapper-results-item-attrs';


describe('mapper-results-item-attrs component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('aggregatedColumns()', () => {
    it('should concat columns and serviceColumns attributes', () => {
      viewModel.attr('columns', [0, 1]);
      viewModel.attr('serviceColumns', [5]);
      const result = viewModel.aggregatedColumns();
      expect(makeArray(result)).toEqual([0, 1, 5]);
    });
  });

  describe('click() handler', () => {
    let handler;
    let event;
    beforeEach(() => {
      handler = Component.prototype.events.click.bind({viewModel});
      event = {
        target: $('<a class="link"></a>'),
        stopPropagation: jasmine.createSpy(),
      };
    });

    it('calls stopPropagation() if event.target is .link', () => {
      handler(null, event);
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });
});
