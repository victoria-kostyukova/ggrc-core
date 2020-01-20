/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import canMap from 'can-map';
import Component from './release-notes-menu-item';
import {getComponentVM} from '../../../js_specs/spec-helpers';
import PersonProfile from '../../models/service-models/person-profile';
import {getFormattedUtcDate} from '../../plugins/utils/date-utils';

describe('"release-notes-menu-item" component', () => {
  let vm;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('open() method', () => {
    it('sets true to "state.open" flag', () => {
      vm.attr('state.open', false);

      vm.open();

      expect(vm.attr('state.open')).toBe(true);
    });
  });

  describe('events', () => {
    let events;
    let handler;

    beforeEach(() => {
      events = Component.prototype.events;
    });

    describe('"inserted" handler', () => {
      const releaseDateObj = new Date(RELEASE_NOTES_DATE);
      let profileDfd;
      let originalCurrentUser;

      beforeAll(() => {
        originalCurrentUser = GGRC.current_user;
      });

      afterAll(() => {
        GGRC.current_user = originalCurrentUser;
      });

      beforeEach(() => {
        handler = events.inserted.bind({viewModel: vm});
        spyOn(vm, 'open');

        GGRC.current_user = {
          profile: {
            id: 12345,
          },
        };
        profileDfd = $.Deferred();
        spyOn(PersonProfile, 'findOne').and.returnValue(profileDfd);
      });

      describe('if RELEASE_NOTES_DATE not equal to saved date', () => {
        let dayBefore;
        let profile;
        let saveDfd;

        beforeEach(() => {
          dayBefore = new Date(releaseDateObj)
            .setDate(releaseDateObj.getDate() - 1);
          profile = new canMap({
            last_seen_whats_new: new Date(dayBefore).toISOString(),
          });
          saveDfd = $.Deferred();
          profile.save = jasmine.createSpy('save').and.returnValue(saveDfd);
          profileDfd.resolve(profile);
          saveDfd.resolve();
        });


        it('sets current user\'s last_seen_whats_new to RELEASE_NOTES_DATE',
          async (done) => {
            const expected = getFormattedUtcDate(RELEASE_NOTES_DATE);

            await handler();

            expect(profile.attr('last_seen_whats_new')).toBe(expected);
            done();
          });

        it('saves current user\'s profile', async (done) => {
          await handler();

          expect(profile.save)
            .toHaveBeenCalled();
          done();
        });

        describe('and current user\'s profile was saved', () => {
          it('calls open() method', async (done) => {
            await handler();
            expect(vm.open).toHaveBeenCalled();
            done();
          });
        });
      });

      describe('if RELEASE_NOTES_DATE equal to saved date', () => {
        let profile;

        beforeEach(() => {
          profile = new canMap({
            last_seen_whats_new: new Date(releaseDateObj).toISOString(),
          });
          profileDfd.resolve(profile);
        });

        it('profile shouldn\'t be saved', async (done) => {
          profile.save = jasmine.createSpy('save');

          await handler();

          expect(profile.save).not.toHaveBeenCalled();
          done();
        });

        it('open() should not been called', async (done) => {
          await handler();
          expect(vm.open).not.toHaveBeenCalled();
          done();
        });
      });
    });
  });
});
