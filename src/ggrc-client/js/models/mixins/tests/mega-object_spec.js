/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {makeFakeModel} from '../../../../js_specs/spec-helpers';
import Program from '../../business-models/program';

describe('MegaObject mixin', () => {
  let model;

  beforeEach(function () {
    model = makeFakeModel({model: Program});
  });

  describe('created model', () => {
    it('should has "isMegaObject" equal to true', () => {
      expect(model.isMegaObject).toBe(true);
    });
  });

  describe('"after:init" event', () => {
    it('should set mega_attr_list attributes', () => {
      expect(model.tree_view_options.mega_attr_list).toEqual([{
        attr_title: 'Map as',
        attr_name: 'map_as',
        attr_type: 'map_as',
        order: 41,
        disable_sorting: true,
        mandatory: true,
      }]);
    });
  });
});
