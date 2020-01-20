/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../notifications-menu-item';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import NotificationConfig from '../../../models/service-models/notification-config';
import Context from '../../../models/service-models/context';

describe('notification-menu-item component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadNotification() method', () => {
    let findSpy;

    beforeEach(() => {
      findSpy = spyOn(NotificationConfig, 'find');
    });

    it('should set isLoading flag TRUE before loading', () => {
      viewModel.attr('isLoading', false);
      viewModel.loadNotification();
      expect(viewModel.attr('isLoading')).toBe(true);
    });

    it('should load daily digest notification config', () => {
      findSpy.and.returnValue($.Deferred());

      viewModel.loadNotification();
      expect(NotificationConfig.find).toHaveBeenCalledWith('Email_Digest');
    });

    it('should save enable flag and config id if config is already exist',
      async () => {
        spyOn(viewModel, 'saveEmailDigest');
        viewModel.attr('emailDigest', null);
        viewModel.attr('existingConfigId', null);

        let config = {
          id: 123,
          enable_flag: false,
        };
        findSpy.and.returnValue($.Deferred().resolve(config));
        await viewModel.loadNotification();

        expect(viewModel.attr('emailDigest')).toBe(config.enable_flag);
        expect(viewModel.attr('existingConfigId')).toBe(config.id);
      });

    it('should set default enable flag if config does not exist', async () => {
      spyOn(viewModel, 'saveEmailDigest');
      viewModel.attr('emailDigest', null);
      viewModel.attr('existingConfigId', null);

      findSpy.and.returnValue($.Deferred().resolve());

      await viewModel.loadNotification();

      expect(viewModel.attr('emailDigest')).toBe(true);
      expect(viewModel.attr('existingConfigId')).toBe(null);
    });

    it('should set isLoading flag FALSE when loading is finished successfully',
      (done) => {
        let dfd = $.Deferred();
        findSpy.and.returnValue(dfd);

        viewModel.loadNotification()
          .then(() => {
            expect(viewModel.attr('isLoading')).toBe(false);
            done();
          });

        expect(viewModel.attr('isLoading')).toBe(true);
        dfd.resolve();
      });

    it('should set isLoading flag FALSE when loading is failed',
      (done) => {
        let dfd = $.Deferred();
        findSpy.and.returnValue(dfd);

        viewModel.loadNotification()
          .catch(() => {
            expect(viewModel.attr('isLoading')).toBe(false);
            done();
          });

        expect(viewModel.attr('isLoading')).toBe(true);
        dfd.reject();
      });
  });

  describe('saveEmailDigest(checked) method', () => {
    it('should set isSaving flag TRUE before saving', () => {
      spyOn(viewModel, 'createNotification');
      viewModel.attr('isSaving', false);

      viewModel.saveEmailDigest(true);

      expect(viewModel.attr('isSaving')).toBe(true);
    });

    it('should update existing config', () => {
      viewModel.attr('existingConfigId', 123);
      spyOn(viewModel, 'updateNotification').and.returnValue($.Deferred());

      viewModel.saveEmailDigest(true);

      expect(viewModel.updateNotification).toHaveBeenCalledWith(123, true);
    });

    it('should create new config', () => {
      viewModel.attr('existingConfigId', null);
      spyOn(viewModel, 'createNotification').and.returnValue($.Deferred());

      viewModel.saveEmailDigest(true);

      expect(viewModel.createNotification).toHaveBeenCalledWith(true);
    });

    it('should set isSaving flag FALSE after successful saving', (done) => {
      let dfd = $.Deferred();
      viewModel.attr('existingConfigId', 123);
      spyOn(viewModel, 'updateNotification').and.returnValue(dfd);

      viewModel.saveEmailDigest(true)
        .then(() => {
          expect(viewModel.attr('isSaving')).toBe(false);
          done();
        });

      expect(viewModel.attr('isSaving')).toBe(true);
      dfd.resolve();
    });

    it('should set isSaving flag FALSE after failed saving', (done) => {
      let dfd = $.Deferred();
      viewModel.attr('existingConfigId', null);
      spyOn(viewModel, 'createNotification').and.returnValue(dfd);

      viewModel.saveEmailDigest(true)
        .catch(() => {
          expect(viewModel.attr('isSaving')).toBe(false);
          done();
        });

      expect(viewModel.attr('isSaving')).toBe(true);
      dfd.reject();
    });
  });

  describe('createNotification(checked) method', () => {
    it('should save new notification config', async () => {
      let config = {
        save: jasmine.createSpy().and.returnValue($.Deferred().resolve({})),
      };
      spyOn(NotificationConfig, 'newInstance').and.returnValue(config);
      spyOn(Context, 'newInstance').and.callFake((args) => args);

      await viewModel.createNotification(true);

      expect(NotificationConfig.newInstance)
        .toHaveBeenCalledWith({
          person_id: 1,
          notif_type: 'Email_Digest',
          enable_flag: true,
          context: new Context({id: null}),
        });
      expect(config.save).toHaveBeenCalled();
    });

    it('should save new config id', async () => {
      viewModel.attr('existingConfigId', null);

      let config = {
        save: jasmine.createSpy()
          .and.returnValue($.Deferred().resolve({id: 123})),
      };
      spyOn(NotificationConfig, 'newInstance').and.returnValue(config);

      await viewModel.createNotification(true);

      expect(viewModel.attr('existingConfigId')).toBe(123);
    });
  });

  describe('updateNotification(configId, checked) method', () => {
    it('should refresh existing config', () => {
      let config = new NotificationConfig();
      spyOn(NotificationConfig, 'findInCacheById').and.returnValue(config);
      spyOn(config, 'refresh').and.returnValue($.Deferred());

      viewModel.updateNotification(123, true);

      expect(config.refresh).toHaveBeenCalled();
    });

    it('should update config', async () => {
      let config = new NotificationConfig();
      spyOn(NotificationConfig, 'findInCacheById').and.returnValue(config);
      spyOn(config, 'refresh').and.returnValue($.Deferred().resolve(config));
      spyOn(config, 'save');

      await viewModel.updateNotification(123, true);

      expect(config.enable_flag).toBe(true);
      expect(config.save).toHaveBeenCalled();
    });
  });
});
