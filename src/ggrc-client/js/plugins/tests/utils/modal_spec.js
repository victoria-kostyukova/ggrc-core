/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {bindXHRToButton} from '../../utils/modals';

describe('modal utils', () => {
  describe('bindXHRToButton() method', () => {
    let dfd;

    beforeEach(() => {
      dfd = new $.Deferred();
    });

    const callBindXHRToButton = (done, actualInnerHtml, newtext, disable) => {
      let element = $('<button>' + actualInnerHtml + '</button>');

      // call bindXHRToButton()
      bindXHRToButton(dfd, element, newtext, disable);

      // button should have 'disabled' class after call bindXHRToButton
      expect(element.hasClass('disabled')).toEqual(true);

      if (disable) {
        // button should have 'disabled' attr after call bindXHRToButton
        expect(element.attr('disabled')).toEqual('disabled');
      }

      if (newtext) {
        // button should have 'newText' before dfd.resolve()
        expect(element[0].innerHTML).toEqual(newtext);
      }

      dfd.then(
        setTimeout(() => {
          expect(element[0].innerHTML).toEqual(actualInnerHtml);

          // button should not have 'disabled' class after dfd.resolve()
          expect(element.hasClass('disabled')).toEqual(false);

          if (disable) {
            // button should not have 'disabled' attr after call bindXHRToButton
            expect(element.attr('disabled')).toEqual(undefined);
          }
          done();
        }, 3)
      );

      dfd.resolve();
    };

    it('bindXHRToButton() should save text of button', (done) => {
      callBindXHRToButton(done, 'HELLO WORLD');
    });

    it('bindXHRToButton() should save icon inside button', (done) => {
      callBindXHRToButton(done, '<i class="fa fa-icon"></i>');
    });

    it('bindXHRToButton() should save icon and text inside button', (done) => {
      callBindXHRToButton(done, '<i class="fa fa-icon"></i>My text');
    });

    it('bindXHRToButton() should save text of button. Disable button',
      (done) => {
        callBindXHRToButton(done, 'HELLO WORLD', '', true);
      }
    );

    it('bindXHRToButton() should save icon inside button. New text',
      (done) => {
        callBindXHRToButton(done, '<i class="fa fa-icon"></i>', 'My new text');
      }
    );

    it('bindXHRToButton() should save text of button. New text. Disable button',
      (done) => {
        callBindXHRToButton(done, 'HELLO WORLD', '<i class="fa"></i>', true);
      }
    );

    it('bindXHRToButton() should resolve empty element', (done) => {
      let element = $('');

      // call bindXHRToButton()
      bindXHRToButton(dfd, element);

      dfd.then(
        setTimeout(() => {
          // button should not have 'disabled' class after dfd.resolve()
          expect(element.hasClass('disabled')).toEqual(false);
          done();
        }, 3)
      );

      dfd.resolve();
    });
  });
});
