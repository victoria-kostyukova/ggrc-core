/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../sortable-column';

describe('sortable-column component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('applySort() method', () => {
    beforeEach(() => {
      const orderBy = {
        direction: 'asc',
        field: 'status',
      };

      viewModel.attr('sort', orderBy);
      spyOn(viewModel.attr('sort'), 'dispatch');
    });

    it('should toggle sort direction when column is already sorted', () => {
      viewModel.attr('sortField', 'status');

      spyOn(viewModel, 'toggleSortDirection');
      viewModel.applySort();

      expect(viewModel.toggleSortDirection).toHaveBeenCalled();
    });

    it('should set default field and direction when column isnt sorted',
      () => {
        const sortField = 'any sort field';

        viewModel.attr('sortField', sortField);
        viewModel.applySort();

        const resultField = viewModel.attr('sort.field');
        const resultDirection = viewModel.attr('sort.direction');

        expect(resultField).toEqual(sortField);
        expect(resultDirection).toEqual('asc');
      });

    it('should notify that sorting is changed if column is already sorted',
      () => {
        viewModel.attr('sortField', 'status');

        spyOn(viewModel, 'toggleSortDirection');
        viewModel.applySort();

        const sort = viewModel.attr('sort');
        expect(sort.dispatch).toHaveBeenCalledWith('changed');
      });

    it('should notify that sorting is changed if column isnt sorted yet',
      () => {
        const sortField = 'any field';

        viewModel.attr('sortField', sortField);
        viewModel.applySort();

        const sort = viewModel.attr('sort');

        expect(sort.dispatch).toHaveBeenCalledWith('changed');
      });
  });

  describe('toggleSortDirection() method', () => {
    const direction = {
      asc: 'asc',
      desc: 'desc',
    };

    it('should change sort direction with value "asc" on value "desc"',
      () => {
        viewModel.attr('sort.direction', direction.asc);
        viewModel.toggleSortDirection();

        const resultDirection = viewModel.attr('sort.direction');

        expect(resultDirection).toEqual(direction.desc);
      });

    it('should change sort direction with value "desc" on value "asc"',
      () => {
        viewModel.attr('sort.direction', direction.desc);
        viewModel.toggleSortDirection();

        const resultDirection = viewModel.attr('sort.direction');

        expect(resultDirection).toEqual(direction.asc);
      });
  });

  describe('"{$content} click" handler', () => {
    let handler;

    beforeEach(function () {
      let events = Component.prototype.events;
      handler = events['{$content} click'].bind({viewModel});
      spyOn(viewModel, 'applySort');
    });

    it('should call "applySort" method', () => {
      handler();

      expect(viewModel.applySort).toHaveBeenCalled();
    });
  });
});
