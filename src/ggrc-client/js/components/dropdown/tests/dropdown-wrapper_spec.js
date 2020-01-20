/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canList from 'can-list';
import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../dropdown-wrapper';

describe('dropdown-wrapper component', () => {
  let viewModel;
  let response;
  let findDfd;
  let testType;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
    response = [
      {id: 1, title: '1 item', extra: 'extra'},
      {id: 2, title: '2 item', extra: 'extra'},
      {id: 3, title: '3 item', extra: 'extra'},
      {id: 4, title: '4 item', extra: 'extra'},
    ];

    findDfd = $.Deferred();
    testType = canMap.extend({
      findAll: jasmine.createSpy('findAll').and.returnValue(findDfd),
      findInCacheById: jasmine.createSpy('findInCacheById')
        .and.returnValue({
          id: 'testId', title: 'testTitle', extra: 'extra',
        }),
    }, {});
  });

  describe('modelConstructor set()', () => {
    it('returns correct model constructor', () => {
      viewModel.attr('modelConstructor', testType);

      expect(viewModel.attr('modelConstructor')).toEqual(testType);
    });

    it('calls prepareOptions() with items returned from findAll()', (done) => {
      spyOn(viewModel, 'prepareOptions');

      viewModel.attr('modelConstructor', testType);
      findDfd.resolve(response);

      findDfd.then(() => {
        expect(viewModel.prepareOptions).toHaveBeenCalledWith(response);

        done();
      });
    });
  });

  describe('prepareOptions() method', () => {
    beforeEach(() => {
      viewModel.attr('modelConstructor', testType);
    });

    it('sets options and converts to a correct format', (done) => {
      viewModel.attr('value', {
        id: 2, title: '2 item', extra: 'extra',
      });
      let options = new canList([
        {id: 7, title: '7 item', type: 'Option'},
        {id: 9, title: '9 item', type: 'Option'},
      ]);

      findDfd.resolve(options);

      findDfd.then(() => {
        expect(viewModel.options.length).toEqual(options.length);
        options.forEach((opt, ind) => {
          expect(viewModel.options[ind].value).toEqual(opt.id);
          expect(viewModel.options[ind].title).toEqual(opt.title);
        });

        done();
      });
    });

    it('sets selected to empty string when "value" is not defined', (done) => {
      findDfd.resolve(response);

      findDfd.then(() => {
        expect(viewModel.selected).toEqual('');

        done();
      });
    });

    it('sets selected to correct "Option" id', (done) => {
      viewModel.attr('value', {
        id: 8, title: '8 title',
      });

      findDfd.resolve(response);

      findDfd.then(() => {
        expect(viewModel.selected).toEqual(viewModel.value.id);

        done();
      });
    });
  });

  describe('selectedChanged() method', () => {
    beforeEach(() => {
      viewModel.attr('modelConstructor', testType);
    });

    it('set "value" to the model from cache', () => {
      const newSelected = {id: 'testId', title: 'testTitle', extra: 'extra'};
      testType.findInCacheById.and.returnValue(newSelected);

      viewModel.selectedChanged();

      expect(testType.findInCacheById).toHaveBeenCalled();
      expect(viewModel.value.serialize()).toEqual(newSelected);
    });

    it('set "value" to "null" if model not found in cache', () => {
      testType.findInCacheById.and.returnValue(undefined);

      viewModel.selectedChanged();

      expect(viewModel.value).toBeNull();
    });
  });
});
