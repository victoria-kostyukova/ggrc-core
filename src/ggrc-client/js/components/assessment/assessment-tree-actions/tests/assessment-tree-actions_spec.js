/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-tree-actions';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as BulkUpdateService from '../../../../plugins/utils/bulk-update-service';

describe('assessment-tree-actions component', () => {
  let viewModel;
  let getAsmtCountForVerifySpy;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    getAsmtCountForVerifySpy =
      spyOn(BulkUpdateService, 'getAsmtCountForVerify');
  });

  describe('setShowBulkVerify() method', () => {
    it('should set "showBulkVerify" to false when "getAsmtCountForVerify" ' +
    'returns count === 0', (done) => {
      const dfd = $.Deferred();

      getAsmtCountForVerifySpy.and.returnValue(dfd);
      viewModel.setShowBulkVerify();

      dfd.resolve(0);
      dfd.then(() => {
        expect(viewModel.showBulkVerify).toBeFalsy();
        done();
      });
    });

    it('should set "showBulkVerify" to true when "getAsmtCountForVerify" ' +
    'returns count > 0', (done) => {
      const dfd = $.Deferred();

      getAsmtCountForVerifySpy.and.returnValue(dfd);
      viewModel.setShowBulkVerify();

      dfd.resolve(5);
      dfd.then(() => {
        expect(viewModel.showBulkVerify).toBeTruthy();
        done();
      });
    });
  });
});
