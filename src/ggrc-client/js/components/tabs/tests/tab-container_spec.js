/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../tab-container';

describe('tab-container component', function () {
  'use strict';

  let viewModel;

  describe('setActivePanel() method ', function () {
    let selectedScope;
    let secondScope;
    let thirdScope;
    let selectionIndex = Date.now();

    beforeEach(function () {
      viewModel = getComponentVM(Component);
      selectedScope = new canMap({
        tabIndex: selectionIndex,
        titleText: 'Some test value ',
        active: false,
      });
      secondScope = new canMap({
        tabIndex: 9999,
        titleText: 'Some test value ',
        active: false,
      });
      thirdScope = new canMap({
        tabIndex: 8888,
        titleText: 'Some test value ',
        active: false,
      });
      viewModel.attr('panels').push(secondScope, selectedScope, thirdScope);
    });

    it('should select panel with correct tabIndex', function () {
      // Get index of selectedScope
      let index = viewModel.attr('panels').indexOf(selectedScope);

      viewModel.setActivePanel(selectedScope.attr('tabIndex'));

      expect(viewModel.attr('panels')[index].attr('active')).toBe(true);
    });
  });

  describe('setDefaultActivePanel() method ', function () {
    let scope;
    let secondScope;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
      scope = new canMap({
        tabIndex: 1111,
        titleText: 'Some test value ',
        active: false,
      });
      secondScope = new canMap({
        tabIndex: 9999,
        titleText: 'Some test value ',
        active: false,
      });
      viewModel.attr('panels').push(scope, secondScope);
    });

    it('should select the first panel' +
      ' if no selectedTabIndex is defined', function () {
      viewModel.setDefaultActivePanel();

      expect(viewModel.attr('panels')[0].attr('active')).toBe(true);
      expect(viewModel.attr('panels')[1].attr('active')).toBe(false);
    });

    it('should select the panel with tabIndex' +
      ' same as selectedTabIndex', function () {
      viewModel.attr('selectedTabIndex', secondScope.attr('tabIndex'));
      viewModel.setDefaultActivePanel();

      expect(viewModel.attr('panels')[0].attr('active')).toBe(false);
      expect(viewModel.attr('panels')[1].attr('active')).toBe(true);
    });
  });
});
