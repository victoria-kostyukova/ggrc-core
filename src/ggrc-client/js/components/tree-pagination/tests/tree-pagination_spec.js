/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Pagination from '../../base-objects/pagination';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tree-pagination';

describe('tree-pagination component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  beforeEach(() => {
    viewModel.paging = new Pagination({
      pageSize: 10,
      disabled: false,
    });
    viewModel.paging.attr('count', 3);
    viewModel.paging.attr('current', 1);
  });

  describe('paginationInfo() method in helpers', () => {
    it('returns info about visible items on page', () => {
      let result;
      viewModel.paging.attr('pageSize', 10);
      viewModel.paging.attr('total', 3000);
      viewModel.paging.attr('current', 15);
      result = viewModel.getPaginationInfo();
      expect(result).toEqual('141-150 of 3000');
    });

    it('returns "No records" if we don\'t have elements', () => {
      let result;
      viewModel.paging.attr('current', 0);
      viewModel.paging.attr('total', 0);
      result = viewModel.getPaginationInfo();
      expect(result).toEqual('No records');
    });
  });
  describe('setNextPage() method ', () => {
    it('changes current and increase it by 1', () => {
      viewModel.paging.attr('current', 1);
      viewModel.paging.attr('count', 3);
      viewModel.setNextPage();
      expect(viewModel.paging.current).toEqual(2);
    });
    it('doesn\'t change current value if current equal amount of pages',
      () => {
        viewModel.paging.attr('current', 3);
        viewModel.setNextPage();
        expect(viewModel.paging.current).toEqual(3);
      });
  });
  describe('setPrevPage() method ', () => {
    it('changes current and decrease it by 1', () => {
      viewModel.paging.attr('current', 2);
      viewModel.setPrevPage();
      expect(viewModel.paging.current).toEqual(1);
    });
    it('doesn\'t change current value if current equal 1',
      () => {
        viewModel.paging.attr('current', 1);
        viewModel.setPrevPage();
        expect(viewModel.paging.current).toEqual(1);
      });
  });
  describe('setFirstPage() method ', () => {
    it('changes current if current more than 1', () => {
      viewModel.paging.attr('current', 3);
      viewModel.setFirstPage();
      expect(viewModel.paging.current).toEqual(1);
    });
  });
  describe('setLastPage() method ', () => {
    it('changes current if current less than amount of pages', () => {
      viewModel.paging.attr('count', 3);
      viewModel.paging.attr('current', 2);
      viewModel.setLastPage();
      expect(viewModel.paging.current).toEqual(3);
    });
  });
  describe('setCurrentPage() method ', () => {
    it('changes current page',
      () => {
        viewModel.setCurrentPage(2);
        expect(viewModel.paging.current).toEqual(2);
      });
  });
  describe('setPageSize() method ', () => {
    it('sets page size',
      () => {
        viewModel.setPageSize(50);
        expect(viewModel.paging.pageSize).toEqual(50);
      });
  });
  describe('pagesList() method ', () => {
    it('returns array of pages',
      () => {
        viewModel.paging.attr('count', 11);
        let result = viewModel.pagesList();
        expect(result.length).toEqual(11);
      });
    it('returns current indexes',
      () => {
        viewModel.paging.attr('count', 12);
        let result = viewModel.pagesList();
        expect(result[0]).toEqual(1);
        expect(result[11]).toEqual(12);
      });
  });
  describe('getPageTitle() method ', () => {
    it('returns correct title',
      () => {
        viewModel.paging.attr('pageSize', 15);
        viewModel.paging.attr('total', 56);

        let result = viewModel.getPageTitle(1);
        expect(result).toEqual('Page 1: 1-15');

        result = viewModel.getPageTitle(4);
        expect(result).toEqual('Page 4: 46-56');
      });
  });
});
