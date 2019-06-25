/*
  Copyright (C) 2019 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import canMap from 'can-map';
import Component from './assessment-template-attributes';
import {getComponentVM} from '../../../../js_specs/spec_helpers';

describe('assessment-template-attributes component', function () {
  describe('fieldRemoved() method', function () {
    let viewModel;
    let remainingFields;

    beforeEach(function () {
      viewModel = getComponentVM(Component);
    });

    it('removes the deleted field from the fields list', function () {
      let deletedField = new canMap({id: 4, title: 'bar'});

      let currentFields = [
        new canMap({id: 17, title: 'foo'}),
        new canMap({id: 4, title: 'bar'}),
        new canMap({id: 52, title: 'baz'}),
      ];
      viewModel.attr('fields').replace(currentFields);

      viewModel.fieldRemoved(deletedField);

      remainingFields = loMap(viewModel.fields, 'title');
      expect(remainingFields).toEqual(['foo', 'baz']);
    });

    it('removes the field without id from the fields list', function () {
      let deletedField = new canMap({title: 'bar'});

      let currentFields = [
        new canMap({id: 17, title: 'foo'}),
        new canMap({title: 'bar'}),
        new canMap({id: 52, title: 'baz'}),
      ];
      viewModel.attr('fields').replace(currentFields);

      viewModel.fieldRemoved(deletedField);

      remainingFields = loMap(viewModel.fields, 'title');
      expect(remainingFields).toEqual(['foo', 'baz']);
    });

    it('doesn\'t change the fields list if field doesn\'t match', function () {
      let deletedField = new canMap({title: 'barbaz'});

      let currentFields = [
        new canMap({id: 17, title: 'foo'}),
        new canMap({id: 4, title: 'bar'}),
        new canMap({id: 52, title: 'baz'}),
      ];
      viewModel.attr('fields').replace(currentFields);

      spyOn(console, 'warn');

      viewModel.fieldRemoved(deletedField);

      remainingFields = loMap(viewModel.fields, 'title');
      expect(remainingFields).toEqual(['foo', 'bar', 'baz']);
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
