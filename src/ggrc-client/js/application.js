/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

let doc = window.document;
let body = doc.body;
let $win = $(window);
let $doc = $(doc);
let $body = $(body);

$doc.ready(function () {
  // monitor target, where flash messages are added
  let AUTOHIDE_TIMEOUT = 10000;
  let timeoutId;
  let target = $('section.content div.flash')[0];
  let observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      // check for new nodes
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        // remove the success message from non-expandable
        // flash success messages after timeout
        clearTimeout(timeoutId);

        timeoutId = setTimeout(function () {
          $('.flash .alert-autohide').remove();
        }, AUTOHIDE_TIMEOUT);
      }
    });
  });

  let config = {
    attributes: true,
    childList: true,
    characterData: true,
  };

  if (target) {
    observer.observe(target, config);
  }
});

$win.load(function () {
  $body.on('click', 'ul.tree-structure .item-main .openclose', function (ev) {
    ev.stopPropagation();
    $(this).openclose();
  });
});

// Make sure GGRC.config is defined (needed to run Karma tests)
GGRC.config = GGRC.config || {};
