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
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import * as BulkUpdateService from '../../../plugins/utils/bulk-update-service';

describe('tree-actions component', () => {
  let vm;

  beforeEach(function () {
    vm = getComponentVM(Component);
  });

  describe('addItem get() method', () => {
    beforeEach(() => {
      spyOn(vm, 'isUpdateDenied').and.returnValue(false);
    });

    describe('if there is options.objectVersion', () => {
      beforeEach(() => {
        vm.options = {objectVersion: {data: 1}};
      });

      it('returns false', () => {
        expect(vm.addItem).toBe(false);
      });
    });

    describe('if there is no options.objectVersion', () => {
      beforeEach(() => {
        vm.options = {objectVersion: null};
        vm.parentInstance = new canMap({});
      });

      it('returns options.add_item_view if it exists', () => {
        let expectedData = new canMap({});
        vm.options = {add_item_view: expectedData};
        expect(vm.addItem).toBe(expectedData);
      });

      it('returns model.tree_view_options.add_item_view by default',
        () => {
          let expectedData = new canMap({});
          vm.options = {add_item_view: null};
          vm.model = {
            tree_view_options: {
              add_item_view: expectedData,
            },
          };
          expect(vm.addItem).toBe(expectedData);
        });
    });

    it('if _is_sox_restricted is true returns false', () => {
      vm.options = {};
      vm.model = {
        tree_view_options: {},
      };
      vm.parentInstance = new canMap({_is_sox_restricted: true});
      expect(vm.addItem).toBe(false);
    });

    it('if user doesn\'t have permissions for update returns false',
      () => {
        vm.options = {};
        vm.parentInstance = new canMap({});
        vm.isUpdateDenied.and.returnValue(true);

        expect(vm.addItem).toBe(false);
      });
  });

  describe('isSnapshot get() method', () => {
    let isSnapshotRelated;

    beforeEach(() => {
      isSnapshotRelated = spyOn(SnapshotUtils, 'isSnapshotRelated');
      vm.parentInstance = new canMap({data: 'Data', type: 'Audit'});
      vm.model = {model_singular: 'modelSingular'};
    });

    describe('if parentInstance is a snapshot scope and ' +
    'model.model_singular is a snapshot model', () => {
      beforeEach(() => {
        isSnapshotRelated.and.returnValue(true);
      });

      it('returns true value', function () {
        expect(vm.isSnapshots).toBeTruthy();
        expect(isSnapshotRelated).toHaveBeenCalledWith(
          vm.parentInstance.type, vm.model.model_singular
        );
      });
    });

    it('returns options.objectVersion by default', () => {
      vm.options = {objectVersion: {data: 'Data'}};
      expect(vm.isSnapshots).toBeTruthy();
    });

    describe('if parent_instance is not a snapshot scope or ' +
    'model.model_singular is not a snapshot model', () => {
      beforeEach(() => {
        isSnapshotRelated.and.returnValue(false);
      });

      it('returns true value if there is options.objectVersion', () => {
        vm.options = {objectVersion: {data: 'Data'}};
        expect(vm.isSnapshots).toBeTruthy();
      });

      it('returns false value if there is no options.objectVersion',
        () => {
          vm.options = {objectVersion: null};
          expect(vm.isSnapshots).toBeFalsy();
        });
    });
  });

  describe('showImport get() method', () => {
    beforeEach(() => {
      vm.model = {model_singular: 'shortName'};
      vm.parentInstance = new canMap({context: {}});
      vm.options = {};
    });

    it('returns true when objects are not snapshots and user has permissions',
      () => {
        spyOn(Permission, 'isAllowed').and.returnValue(true);

        expect(vm.showImport).toBeTruthy();
      });

    it('returns false for snapshots', () => {
      vm.options = {objectVersion: {data: 'Data'}};
      spyOn(Permission, 'isAllowed').and.returnValue(true);

      expect(vm.showImport).toBeFalsy();
    });

    it('returns false for changeable externally model', () => {
      vm.model = {
        model_singular: 'Control',
        isChangeableExternally: true,
      };
      spyOn(Permission, 'isAllowed').and.returnValue(true);

      expect(vm.showImport).toBeFalsy();
    });

    it(`returns false when user does not have update permissions
      and is not auditor`, () => {
      spyOn(Permission, 'isAllowed').and.returnValue(false);
      spyOn(AclUtils, 'isAuditor').and.returnValue(false);

      expect(vm.showImport).toBeFalsy();
    });

    it('returns true when user has update permissions but is not auditor',
      () => {
        spyOn(Permission, 'isAllowed').and.returnValue(true);
        spyOn(AclUtils, 'isAuditor').and.returnValue(false);

        expect(vm.showImport).toBeTruthy();
      });

    it(`returns true when user has auditor rights
      but does not have update permissions`, () => {
      spyOn(Permission, 'isAllowed').and.returnValue(false);
      spyOn(AclUtils, 'isAuditor').and.returnValue(true);

      expect(vm.showImport).toBeTruthy();
    });
  });

  describe('show3bbs get() method', () => {
    it('returns false for MyAssessments page', () => {
      vm.model = {model_singular: 'any page'};
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(true);

      expect(vm.show3bbs).toBeFalsy();
    });

    it('returns false for Documents page', () => {
      vm.model = {model_singular: 'Document'};
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

      expect(vm.show3bbs).toBeFalsy();
    });

    it('returns false for Evidence page', () => {
      vm.model = {model_singular: 'Evidence'};
      spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

      expect(vm.show3bbs).toBeFalsy();
    });

    it('returns true for any page except My assessments, Document, Evidence',
      () => {
        vm.model = {model_singular: 'any page'};
        spyOn(CurrentPageUtils, 'isMyAssessments').and.returnValue(false);

        expect(vm.show3bbs).toBeTruthy();
      });
  });

  describe('isAssessmentOnAudit get() method', () => {
    it('returns true for Assessments tab on Audit page', () => {
      vm.parentInstance = new canMap({type: 'Audit'});
      vm.model = {model_singular: 'Assessment'};

      expect(vm.isAssessmentOnAudit).toBe(true);
    });

    it('returns false for any tab except Assessments tab on Audit page',
      () => {
        vm.parentInstance = new canMap({type: 'Audit'});
        vm.model = {model_singular: 'Issue'};

        expect(vm.isAssessmentOnAudit).toBe(false);
      });

    it('returns false for any page except Audit page', () => {
      vm.parentInstance = new canMap({type: 'Person'});
      vm.model = {model_singular: 'Assessment'};

      expect(vm.isAssessmentOnAudit).toBe(false);
    });
  });

  describe('setShowBulkVerify method', () => {
    let method;
    beforeEach(() => {
      vm.parentInstance = new canMap({
        type: 'Audit',
      });
      vm.model = {
        model_singular: 'Assessment',
      };

      method = vm.setShowBulkVerify.bind(vm);
    });

    it('should not call "getAsmtCountForVerify" when "isAssessmentOnAudit" ' +
    'is false', () => {
      spyOn(BulkUpdateService, 'getAsmtCountForVerify');
      vm.parentInstance.attr('type', 'Issue');

      method();
      expect(BulkUpdateService.getAsmtCountForVerify).not.toHaveBeenCalled();
    });

    it('should call "getAsmtCountForVerify" when "isAssessmentOnAudit" ' +
    'is true', () => {
      spyOn(BulkUpdateService, 'getAsmtCountForVerify')
        .and.returnValue($.Deferred().resolve());
      method();
      expect(BulkUpdateService.getAsmtCountForVerify).toHaveBeenCalled();
    });

    it('should set "showBulkVerify" to false when "getAsmtCountForVerify" ' +
    'returns count === 0', (done) => {
      const dfd = $.Deferred();

      spyOn(BulkUpdateService, 'getAsmtCountForVerify').and.returnValue(dfd);

      method();
      dfd.then(() => {
        expect(vm.showBulkVerify).toBeFalsy();
        done();
      });

      dfd.resolve(0);
    });

    it('should set "showBulkVerify" to true when "getAsmtCountForVerify" ' +
    'returns count > 0', (done) => {
      const dfd = $.Deferred();

      spyOn(BulkUpdateService, 'getAsmtCountForVerify').and.returnValue(dfd);

      method();
      dfd.then(() => {
        expect(vm.showBulkVerify).toBeTruthy();
        done();
      });

      dfd.resolve(5);
    });
  });

  describe('isUpdateDenied() method', () => {
    beforeEach(() => {
      spyOn(Permission, 'isAllowedFor');
    });

    it('return false if parentInstance type doesn\'t equal "Workflow"', () => {
      vm.parentInstance = {
        type: 'test_type',
      };

      const result = vm.isUpdateDenied();

      expect(result).toBe(false);
    });

    it('return false if user have permission for update Workflow', () => {
      Permission.isAllowedFor.and.returnValue(true);

      vm.parentInstance = {
        type: 'Workflow',
      };

      const result = vm.isUpdateDenied();

      expect(result).toBe(false);
    });

    it('return true if user doesn\'t have permission for update Workflow',
      () => {
        Permission.isAllowedFor.and.returnValue(false);

        vm.parentInstance = {
          type: 'Workflow',
        };

        const result = vm.isUpdateDenied();

        expect(result).toBe(true);
      });
  });
});
