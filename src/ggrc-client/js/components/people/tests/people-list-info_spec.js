/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../people-list-info';
import PersonProfile from '../../../models/service-models/person-profile';
import {getComponentVM} from '../../../../js_specs/spec-helpers';

describe('people-list-info component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(Component);
  });

  describe('loadPersonProfile() method', () => {
    beforeEach(() => {
      spyOn(PersonProfile, 'findOne').and.returnValue(
        new Promise(() => {})
      );
    });

    it('sets "profile" field to the loaded profile', async (done) => {
      const expectedProfile = {data: 'data'};
      PersonProfile.findOne.and.returnValue(
        Promise.resolve(expectedProfile)
      );

      const profileStub = {id: 12345};
      viewModel.attr('instance', {profile: profileStub});

      await viewModel.loadPersonProfile();

      expect(PersonProfile.findOne).toHaveBeenCalledWith({
        id: profileStub.id,
      });
      expect(viewModel.attr('profile').serialize()).toEqual(expectedProfile);

      done();
    });
  });

  describe('onSendCalendarEventsChange() method', () => {
    let element;
    let saveDfd;

    beforeEach(() => {
      element = {};
      saveDfd = new $.Deferred();
      viewModel.attr('profile', {
        save: jasmine.createSpy('save').and.returnValue(saveDfd),
      });
    });

    it('sets profile\'s send_calendar_events to true if checkbox is checked',
      () => {
        element.checked = true;

        viewModel.onSendCalendarEventsChange(element);

        expect(viewModel.attr('profile.send_calendar_events')).toBe(true);
      });

    it('sets profile\'s send_calendar_events to false if checkbox isn\'t ' +
    'checked', () => {
      element.checked = false;

      viewModel.onSendCalendarEventsChange(element);

      expect(viewModel.attr('profile.send_calendar_events')).toBe(false);
    });

    it('sets isSaving flag to true before saving of the instance', () => {
      viewModel.onSendCalendarEventsChange(element);

      expect(viewModel.attr('isSaving')).toBe(true);
    });

    describe('after saving of the instance', () => {
      beforeEach(() => {
        saveDfd.resolve();
      });

      it('sets isSaving flag to false',
        async (done) => {
          await viewModel.onSendCalendarEventsChange(element);

          expect(viewModel.attr('isSaving')).toBe(false);
          done();
        });
    });
  });
});
