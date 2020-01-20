/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as UserUtils from '../utils/user-utils';
import * as Person from '../../models/business-models/person';
import RefreshQueue from '../../models/refresh-queue';
import * as NotifiersUtils from '../utils/notifiers-utils';

describe('User Utils', function () {
  describe('cacheCurrentUser() method', function () {
    let currentUser;

    beforeAll(() => {
      currentUser = GGRC.current_user;
    });

    afterAll(() => {
      GGRC.current_user = currentUser;
    });

    it('should add current user to cache', function () {
      GGRC.current_user = {
        name: 'TestCurrentUser',
        id: 0,
      };

      UserUtils.cacheCurrentUser();

      let currenUserFromCache = Person.default.findInCacheById(0);

      expect(currenUserFromCache.name).toBe('TestCurrentUser');
    });
  });

  describe('getPersonInfo() method', () => {
    let person;
    let currentUserFromCache;
    let getPersonInfo;

    beforeEach(() => {
      getPersonInfo = UserUtils.getPersonInfo;

      currentUserFromCache = {
        name: 'jhon',
        id: 321,
        lastname: 'doe',
        email: 'jhondoe@email',
      };

      person = {
        name: 'jhon',
        id: 123,
      };

      spyOn(Person.default, 'findInCacheById')
        .withArgs(person.id)
        .and.returnValue(currentUserFromCache);
    });

    it('returns incoming user if he doesn\'t exist', async () => {
      person = null;

      const user = await getPersonInfo(person);

      expect(user).toBe(person);
    });

    it('returns incoming user if he doesn\'t have id', async () => {
      person.id = null;

      const user = await getPersonInfo(person);

      expect(user).toEqual({
        name: 'jhon',
        id: null,
      });
    });

    it('calls findInCacheById() if user and user.id exists', async () => {
      await getPersonInfo(person);

      expect(Person.default.findInCacheById).toHaveBeenCalledWith(person.id);
    });

    it('returns full user data if he has email', async () => {
      const user = await getPersonInfo(person);

      expect(user).toEqual({
        name: 'jhon',
        id: 321,
        lastname: 'doe',
        email: 'jhondoe@email',
      });
    });

    describe('creates new person if he wasn\'t found in cache', () => {
      let args;
      let triggerDfd;
      let newPerson;

      beforeEach(() => {
        person = {
          name: 'jack',
          id: 124,
        };

        newPerson = {
          name: 'jack',
          id: 436,
          lastname: 'jenkins',
          email: 'jackjenkins@email',
        };

        triggerDfd = $.Deferred();

        Person.default.findInCacheById
          .withArgs(person.id).and.returnValue(null);

        spyOn(Person, 'default').and.returnValue(newPerson);
        spyOn(RefreshQueue.prototype, 'enqueue').and.returnValue({
          trigger: jasmine.createSpy().and.returnValue(triggerDfd),
        });
      });

      it('calls new Person() with person.id', async () => {
        triggerDfd.resolve();

        const ARGS_ORDER = {
          ID: 0,
        };

        await getPersonInfo(person);
        args = Person.default.calls.argsFor(0);

        expect(args[ARGS_ORDER.ID]).toEqual({id: person.id});
      });

      it('calls RefreshQueue.enqueue() with created person', async () => {
        triggerDfd.resolve();

        await getPersonInfo(person);

        expect(RefreshQueue.prototype.enqueue).toHaveBeenCalledWith({
          name: 'jack',
          id: 436,
          lastname: 'jenkins',
          email: 'jackjenkins@email',
        });
      });

      it('calls notifier if RefreshQueue() was failed', async () => {
        spyOn(NotifiersUtils, 'notifier');

        triggerDfd.reject();

        try {
          await getPersonInfo(person);
        } catch (e) {
          expect(NotifiersUtils.notifier).toHaveBeenCalledWith(
            'error',
            'Failed to fetch data for person ' + person.id + '.'
          );
        }
      });
    });
  });
});
