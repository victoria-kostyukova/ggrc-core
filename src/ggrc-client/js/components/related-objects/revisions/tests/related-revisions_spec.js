/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../related-revisions';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import Revision from '../../../../models/service-models/revision';
import * as QueryAPI from '../../../../plugins/utils/query-api-utils';

describe('RelatedRevisions component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('paging value getter', () => {
    it('returns Pagination object with correct pagination', () => {
      let pagination = viewModel.attr('paging');

      expect(pagination.attr('pageSizeSelect').serialize())
        .toEqual([5, 10, 15]);
    });
  });

  describe('loadRevisions() method', () => {
    let requestDeferred;

    beforeEach(() => {
      viewModel.attr('instance', {id: 1, type: 'Risk'});
      requestDeferred = $.Deferred();
      spyOn(viewModel, 'getRevisions').and.returnValue(requestDeferred);
    });

    it('should not load items if instance is undefined', () => {
      viewModel.attr('instance', undefined);
      viewModel.loadRevisions();
      expect(viewModel.getRevisions).not.toHaveBeenCalled();
      expect(viewModel.attr('loading')).toBeFalsy();
    });

    it('turns on loading flag', () => {
      viewModel.attr('loading', false);
      viewModel.loadRevisions();

      expect(viewModel.attr('loading')).toBeTruthy();
    });

    it('gets revisions with params', () => {
      viewModel.attr('paging.current', 1);
      viewModel.attr('paging.pageSize', 5);
      viewModel.loadRevisions();
      expect(viewModel.getRevisions).toHaveBeenCalledWith(1, 6);
    });

    it('turns off loading flag if all is OK', (done) => {
      viewModel.attr('paging.current', 1);
      viewModel.attr('paging.pageSize', 5);

      viewModel.loadRevisions().then(() => {
        expect(viewModel.attr('loading')).toBeFalsy();
        done();
      });
      requestDeferred.resolve({
        revisions: ['revision3', 'revision2'],
        total: 3,
      });
    });

    it('sets paging.total correctly', (done) => {
      viewModel.attr('paging.total', null);
      viewModel.attr('paging.current', 1);
      viewModel.attr('paging.pageSize', 5);

      viewModel.loadRevisions().then(() => {
        expect(viewModel.attr('paging.total')).toBe(3);
        done();
      });

      requestDeferred.resolve({
        revisions: ['revision3', 'revision2', 'revision1'],
        total: 4,
      });
    });

    it('sets revisions correctly', (done) => {
      viewModel.attr('revisions', null);
      viewModel.loadRevisions().then(() => {
        const revisions = viewModel.attr('revisions').attr();
        expect(revisions.length).toBe(2);
        expect(revisions[0]).toEqual('revision3');
        expect(revisions[1]).toEqual('revision2');
        done();
      });

      requestDeferred.resolve({
        revisions: ['revision3', 'revision2'],
        total: 3,
      });
    });
  });

  describe('loadLastRevision() method', () => {
    let requestDeferred;

    beforeEach(() => {
      viewModel.attr('instance', {id: 1, type: 'Risk'});
      requestDeferred = $.Deferred();
      spyOn(viewModel, 'getRevisions').and.returnValue(requestDeferred);
    });

    it('should not load last revision if instance is undefined', () => {
      viewModel.attr('instance', undefined);
      viewModel.loadLastRevision();
      expect(viewModel.getRevisions).not.toHaveBeenCalled();
    });

    it('sets lastRevision correctly', (done) => {
      viewModel.attr('lastRevision', null);
      viewModel.loadLastRevision().then(() => {
        expect(viewModel.attr('lastRevision')).toBe('lastRevision');
        done();
      });

      requestDeferred.resolve({
        revisions: ['lastRevision'],
        total: 3,
      });
    });
  });

  describe('getRevisions() method', () => {
    let requestDeferred;

    beforeEach(() => {
      viewModel.attr('instance', {id: 1, type: 'Risk'});
      requestDeferred = $.Deferred();
      spyOn(viewModel, 'getQueryFilter');
      spyOn(QueryAPI, 'batchRequests').and.returnValue(requestDeferred);
      spyOn(Revision, 'model').and.callFake((source) => source);
      spyOn(QueryAPI, 'buildParam').and.callFake((source) => source);
    });

    it('should load revisions and total correctly', (done) => {
      viewModel.getRevisions(1, 3).then(({revisions, total}) => {
        expect(revisions.length).toBe(3);
        expect(total).toBe(5);
        done();
      });

      requestDeferred.resolve({
        Revision: {
          count: 3,
          values: ['lastRevision', 'revision2', 'revision1'],
          total: 5,
        },
      });
    });

    it('should not return any values when no data was fetched', (done) => {
      viewModel.getRevisions(1, 3).then((response) => {
        expect(response).toBeUndefined();
        done();
      });

      requestDeferred.resolve({});
    });
  });
});
