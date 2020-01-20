/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../export-group';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('export-group component', function () {
  describe('events', function () {
    describe('addObjectType() method', function () {
      let data;
      let viewModel;

      beforeEach(function () {
        viewModel = getComponentVM(Component);
      });
      it('adds panel with "Program" type if data.type is undefined',
        function () {
          data = {};
          viewModel.addObjectType(data);
          expect(viewModel.attr('panels')[0].type).toEqual('Program');
        });
      it('adds panel with type from data if it is defined',
        function () {
          data = {type: 'Audit'};
          viewModel.addObjectType(data);
          expect(viewModel.attr('panels')[0].type).toEqual('Audit');
        });
      it('adds panel with snapshot_type equal to data.type and' +
      ' type equal to "Snapshot" if it is snapshot', function () {
        data = {
          type: 'Control',
          isSnapshots: 'true',
        };
        viewModel.addObjectType(data);
        expect(viewModel.attr('panels')[0].type).toEqual('Snapshot');
        expect(viewModel.attr('panels')[0].snapshot_type)
          .toEqual('Control');
      });
    });
  });
});
