/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const body = $('body');

body.on('click', '.expand-link a', showhide('.modal', '.hidden-fields-area'));
body.on('click', '.info-expand a', showhide('.info', '.hidden-fields-area'));
body.on('click', '.expand-issue-tracker-link a',
  showhide('.modal', '.hidden-issue-tracker-fields-area'));

function showhide(upsel, downsel) {
  return function (command) {
    $(this).each(function () {
      let $this = $(this);
      let $content = $this.closest(upsel).find(downsel);
      let cmd = command;

      if (typeof cmd !== 'string' || cmd === 'toggle') {
        cmd = $this.hasClass('active') ? 'hide' : 'show';
      }
      if (cmd === 'hide') {
        $content.slideUp();
        $this.removeClass('active');
      } else if (cmd === 'show') {
        $content.slideDown();
        $this.addClass('active');
      }
    });

    return this;
  };
}
