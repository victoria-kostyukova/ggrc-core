/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from './release-notes-list';

describe('"release-notes-list" component', () => {
  describe('events handlers', () => {
    let events = Component.prototype.events;
    let handler;

    describe('"a click" handler', () => {
      let el;
      let event;
      let element;

      beforeEach(() => {
        el = new $();
        element = {
          find: jasmine.createSpy(),
        };
        event = {
          preventDefault: jasmine.createSpy(),
        };
        handler = events['a click'].bind({element});
      });

      describe('if there is header with id equal to href of link', () => {
        let linkedHeader;

        beforeEach(() => {
          linkedHeader = {
            scrollIntoView: jasmine.createSpy(),
          };
          element.find.and.returnValue([linkedHeader]);
        });

        it('prevents default action', () => {
          handler(el, event);

          expect(event.preventDefault).toHaveBeenCalled();
        });

        it('calls scrollIntoView on this header', () => {
          handler(el, event);

          expect(linkedHeader.scrollIntoView).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'start',
          });
        });
      });

      describe('if there is no header with id equal to href of link', () => {
        beforeEach(() => {
          element.find.and.returnValue([]);
        });

        it('does not prevent default action', () => {
          handler(el, event);

          expect(event.preventDefault).not.toHaveBeenCalled();
        });
      });
    });
  });
});
