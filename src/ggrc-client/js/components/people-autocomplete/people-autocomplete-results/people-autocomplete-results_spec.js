/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFindIndex from 'lodash/findIndex';
import component from './people-autocomplete-results';
import {getComponentVM} from '../../../../js_specs/spec_helpers';

describe('people-autocomplete-results component', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = getComponentVM(component);
  });

  describe('events', () => {
    let events;
    let element;
    let handler;

    beforeEach(() => {
      events = Object.assign({viewModel}, component.prototype.events);

      element = $('<div id="#element"></div>');
      element.append('<div class="autocomplete-item"></div>');
      element.append('<div class="autocomplete-item active"></div>');
      element.append('<div class="autocomplete-item"></div>');

      events.element = element;
      $('body').append(element);
    });

    afterEach(() => {
      element.remove();
    });

    describe('inserted() handler', () => {
      beforeEach(() => {
        handler = events.inserted.bind(events);
      });

      it('assigns "element" to element attribute of viewModel', () => {
        viewModel.attr('element', null);

        handler();

        expect(viewModel.attr('element')).toBe(element);
      });
    });

    describe('removeActive() handler', () => {
      beforeEach(() => {
        handler = events.removeActive.bind(events);
      });

      it('removes "active" class from items with class "autocomplete-item"',
        () => {
          handler();

          expect(element.find('.autocomplete-item').length).toBe(3);
          expect(element.find('.autocomplete-item.active').length).toBe(0);
        });
    });

    describe('".autocomplete-item mouseenter"(element) handler', () => {
      beforeEach(() => {
        handler = events['.autocomplete-item mouseenter'].bind(events);
      });

      it('adds class "active" to passed element and removes from others ' +
      'if preventHighlighting attribute of viewModel is false', () => {
        const items = element.find('.autocomplete-item');
        viewModel.attr('preventHighlighting', false);

        handler(items[0]);

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(0);
      });

      it('does not change active item ' +
      'if preventHighlighting attribute of viewModel is true', () => {
        const items = element.find('.autocomplete-item');
        viewModel.attr('preventHighlighting', true);

        handler(items[0]);

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(1);
      });
    });

    describe('"{viewModel} selectActive"() handler', () => {
      beforeEach(() => {
        handler = events['{viewModel} selectActive'].bind(events);
        spyOn(viewModel, 'selectItem');
      });

      it('calls selectItem of viewModels with index of active item', () => {
        const items = element.find('.autocomplete-item');
        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));

        handler();

        expect(viewModel.selectItem).toHaveBeenCalledWith(activeIndex);
      });
    });

    describe('"{viewModel} highlightElement"() handler', () => {
      beforeEach(() => {
        handler = events['{viewModel} highlightElement'].bind(events);
      });

      it('adds "active" class to closest autocomplete-item ' +
      'and removes "active" from others', () => {
        const items = element.find('.autocomplete-item');

        handler([{}], {element: items[2]});

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(2);

        const activeItems = element.find('.autocomplete-item.active');
        expect(activeItems.length).toBe(1);
      });
    });

    describe('"{viewModel} highlightNext"() handler', () => {
      beforeEach(() => {
        handler = events['{viewModel} highlightNext'].bind(events);
      });

      it('adds "active" class to next autocomplete-item ' +
      'and removes from current', () => {
        const items = element.find('.autocomplete-item');

        handler();

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(2);

        const activeItems = element.find('.autocomplete-item.active');
        expect(activeItems.length).toBe(1);
      });

      it('adds "active" class to first autocomplete-item ' +
      'and removes from current if current was last item', () => {
        const items = element.find('.autocomplete-item');

        handler();
        handler();

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(0);

        const activeItems = element.find('.autocomplete-item.active');
        expect(activeItems.length).toBe(1);
      });
    });

    describe('"{viewModel} highlightPrevious"() handler', () => {
      beforeEach(() => {
        handler = events['{viewModel} highlightPrevious'].bind(events);
      });

      it('adds "active" class to previous autocomplete-item ' +
      'and removes from current', () => {
        const items = element.find('.autocomplete-item');

        handler();

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(0);

        const activeItems = element.find('.autocomplete-item.active');
        expect(activeItems.length).toBe(1);
      });

      it('adds "active" class to first autocomplete-item ' +
      'and removes from current if current was last item', () => {
        const items = element.find('.autocomplete-item');

        handler();
        handler();

        const activeIndex = loFindIndex(items,
          (item) => $(item).hasClass('active'));
        expect(activeIndex).toBe(2);

        const activeItems = element.find('.autocomplete-item.active');
        expect(activeItems.length).toBe(1);
      });
    });

    describe('"{viewModel} _items"() handler', () => {
      beforeEach(() => {
        handler = events['{viewModel} _items'].bind({viewModel});
      });

      it('should assign true to "preventHighlighting" attribute', () => {
        viewModel.attr('preventHighlighting', false);

        handler();

        expect(viewModel.attr('preventHighlighting')).toBe(true);
      });

      it('should subscribe on "element" for first occurrence ' +
      'of "mousemove" event if "element" is present', () => {
        const element = $();
        spyOn(element, 'one');
        viewModel.attr('element', element);

        handler();

        expect(element.one)
          .toHaveBeenCalledWith('mousemove', jasmine.any(Function));
      });

      it('element should have only one mousemove event handler ' +
      'if handler called more than once', () => {
        const element = $('<div></div>');
        $('body').append(element);
        viewModel.attr('element', element);

        handler();
        handler();

        expect($._data(element[0], 'events')['mousemove'].length).toBe(1);
        element.remove();
      });

      describe('element "mousemove" callback', () => {
        let event;
        let element;
        let delay;

        beforeEach(() => {
          delay = $.Deferred();
          event = {
            target: {},
          };
          element = $();
          spyOn(element, 'one').and.callFake(
            (eventName, callback) => delay.then(() => callback(event)));
          viewModel.attr('element', element);
          spyOn(viewModel, 'dispatch');
        });

        it('should assign false to "preventHighlighting"', (done) => {
          handler();

          expect(viewModel.attr('preventHighlighting')).toBe(true);

          delay.resolve();
          delay.then(() => {
            expect(viewModel.attr('preventHighlighting')).toBe(false);
            done();
          });
        });

        it('dispatches "highlightElement" event ' +
        'with element which equals to element.target', (done) => {
          handler();
          delay.resolve();
          delay.then(() => {
            expect(viewModel.dispatch).toHaveBeenCalledWith({
              type: 'highlightElement',
              element: event.target,
            });
            done();
          });
        });
      });
    });
  });
});
