/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getComponentVM} from '../../../../js_specs/spec_helpers';
import Component from '../multiselect-dropdown-wrapper';

describe('multiselect-dropdown-wrapper component', function () {
  let viewModel;
  let response;
  let findDfd;
  let TestType;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    response = [
      {
        id: 1,
        name: '1 item',
        extra: 'extra',
      },
      {
        id: 2,
        name: '2 item',
        extra: 'extra',
      },
      {
        id: 3,
        name: '3 item',
        extra: 'extra',
      },
      {
        id: 4,
        name: '4 item',
        extra: 'extra',
      },
    ];

    findDfd = can.Deferred();
    TestType = can.Map.extend({
      findAll: jasmine.createSpy('findAll').and.returnValue(findDfd),
      findInCacheById: jasmine.createSpy('findInCacheById')
        .and.returnValue({
          id: 'testId',
          name: 'testName',
          extra: 'extra',
        }),
    }, {});
  });

  describe('modelConstructor set()', () => {
    it('calls findAll()', () => {
      viewModel.attr('modelConstructor', TestType);

      expect(TestType.findAll).toHaveBeenCalled();
    });

    it('calls prepareOptions()', (done) => {
      spyOn(viewModel, 'prepareOptions');

      viewModel.attr('modelConstructor', TestType);
      findDfd.resolve(response);

      findDfd.then((result) => {
        expect(viewModel.prepareOptions).toHaveBeenCalledWith(response);

        done();
      });
    });

    describe('prepareOptions() method', () => {
      beforeEach(function () {
        viewModel.attr('selected', [
          {
            id: 2,
            name: '2 item',
            extra: 'extra',
          },
          {
            id: 3,
            name: '3 item',
            extra: 'extra',
          },
        ]);
      });

      it('sets preparedOptions', (done) => {
        viewModel.attr('modelConstructor', TestType);
        findDfd.resolve(response);

        findDfd.then((result) => {
          expect(viewModel.preparedOptions.length).toEqual(response.length);

          done();
        });
      });

      it('converts models to a correct format', (done) => {
        viewModel.attr('modelConstructor', TestType);
        findDfd.resolve(response);

        findDfd.then((result) => {
          expect(viewModel.preparedOptions[0].value).toEqual('1 item');
          expect(viewModel.preparedOptions[0].id).toEqual(1);
          expect(viewModel.preparedOptions[0].checked).toBeFalsy();
          expect(viewModel.preparedOptions[0].extra).toBeUndefined();

          done();
        });
      });

      it('sets selectedInternal', (done) => {
        viewModel.attr('modelConstructor', TestType);
        findDfd.resolve(response);

        findDfd.then((result) => {
          expect(viewModel.selectedInternal.length)
            .toEqual(viewModel.selected.length);

          done();
        });
      });

      it('selectedInternal has correct format', (done) => {
        viewModel.attr('modelConstructor', TestType);
        findDfd.resolve(response);

        findDfd.then((result) => {
          expect(viewModel.selectedInternal[0].value).toEqual('2 item');
          expect(viewModel.selectedInternal[0].id).toEqual(2);
          expect(viewModel.selectedInternal[0].checked).toBeTruthy();
          expect(viewModel.selectedInternal[0].extra).toBeUndefined();

          done();
        });
      });
    });
  });

  describe('selectedChanged() method', () => {
    let newSelected;

    beforeEach(function () {
      viewModel.attr('modelConstructor', TestType);
      viewModel.attr('selected', [
        {
          id: 2,
          name: '2 item',
          extra: 'extra',
        },
        {
          id: 3,
          name: '3 item',
          extra: 'extra',
        },
      ]);

      newSelected = [{id: 1}];
    });

    it('should call findInCacheById', () => {
      viewModel.selectedChanged({selected: newSelected});

      expect(TestType.findInCacheById).toHaveBeenCalled();
    });

    it('should get model from cache', () => {
      viewModel.selectedChanged({selected: newSelected});

      expect(viewModel.selected.length).toEqual(newSelected.length);
      expect(viewModel.selected[0].id).toEqual('testId');
      expect(viewModel.selected[0].name).toEqual('testName');
      expect(viewModel.selected[0].extra).toEqual('extra');
    });
  });
});
