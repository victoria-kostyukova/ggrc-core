/*
  Copyright (C) 2018 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from './last-comment';
import {getComponentVM} from '../../../js_specs/spec_helpers';
import * as Utils from '../../plugins/utils/acl-utils.js';
import RefreshQueue from '../../models/refresh_queue';
import {COMMENT_CREATED} from '../../events/eventTypes';
import {formatDate} from '../../plugins/utils/date-util';

describe('last-comment component', () => {
  let vm;
  let events = Component.prototype.events;

  beforeEach(() => {
    vm = getComponentVM(Component);
  });

  describe('getAuthor() method', () => {
    let person;

    beforeEach(() => {
      person = 'mockPerson';
      spyOn(Utils, 'peopleWithRoleName').and.returnValue([person]);
    });

    it('sets person which is comment admin to author attribute', () => {
      vm.attr('author', null);
      vm.attr('comment', 'mockComment');

      vm.getAuthor();

      expect(Utils.peopleWithRoleName)
        .toHaveBeenCalledWith(vm.attr('comment'), 'Admin');
      expect(vm.attr('author')).toEqual(person);
    });
  });

  describe('tooltip() method', () => {
    beforeEach(() => {

    });

    describe('returns empty string', () => {
      it('if there is no comment', () => {
        vm.attr('comment', null);
        expect(vm.tooltip()).toBe('');
      });

      it('if there is no create date of comment', () => {
        vm.attr('comment', {});
        expect(vm.tooltip()).toBe('');
      });

      it('if there is no author', () => {
        vm.attr('comment', {created_at: Date.now()});
        vm.attr('author', null);
        expect(vm.tooltip()).toBe('');
      });

      it('if there is no email of author', () => {
        vm.attr('comment', {created_at: Date.now()});
        vm.attr('author', {});
        expect(vm.tooltip()).toBe('');
      });
    });

    it('returns correct tooltip', () => {
      let date = Date.now();
      let authorEmail = 'mockEmail';

      vm.attr('comment', {created_at: date});
      vm.attr('author', {email: authorEmail});
      date = formatDate(date, true);


      expect(vm.tooltip()).toEqual(`${date}, ${authorEmail}`);
    });
  });

  describe('events', () => {
    let handler;
    let dfd;

    describe('"{this} mouseover" handler', () => {
      beforeEach(() => {
        dfd = new can.Deferred();
        spyOn(RefreshQueue.prototype, 'enqueue').and.returnValue({
          trigger: jasmine.createSpy().and.returnValue(dfd),
        });
        handler = events['{this} mouseover'].bind({viewModel: vm});
      });

      it('triggers RefreshQueue with comment attribute', () => {
        vm.attr('comment', {id: 123});
        handler();
        expect(RefreshQueue.prototype.enqueue)
          .toHaveBeenCalledWith(vm.attr('comment'));
      });

      describe('after getting response', () => {
        let response;

        beforeEach(() => {
          response = [{id: 321}];
          dfd.resolve(response);

          spyOn(vm, 'getAuthor');
        });

        it('sets new comment to viewModel.comment attribute', () => {
          handler();
          expect(vm.attr('comment')).toEqual(jasmine.objectContaining({
            id: response[0].id,
          }));
        });

        it('calls viewModel.getAuthor() method ' +
        'if there is no author attribute', () => {
          vm.attr('author', null);
          handler();
          expect(vm.getAuthor).toHaveBeenCalled();
        });

        it('does not call viewModel.getAuthor() method ' +
        'if there is author attribute', () => {
          vm.attr('author', {});
          handler();
          expect(vm.getAuthor).not.toHaveBeenCalled();
        });
      });
    });

    describe('"{instance} ${COMMENT_CREATED.type}" handler', () => {
      beforeEach(() => {
        handler = events[`{instance} ${COMMENT_CREATED.type}`]
          .bind({viewModel: vm});
        spyOn(vm, 'getAuthor');
      });

      it('sets new comment to comment of viewModel', () => {
        const comment = 'mockComment';
        vm.attr('comment', null);

        handler({}, {comment});

        expect(vm.attr('comment')).toEqual(comment);
      });

      it('calls getAuthor() method of viewModel', () => {
        handler({}, {});
        expect(vm.getAuthor).toHaveBeenCalled();
      });
    });
  });
});
