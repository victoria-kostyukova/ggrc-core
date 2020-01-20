/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canModel from 'can-model/src/can-model';

describe('validateGCA extension', () => {
  let TestModel;

  beforeAll(() => {
    TestModel = canModel.extend({
      is_custom_attributable: true,
    }, {
      define: {
        _gca_valid: {
          value: false,
          validate: {
            validateGCA: function () {
              return this;
            },
          },
        },
      },
    });
  });

  it('should return TRUE, is_custom_attributable - false, _gca_valid - false',
    () => {
      TestModel.is_custom_attributable = false;
      const instance = new TestModel();
      instance.attr('_gca_valid', false);
      expect(instance.validate()).toBeTruthy();
    }
  );

  it('should return TRUE. is_custom_attributable - true, _gca_valid - true',
    () => {
      TestModel.is_custom_attributable = true;
      const instance = new TestModel();
      instance.attr('_gca_valid', true);
      expect(instance.validate()).toBeTruthy();
    }
  );

  it('should return FALSE. is_custom_attributable - true, _gca_valid - false',
    () => {
      TestModel.is_custom_attributable = true;
      const instance = new TestModel();
      instance.attr('_gca_valid', false);
      expect(instance.validate()).toBeFalsy();
    }
  );
});
