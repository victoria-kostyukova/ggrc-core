/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import '../bootstrap/sticky-popover';
import Spinner from 'spin.js';

(function ($) {
  const body = $('body');
  let defaults = {
    delay: {
      show: 500,
      hide: 100,
    },
    placement: 'left',
    content: function (trigger) {
      let $el = $(new Spinner().spin().el);
      $el.css({
        width: '100px',
        height: '100px',
        left: '50px',
        top: '50px',
        zIndex: calculate_spinner_z_index,
      });
      return $el[0];
    },
  };

  // Listeners for initial mouseovers for stick-hover
  body.on('mouseover', '[data-popover-trigger="sticky-hover"]', function (e) {
    // If popover instance doesn't exist already, create it and
    // force the 'enter' event.
    if (!$(e.currentTarget).data('sticky_popover')) {
      $(e.currentTarget)
        .sticky_popover($.extend({}, defaults, {
          trigger: 'sticky-hover',
          placement: function () {
            let $el = this.$element;
            let spaceLeft = $(document).width() -
              ($el.offset().left + $el.width());
            let spaceRight = $el.offset().left;
            let popoverSize = 620;
            // Display on right if there is enough space
            if ($el.closest('.widget-area:first-child').length &&
                spaceLeft > popoverSize) {
              return 'right';
            } else if (spaceRight > popoverSize) {
              return 'left';
            }
            return 'top';
          },
        }))
        .triggerHandler(e);
    }
  });

  // Listeners for initial clicks for popovers
  body.on('click', 'a[data-popover-trigger="click"]', function (e) {
    e.preventDefault();
    if (!$(e.currentTarget).data('sticky_popover')) {
      $(e.currentTarget)
        .sticky_popover($.extend({}, defaults, {
          trigger: 'click',
        }))
        .triggerHandler(e);
    }
  });

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

  $.fn.showhide = showhide('.widget', '.content', '.filter');
  $.fn.modal_showhide = showhide('.modal', '.hidden-fields-area');
  $.fn.widget_showhide = showhide('.info', '.hidden-fields-area');
  $.fn.widget_showhide_custom = showhide('.info', '.hidden-fields-area-custom');
  $.fn.widget_showhide_mapped = showhide('.custom-attr-wrap',
    '.hidden-fields-area');
  $.fn.issue_tracker_modal_showhide = showhide('.modal',
    '.hidden-issue-tracker-fields-area');

  body.on('click', '.expand-link a', $.fn.modal_showhide);
  body.on('click', '.info-expand a', $.fn.widget_showhide);
  body.on('click', '.info-expand-custom a', $.fn.widget_showhide_custom);
  body.on('click', '.info-expand-mapped a', $.fn.widget_showhide_mapped);
  body.on('click',
    '.expand-issue-tracker-link a', $.fn.issue_tracker_modal_showhide);

  // Show/hide tree leaf content
  body.on('click', '.tree-structure .oneline, .tree-structure .description, ' +
                   '.tree-structure .view-more', oneline);

  function oneline(command) {
    $(this).each(function () {
      let $this = $(this);
      let $leaf = $this.closest('[class*=span]').parent()
        .children('[class*=span]:first');
      let $title = $leaf.find('.oneline');
      let $description = $leaf.find('.description');
      let $view = $leaf.closest('.row-fluid').find('.view-more');
      let cmd = command;

      if ($description.length > 0) {
        if (typeof cmd !== 'string') {
          cmd = $description.hasClass('in') ? 'hide' : 'view';
        }

        if (cmd === 'view') {
          $description.addClass('in');
          $title.find('.description-inline').addClass('out');
          if ($title.is('.description-only')) {
            $title.addClass('out');
          }
          $view.text('hide');
        } else if (cmd === 'hide') {
          $description.removeClass('in');
          $title.find('.description-inline').removeClass('out');
          if ($title.is('.description-only')) {
            $title.removeClass('out');
          }
          $view.text('view');
        }
      }
    });

    return this;
  }

  $.fn.oneline = oneline;

  // Close other popovers when one is shown
  body.on('show.popover', function (e) {
    $('[data-sticky_popover]').each(function () {
      let popover = $(this).data('sticky_popover');
      // popover && popover.hide();
      popover.hide();
    });
  });

  // Close all popovers on custom event
  body.on('kill-all-popovers', function (e) {
    // FIXME: This may be incompatible with bootstrap popover assumptions...
    // This is when the triggering element has been removed from the DOM
    // so we have to kill the popover elements themselves.
    $('.popover').remove();
  });
})(jQuery);
