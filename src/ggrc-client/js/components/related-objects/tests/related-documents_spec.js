/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../related-documents';
import Relationship from '../../../models/service-models/relationship';
import * as notifierUtils from '../../../plugins/utils/notifiers-utils';

describe('related-documents component', () => {
  let viewModel;
  let instance;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    instance = new canMap({
      id: '5',
      type: 'Assessment',
    });

    viewModel.instance = instance;
  });

  describe('getDocumentsQuery() method', () => {
    function checkAdditionFilter(kind) {
      let query;
      let additionFilter;
      viewModel.kind = kind;
      query = viewModel.getDocumentsQuery();

      expect(query.filters.expression).toBeDefined();
      additionFilter = query.filters.expression.right;
      expect(additionFilter.left).toEqual('kind');
      expect(additionFilter.right).toEqual(kind);
    }

    it('should get query for urls', () => {
      checkAdditionFilter('URL');
    });

    it('should get query for evidences', () => {
      checkAdditionFilter('FILE');
    });

    it('should get query for all documents', () => {
      let query;
      let expression;
      viewModel.kind = undefined;
      query = viewModel.getDocumentsQuery();
      expression = query.filters.expression;
      expect(expression).toBeDefined();
      expect(expression.object_name).toEqual(instance.type);
      expect(expression.ids[0]).toEqual(instance.id);
    });
  });

  describe('removeRelatedDocument() method', () => {
    let method;
    let findRelationshipSpy;
    let relationship = {
      destroy: () => {},
      id: 5,
    };

    beforeEach(() => {
      viewModel.isLoading = false;
      viewModel.documents = [{id: 1}, {id: 2}, {id: 3}];

      spyOn(viewModel, 'addPendingDestroy');
      spyOn(viewModel, 'removePendingDestroy');
      spyOn(notifierUtils, 'notifier');

      findRelationshipSpy = spyOn(Relationship, 'findRelationship')
        .and.returnValue($.Deferred().resolve(relationship));

      method = viewModel.removeRelatedDocument.bind(viewModel);
    });

    it('should remove document from documents list when list ' +
    'contains document', (done) => {
      expect(viewModel.documents.length).toBe(3);

      spyOn(relationship, 'destroy')
        .and.returnValue($.Deferred().resolve());

      method({id: 1}).then(() => {
        expect(viewModel.documents.length).toBe(2);
        expect(Relationship.findRelationship).toHaveBeenCalled();
        expect(relationship.destroy).toHaveBeenCalled();
        done();
      });
    });

    it('should NOT remove document from documents list when list does not ' +
    'contain document', (done) => {
      expect(viewModel.documents.length).toBe(3);

      spyOn(relationship, 'destroy')
        .and.returnValue($.Deferred().resolve());

      method({id: 55}).then(() => {
        expect(viewModel.documents.length).toBe(3);
        expect(Relationship.findRelationship).not.toHaveBeenCalled();
        expect(relationship.destroy).not.toHaveBeenCalled();
        done();
      });
    });

    it('should call "notifier" when "findRelationship" ' +
    'returns undefined', (done) => {
      findRelationshipSpy.and.returnValue($.Deferred().resolve());

      method({id: 1}).catch((err) => {
        expect(notifierUtils.notifier).toHaveBeenCalledWith(
          'error',
          'Unable to find relationship'
        );
        done();
      });
    });

    it('should call "notifier" when "findRelationship" ' +
    'throws an error', (done) => {
      findRelationshipSpy.and.returnValue($.Deferred().reject());

      method({id: 1}).catch(() => {
        expect(notifierUtils.notifier).toHaveBeenCalledWith(
          'error',
          'Unable to find relationship'
        );
        done();
      });
    });

    it('should call "notifier" when "destroy" ' +
    'throws an error', (done) => {
      spyOn(relationship, 'destroy')
        .and.returnValue($.Deferred().reject());

      method({id: 1, title: 'my_title'}).catch(() => {
        expect(notifierUtils.notifier).toHaveBeenCalledWith(
          'error',
          'Unable to remove related document: my_title'
        );
        done();
      });
    });

    it('should call "removePendingDestroy" when "destroy" ' +
    'is successful', (done) => {
      spyOn(relationship, 'destroy')
        .and.returnValue($.Deferred().resolve());

      method({id: 1}).then(() => {
        expect(viewModel.removePendingDestroy).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('removePendingDestroy() method', () => {
    let method;

    beforeEach(() => {
      viewModel.pendingDestroy = [
        {id: 1, kind: 'file'},
        {id: 1, kind: 'url'},
        {id: 2, kind: 'file'},
        {id: 3, kind: 'url'},
      ];

      viewModel.isLoading = true;
      method = viewModel.removePendingDestroy.bind(viewModel);
    });

    it('should NOT remove document from "pendingDestroy" attr', () => {
      method({id: 2, kind: 'url'});
      expect(viewModel.pendingDestroy.length).toBe(4);
    });

    it('should remove document from "pendingDestroy" attr', () => {
      method({id: 1, kind: 'url'});
      expect(viewModel.pendingDestroy.length).toBe(3);
    });

    it('should NOT set "isLoading" flag to false when ' +
    '"pendingDestroy" is NOT empty', () => {
      method({id: 1, kind: 'url'});
      expect(viewModel.isLoading).toBe(true);
    });

    it('should set "isLoading" flag to false when ' +
    '"pendingDestroy" is empty', () => {
      viewModel.pendingDestroy = [{id: 1, kind: 'url'}];
      method({id: 1, kind: 'url'});

      expect(viewModel.isLoading).toBe(false);
    });
  });
});
