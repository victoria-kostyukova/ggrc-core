/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import * as ModalsUtils from '../../utils/modals';

describe('modal utils', () => {
  describe('bindXHRToButton() method', () => {
    let element;
    let actualInnerHtml;
    let promise;

    beforeEach(() => {
      actualInnerHtml = 'actualInnerHtml';
      element = $('<button>' + actualInnerHtml + '</button>');
      promise = new Promise(() => {});
    });

    it('sets true to "disabled" attribute', () => {
      expect(element[0].disabled).toBe(false);

      ModalsUtils.bindXHRToButton(promise, element, 'newtext');

      expect(element[0].disabled).toBe(true);
    });

    it('adds "disabled" class to element', () => {
      expect(element[0].getAttribute('class')).toBe(null);

      ModalsUtils.bindXHRToButton(promise, element, 'newtext');

      expect(element[0].getAttribute('class')).toBe('disabled');
    });

    it('add new text inside element', () => {
      expect(element[0].innerHTML).toBe('actualInnerHtml');

      ModalsUtils.bindXHRToButton(promise, element, 'newtext');

      expect(element[0].innerHTML).toBe('newtext');
    });

    it('sets false to "disabled" attribute after promise has resolved',
      async () => {
        await ModalsUtils
          .bindXHRToButton(Promise.resolve(), element, 'newtext');

        expect(element[0].disabled).toBe(false);
      });

    it('removes class "disabled" attribute after promise has resolved',
      async () => {
        await ModalsUtils
          .bindXHRToButton(Promise.resolve(), element, 'newtext');

        expect(element[0].getAttribute('class')).toBe('');
      });

    it('saves text inside element', async () => {
      await ModalsUtils.bindXHRToButton(Promise.resolve(), element, 'newtext');

      expect(element[0].innerHTML).toBe(actualInnerHtml);
    });
  });
});
