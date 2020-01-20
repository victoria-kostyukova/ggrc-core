/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../prev-next-buttons';

describe('prev-next-buttons component', function () {
  'use strict';

  describe('hasNext getter', function () {
    let viewModel;

    beforeAll(function () {
      viewModel = getComponentVM(Component);
    });

    it('returns true when current index is less than total',
      function () {
        let result;
        viewModel.attr('currentIndex', 1);
        viewModel.attr('totalCount', 3);

        result = viewModel.attr('hasNext');

        expect(result).toBeTruthy();
      });

    it('returns false when current index is greater than total',
      function () {
        let result;
        viewModel.attr('currentIndex', 4);
        viewModel.attr('totalCount', 3);

        result = viewModel.attr('hasNext');

        expect(result).toBeFalsy();
      });

    it('returns false when current index is equal to last item number',
      function () {
        let result;
        viewModel.attr('currentIndex', 2);
        viewModel.attr('totalCount', 3);

        result = viewModel.attr('hasNext');

        expect(result).toBeFalsy();
      });

    it('returns false when current index is equal to total',
      function () {
        let result;
        viewModel.attr('currentIndex', 3);
        viewModel.attr('totalCount', 3);

        result = viewModel.attr('hasNext');

        expect(result).toBeFalsy();
      });

    it('returns false if "disabled" attr is true',
      function () {
        viewModel.attr('disabled', true);
        viewModel.attr('currentIndex', 1);
        viewModel.attr('totalCount', 3);

        expect(viewModel.attr('hasNext')).toBeFalsy();
      });
  });

  describe('hasPrev getter', function () {
    let viewModel;

    beforeAll(function () {
      viewModel = getComponentVM(Component);
    });

    it('returns true when current index is greater than 0',
      function () {
        let result;
        viewModel.attr('currentIndex', 1);

        result = viewModel.attr('hasPrev');

        expect(result).toBeTruthy();
      });

    it('returns false when current index equals 0',
      function () {
        let result;
        viewModel.attr('currentIndex', 0);

        result = viewModel.attr('hasPrev');

        expect(result).toBeFalsy();
      });

    it('returns false if "disabled" attr is true',
      function () {
        viewModel.attr('disabled', true);
        viewModel.attr('currentIndex', 1);

        expect(viewModel.attr('hasPrev')).toBeFalsy();
      });
  });

  describe('setNext method', function () {
    let viewModel;

    beforeAll(function () {
      viewModel = getComponentVM(Component);
    });

    it('increments current index when there is next item',
      function () {
        let result;
        viewModel.attr('currentIndex', 1);
        viewModel.attr('totalCount', 3);

        viewModel.setNext();
        result = viewModel.attr('currentIndex');

        expect(result).toEqual(2);
      });

    it('leaves current index as is when it is last item',
      function () {
        let result;
        viewModel.attr('currentIndex', 2);
        viewModel.attr('totalCount', 3);

        viewModel.setNext();
        result = viewModel.attr('currentIndex');

        expect(result).toEqual(2);
      });

    it('leaves current index as is when there is no next item',
      function () {
        let result;
        viewModel.attr('currentIndex', 3);
        viewModel.attr('totalCount', 3);

        viewModel.setNext();
        result = viewModel.attr('currentIndex');

        expect(result).toEqual(3);
      });
  });

  describe('setPrev method', function () {
    let viewModel;

    beforeAll(function () {
      viewModel = getComponentVM(Component);
    });

    it('decrements current index when there is previous item',
      function () {
        let result;
        viewModel.attr('currentIndex', 1);

        viewModel.setPrev();
        result = viewModel.attr('currentIndex');

        expect(result).toEqual(0);
      });

    it('leaves current index as is when there is no previous item',
      function () {
        let result;
        viewModel.attr('currentIndex', 0);

        viewModel.setPrev();
        result = viewModel.attr('currentIndex');

        expect(result).toEqual(0);
      });
  });
});
