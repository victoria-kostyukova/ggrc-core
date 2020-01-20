/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import Component from '../tree-actions';
import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
import * as AclUtils from '../../../plugins/utils/acl-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as Permission from '../../../permission';
import {getComponentVM, spyProp} from '../../../../js_specs/spec-helpers';
import * as BulkUpdateService from '../../../plugins/utils/bulk-update-service';

describe('tree-actions component', () => {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
  });

  describe('addItem get() method', () => {
    describe('if there is options.objectVersion', () => {
      beforeEach(() => {
        vm.attr('options', {objectVersion: {data: 1}});
      });

      it('returns false', () => {
        expect(vm.attr('addItem')).toBe(false);
      });
    });

    describe('if there is no options.objectVersion', () => {
      beforeEach(() => {
        vm.attr('options', {objectVersion: null});
      });

      it('returns options.add_item_view if it exists', () => {
        let expectedData = new canMap({});
        vm.attr('options', {add_item_view: expectedData});
        expect(vm.attr('addItem')).toBe(expectedData);
      });

      it('returns model.tree_view_options.add_item_view by default',
        () => {
          let expectedData = new canMap({});
          vm.attr('options', {add_item_view: null});
          vm.attr('model', {
            tree_view_options: {
              add_item_view: expectedData,
            },
          });
          expect(vm.attr('addItem')).toBe(expectedData);
        });
    });

    it('if _is_sox_restricted is true returns false', () => {
      vm.attr('parentInstance', {_is_sox_restricted: true});
      expect(vm.attr('addItem')).toBe(false);
    });
  });

  describe('isSnapshot get() method', () => {
    let isSnapshotRelated;

    beforeEach(() => {
      isSnapshotRelated = spyOn(SnapshotUtils, 'isSnapshotRelated');
      vm.attr('parentInstance', {data: 'Data', type: 'Audit'});
      vm.attr('model', {model_singular: 'modelSingular'});
    });

    describe('if parentInstance is a snapshot scope and ' +
    'model.model_singular is a snapshot model', () => {
      beforeEach(() => {
        isSnapshotRelated.and.returnValue(true);
      });

      it('returns true value', function () {
        expect(vm.attr('isSnapshots')).toBeTruthy();
        expect(isSnapshotRelated).toHaveBeenCalledWith(
          vm.attr('parentInstance').type, vm.attr('model.model_singular')
        );
      });
    });

    it('returns options.objectVersion by default', () => {
      vm.attr('options', {objectVersion: {data: 'Data'}});
      expect(vm.attr('isSnapshots')).toBeTruthy();
    });

    describe('if parent_instance is not a snapshot scope or ' +
    'model.model_singular is not a snapshot model', () => {
      beforeEach(() => {
        isSnapshotRelated.and.returnValue(false);
      });

      it('returns true value if there is options.objectVersion', () => {
        vm.attr('options', {objectVersion: {data: 'Data'}});
        expect(vm.attr('isSnapshots')).toBeTruthy();
      });

      it('returns false value if there is no options.objectVersion',
        () => {
          vm.attr('options', {objectVersion: null});
          expect(vm.attr('isSnapshots')).toBeFalsy();
        });
    });
  });

  describe('showImport get() method', () => {
    beforeEach(() => {
      vm.attr('model', {model_singular: 'shortName'});
      vm.attr('parentInstance', {context: {}});
    });

    it('returns true when objects are not snapshots and user has permissions',
      () => {
        spyOn(Permission, 'isAllowed').and.returnValue(true);

        expect(vm.attr('showImport')).toBeTruthy();
      });

    it('returns false for snapshots', () => {
      vm.attr('options', {objectVersion: {data: 'Data'}});
      spyOn(Permission, 'isAllowed').and.returnValue(true);

      expect(vm.attr('showImport')).toBeFalsy();
    });

    it('returns false for changeable externally model', () => {
      vm.attr('model', {
        model_singular: 'Control',
        isChangeableExternally: true,
      });
      spyOn(Permission, 'isAllowed').and.returnValue(true);

      expect(vm.attr('showImport')).toBeFalsy();
    });

    it(`returns false when user does not have update permissions
      and is not auditor`, () => {
      spyOn(Permission, 'isAllowed').and.returnValue(false);
      spyOn(AclUtils, 'isAuditor').and.returnValue(false);

      expect(vm.attr('showImport')).toBeFalsy();
    });

    it('returns true when user has update permissions but is not auditor',
      () => {
        spyOn(Permission, 'isAllowed').and.returnValue(true);
        spyOn(AclUtils, 'isAuditor').and.returnValue(false);

        expect(vm.attr('showImport')).toBeTruthy();
      });

    it(`returns true when user has auditor rights
      but does not have update permissions`, () => {
      spyOn(Permission, 'isAllowed').and.returnValue(false);
      spyOn(AclUtils, 'isAuditor').and.returnValue(true);

      expect(vm.attr('showImport')).toBeTruthy();
    });
  });

  describe('show3bbs get() method', () => {
    it('returns false for MyAssessments page', () => {
      vm.attr('model', {model_singular: 'any page'});
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(true);

      expect(vm.attr('show3bbs')).toBeFalsy();
    });

    it('returns false for Documents page', () => {
      vm.attr('model', {model_singular: 'Document'});
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

      expect(vm.attr('show3bbs')).toBeFalsy();
    });

    it('returns false for Evidence page', () => {
      vm.attr('model', {model_singular: 'Evidence'});
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

      expect(vm.attr('show3bbs')).toBeFalsy();
    });

    it('returns true for any page except My assessments, Document, Evidence',
      () => {
        vm.attr('model', {model_singular: 'any page'});
        spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

        expect(vm.attr('show3bbs')).toBeTruthy();
      });
  });

  describe('isAssessmentOnAudit get() method', () => {
    it('returns true for Assessments tab on Audit page', () => {
      vm.attr('parentInstance', {type: 'Audit'});
      vm.attr('model', {model_singular: 'Assessment'});

      expect(vm.attr('isAssessmentOnAudit')).toBe(true);
    });

    it('returns false for any tab except Assessments tab on Audit page',
      () => {
        vm.attr('parentInstance', {type: 'Audit'});
        vm.attr('model', {model_singular: 'Issue'});

        expect(vm.attr('isAssessmentOnAudit')).toBe(false);
      });

    it('returns false for any page except Audit page', () => {
      vm.attr('parentInstance', {type: 'Person'});
      vm.attr('model', {model_singular: 'Assessment'});

      expect(vm.attr('isAssessmentOnAudit')).toBe(false);
    });
  });

  describe('showBulkVerify get() method', () => {
    let method;
    let setAttrValue;

    beforeEach(() => {
      method = vm.define.showBulkVerify.get.bind(vm);
      setAttrValue = jasmine.createSpy('setAttrValue');
    });

    describe('when isAssessmentOnAudit attr is false', () => {
      beforeEach(() => {
        spyProp(vm, 'isAssessmentOnAudit').and.returnValue(false);
      });

      it('calls setAttrValue() with "false"', () => {
        method(false, setAttrValue);

        expect(setAttrValue).toHaveBeenCalledWith(false);
      });

      it('does not call getAsmtCountForVerify()', () => {
        spyOn(BulkUpdateService, 'getAsmtCountForVerify');

        method(false, setAttrValue);

        expect(BulkUpdateService.getAsmtCountForVerify)
          .not.toHaveBeenCalled();
      });
    });

    describe('when isAssessmentOnAudit attr is true', () => {
      let dfd;

      beforeEach(() => {
        spyProp(vm, 'isAssessmentOnAudit').and.returnValue(true);
        vm.attr('parentInstance', {
          type: 'Audit',
          id: 123,
        });
        dfd = $.Deferred();
        spyOn(BulkUpdateService, 'getAsmtCountForVerify')
          .and.returnValue(dfd);
      });

      it('calls setAttrValue() before getAsmtCountForVerify() call', () => {
        method(false, setAttrValue);

        expect(setAttrValue).toHaveBeenCalledWith(false);
      });

      it('calls getAsmtCountForVerify() with specified params', () => {
        method(false, setAttrValue);

        expect(BulkUpdateService.getAsmtCountForVerify).toHaveBeenCalledWith({
          type: 'Audit',
          id: 123,
          operation: 'relevant',
        });
      });

      it('calls setAttrValue() two times with specified params', (done) => {
        method(false, setAttrValue);

        dfd.resolve(3)
          .then(() => {
            expect(setAttrValue).toHaveBeenCalledTimes(2);
            expect(setAttrValue.calls.first().args[0]).toBe(false);
            expect(setAttrValue.calls.mostRecent().args[0]).toBe(true);
            done();
          });
      });

      it('calls setAttrValue() with "true" ' +
      'if received assessments count > 0', (done) => {
        method(false, setAttrValue);

        dfd.resolve(3).then(() => {
          expect(setAttrValue).toHaveBeenCalledWith(true);
          done();
        });
      });

      it('calls setAttrValue() with "false" ' +
      'if received assessments count <= 0', (done) => {
        method(false, setAttrValue);

        dfd.resolve(0).then(() => {
          expect(setAttrValue).toHaveBeenCalledWith(false);
          done();
        });
      });
    });
  });
});
