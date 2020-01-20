/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as gDriveUtils from '../../../plugins/utils/gdrive-picker-utils';
import {getComponentVM, makeFakeInstance} from '../../../../js_specs/spec-helpers';
import Component from '../attach-button';
import Assessment from '../../../models/business-models/assessment';
import pubSub from '../../../pub-sub';

describe('attach-button component', function () {
  'use strict';

  let viewModel;

  beforeEach(function () {
    viewModel = getComponentVM(Component);
    viewModel.attr('instance',
      makeFakeInstance({model: Assessment})()
    );
  });

  describe('created() method', function () {
    it('dispatches "created" event', function () {
      spyOn(pubSub, 'dispatch');
      viewModel.created();

      expect(pubSub.dispatch).toHaveBeenCalledWith(
        jasmine.objectContaining({type: 'relatedItemSaved'}));
    });
  });

  describe('checkFolder() method', () => {
    it('should set isFolderAttached to true when folder is attached',
      async () => {
        viewModel.attr('isFolderAttached', false);
        viewModel.attr('instance.folder', 'gdrive_folder_id');

        spyOn(viewModel, 'findFolder').and
          .returnValue(Promise.resolve({}));

        await viewModel.checkFolder();

        expect(viewModel.attr('isFolderAttached')).toBe(true);
      });

    it('should set isFolderAttached to false when folder is not attached',
      async () => {
        viewModel.attr('isFolderAttached', true);
        viewModel.attr('instance.folder', null);

        spyOn(viewModel, 'findFolder').and
          .returnValue(Promise.resolve());

        await viewModel.checkFolder();

        expect(viewModel.attr('isFolderAttached')).toBe(false);
      });

    it('sets correct isFolderAttached if instance refreshes during ' +
      'request to GDrive', async () => {
      spyOn(gDriveUtils, 'findGDriveItemById').and.callFake(() => {
        viewModel.attr('instance.folder', null);
        return Promise.resolve({folderId: 'gdrive_folder_id'});
      });

      viewModel.attr('instance.folder', 'gdrive_folder_id');

      await viewModel.checkFolder();

      expect(viewModel.attr('isFolderAttached')).toBe(false);
    });

    it('should set error data to error attribute if findFolder() was failed',
      async () => {
        spyOn(viewModel, 'findFolder').and
          .returnValue(Promise.reject('Declined by user'));

        viewModel.attr('error', null);

        await viewModel.checkFolder();

        expect(viewModel.attr('error')).toBe('Declined by user');
      });

    it('should set "false" to canAttach attribute if findFolder() was failed',
      async () => {
        spyOn(viewModel, 'findFolder').and
          .returnValue(Promise.reject('Declined by user'));

        viewModel.attr('canAttach', true);

        await viewModel.checkFolder();

        expect(viewModel.attr('canAttach')).toBe(false);
      });
  });
});
