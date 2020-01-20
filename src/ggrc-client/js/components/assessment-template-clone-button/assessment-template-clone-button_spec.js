/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from './assessment-template-clone-button';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import router from '../../router';
import * as CurrentPageUtils from '../../plugins/utils/current-page-utils';

describe('assessment-template-clone-button component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('refreshTreeView() method', () => {
    let pageInstanceSpy;
    let routerSpy;

    beforeEach(() => {
      spyOn(vm, 'dispatch');
      routerSpy = spyOn(router, 'attr');
      pageInstanceSpy = spyOn(CurrentPageUtils, 'getPageInstance');
    });

    it('dispatches "refreshTree" if it is Audit page ' +
    'and assessment_template widget', () => {
      pageInstanceSpy.and.returnValue({type: 'Audit'});
      routerSpy.and.returnValue('assessment_template');

      vm.refreshTreeView();

      expect(vm.dispatch).toHaveBeenCalledWith('refreshTree');
    });

    it('sets "assessment_template" to router with refetch flag ' +
    'if it is Audit page but not assessment_template widget', () => {
      pageInstanceSpy.and.returnValue({type: 'Audit'});

      vm.refreshTreeView();

      expect(router.attr).toHaveBeenCalledWith({
        widget: 'assessment_template',
        refetch: true,
      });
    });

    it('sets "assessment_template" to router with refetch flag ' +
    'if it is Audit page but not assessment_template widget', () => {
      pageInstanceSpy.and.returnValue({type: 'People'});

      vm.refreshTreeView();

      expect(router.attr).not.toHaveBeenCalledWith({
        widget: 'assessment_template',
        refetch: true,
      });
      expect(vm.dispatch).not.toHaveBeenCalledWith('refreshTree');
    });
  });
});
