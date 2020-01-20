/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canList from 'can-list';
import AssessmentTemplate from '../assessment-template';
import {makeFakeInstance} from '../../../../js_specs/spec-helpers';

describe('AssessmentTemplate model', () => {
  let instance;

  beforeEach(() => {
    instance = makeFakeInstance({model: AssessmentTemplate})();
  });

  describe('formPreload method', () => {
    it('adds custom_attribute_definitions field', () => {
      expect(instance.custom_attribute_definitions)
        .toBeUndefined();

      instance.formPreload(true, null, {});

      expect(instance.custom_attribute_definitions instanceof canList)
        .toBeTruthy();
    });
  });
});
