/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../autocomplete-results';

describe('autocomplete-results component', () => {
  let viewModel;
  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('viewModel', () => {
    describe('results get()', () => {
      let item;
      beforeEach(() => {
        item = {
          email: 'email1',
          name: 'name1',
        };
      });
      it('correctly maps results when paths are defined', () => {
        viewModel.attr('titleFieldPath', 'name');
        viewModel.attr('infoFieldPath', 'email');

        viewModel.attr('values', [item]);
        let results = viewModel.attr('results');

        expect(results.serialize()[0]).toEqual({
          title: item.name,
          info: item.email,
          value: item,
        });
      });

      it('correctly maps results when patches are not defined', () => {
        viewModel.attr('values', [item]);
        let results = viewModel.attr('results');

        expect(results.serialize()[0]).toEqual({
          title: '',
          info: '',
          value: item,
        });
      });
    });

    describe('pickItem() method', () => {
      let event;
      let item;
      beforeEach(() => {
        event = jasmine.createSpyObj(['stopPropagation']);
        item = {
          test: true,
        };
        spyOn(viewModel, 'dispatch');
      });

      it('dispatches "itemPicked" event', () => {
        viewModel.pickItem(item, event);

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'itemPicked',
          data: item,
        });
      });

      it('stops event propagation', () => {
        viewModel.pickItem(item, event);

        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });
  });
});
