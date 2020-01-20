/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import {getComponentVM} from '../../../../js_specs/spec-helpers';
import Component from '../person-modal';
import PersonProfile from '../../../models/service-models/person-profile';
import * as UserUtils from '../../../plugins/utils/user-utils';

describe('person-modal component', () => {
  let viewModel;

  beforeAll(() => {
    viewModel = getComponentVM(Component);
  });

  describe('updatePersonProfile() method', () => {
    let profile;

    beforeEach(() => {
      viewModel.attr('instance', {});
      profile = new canMap({
        save: jasmine.createSpy('save'),
      });
      spyOn(PersonProfile, 'findInCacheById').and.returnValue(profile);
    });

    it('saves profile from cache if it was found there', async (done) => {
      const profileStub = {id: 12345};
      viewModel.attr('instance', {profile: profileStub});

      await viewModel.updatePersonProfile();

      expect(PersonProfile.findInCacheById).toHaveBeenCalledWith(
        profileStub.id
      );
      expect(profile.save).toHaveBeenCalled();
      done();
    });

    it('saves loaded profile if it was not found in cache', async (done) => {
      PersonProfile.findInCacheById.and.returnValue(null);
      spyOn(UserUtils, 'loadPersonProfile').and.returnValue(
        Promise.resolve(profile)
      );

      await viewModel.updatePersonProfile();

      expect(UserUtils.loadPersonProfile).toHaveBeenCalledWith(
        viewModel.attr('instance')
      );
      expect(UserUtils.loadPersonProfile).toHaveBeenCalledBefore(profile.save);
      done();
    });

    it('sets profile\'s send_calendar_events to the value of ' +
    'turnOnCalendarEvents field', async (done) => {
      viewModel.attr('turnOnCalendarEvents', false);

      await viewModel.updatePersonProfile();

      expect(profile.attr('send_calendar_events')).toBe(false);
      done();
    });
  });

  describe('loadPersonProfile() method', () => {
    let profile;

    beforeEach(() => {
      profile = new canMap();
      spyOn(PersonProfile, 'findInCacheById').and.returnValue(profile);
    });

    it('uses person\'s profile extracted from cache', () => {
      const profileStub = {id: 12345};
      viewModel.attr('instance', {profile: profileStub});

      viewModel.loadPersonProfile();

      expect(PersonProfile.findInCacheById).toHaveBeenCalledWith(12345);
    });

    it('sets turnOnCalendarEvents to the value of profile\'s ' +
    'send_calendar_events field', () => {
      profile.attr('send_calendar_events', true);

      viewModel.loadPersonProfile();

      expect(viewModel.attr('turnOnCalendarEvents')).toBe(true);
    });
  });

  describe('setIsNameReadOnly() method', () => {
    it('sets true for internal emails (which ends with @google.com)', () => {
      viewModel.attr('isNameReadOnly', false);
      viewModel.attr('instance.email', 'test@google.com');
      viewModel.setIsNameReadOnly();
      expect(viewModel.attr('isNameReadOnly')).toBe(true);
    });

    it('sets false for external emails', () => {
      viewModel.attr('isNameReadOnly', true);
      viewModel.attr('instance.email', 'test@gmail.com');
      viewModel.setIsNameReadOnly();
      expect(viewModel.attr('isNameReadOnly')).toBe(false);
    });

    it('sets false if email contains,' +
      'but doesn\'t end with @google.com', () => {
      viewModel.attr('isNameReadOnly', false);
      viewModel.attr('instance.email', 'test@google.commercial');
      viewModel.setIsNameReadOnly();
      expect(viewModel.attr('isNameReadOnly')).toBe(false);
    });
  });

  describe('personSelected() method', () => {
    it('sets instance.email', () => {
      viewModel.attr('instance.email', '');
      viewModel.personSelected({person: {email: 'test@google.com'}});
      expect(viewModel.attr('instance.email')).toBe('test@google.com');
    });

    it('sets instance.name', () => {
      viewModel.attr('instance.name', '');
      viewModel.personSelected({person: {name: 'Anze'}});
      expect(viewModel.attr('instance.name')).toBe('Anze');
    });

    it('calls setIsNameReadOnly', () => {
      const spy = spyOn(viewModel, 'setIsNameReadOnly');
      viewModel.personSelected({person: {email: '', name: ''}});
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    let events;

    beforeAll(() => {
      events = Component.prototype.events;
    });

    describe('"{instance} created"() event handler', () => {
      let handler;

      beforeEach(() => {
        handler = events['{instance} created'].bind({viewModel});
      });

      it('updates person\'s profile', () => {
        spyOn(viewModel, 'updatePersonProfile');

        handler();

        expect(viewModel.updatePersonProfile).toHaveBeenCalled();
      });
    });

    describe('"{instance} updated"() event handler', () => {
      let handler;

      beforeEach(() => {
        handler = events['{instance} updated'].bind({viewModel});
      });

      it('updates person\'s profile', () => {
        spyOn(viewModel, 'updatePersonProfile');

        handler();

        expect(viewModel.updatePersonProfile).toHaveBeenCalled();
      });
    });

    describe('inserted() event handler', () => {
      let handler;

      beforeEach(() => {
        handler = events.inserted.bind({viewModel});
        spyOn(viewModel, 'loadPersonProfile');
      });

      it('initializes person\'s edit modal if the person isn\'t new', () => {
        viewModel.attr('isNewInstance', false);

        handler();

        expect(viewModel.loadPersonProfile).toHaveBeenCalled();
      });

      it('does nothing for create modal (when the person is new)', () => {
        viewModel.attr('isNewInstance', true);

        handler();

        expect(viewModel.loadPersonProfile).not.toHaveBeenCalled();
      });
    });
  });
});
