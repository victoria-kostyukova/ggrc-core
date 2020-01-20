/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../assessment-tree-actions';
import {getComponentVM} from '../../../../../js_specs/spec-helpers';
import * as BulkUpdateService from '../../../../plugins/utils/bulk-update-service';

describe('assessment-tree-actions component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('showBulkVerify get() method', () => {
    let method;
    let setAttrValue;
    let dfd;

    beforeEach(() => {
      method = viewModel.define.showBulkVerify.get.bind(viewModel);
      setAttrValue = jasmine.createSpy('setAttrValue');
      dfd = $.Deferred();
      spyOn(BulkUpdateService, 'getAsmtCountForVerify')
        .and.returnValue(dfd);
    });

    it('calls setAttrValue() with "false" before requestAssessmentsCount call',
      () => {
        method(false, setAttrValue);

        expect(setAttrValue).toHaveBeenCalledWith(false);
      });

    it('calls getAsmtCountForVerify()', () => {
      method(false, setAttrValue);

      expect(BulkUpdateService.getAsmtCountForVerify)
        .toHaveBeenCalled();
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
