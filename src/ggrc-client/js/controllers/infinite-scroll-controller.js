/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loDebounce from 'lodash/debounce';
import {ggrcAjax} from '../plugins/ajax_extensions';
import canStache from 'can-stache';
import canControl from 'can-control';
const MOUSEENTER_THROTTLE = 300;

const InfiniteScrollControl = canControl.extend({}, {
  init: function () {},
  ' DOMMouseScroll': 'prevent_overscroll',
  ' mousewheel': 'prevent_overscroll',
  ' scroll': 'prevent_overscroll',

  prevent_overscroll: function ($el, ev) {
    // Based on Troy Alford's response on StackOverflow:
    //   http://stackoverflow.com/a/16324762
    let scrollTop = $el[0].scrollTop;
    let scrollHeight = $el[0].scrollHeight;
    let height = $el.height();
    let scrollTopMax = scrollHeight - height;
    let delta;
    let up;
    let loadTriggerOffset = 50;

    if (ev.type === 'DOMMouseScroll') {
      delta = ev.originalEvent.detail * -40;
    } else {
      delta = ev.originalEvent.wheelDelta;
    }

    up = delta > 0;

    function prevent() {
      ev.stopPropagation();
      ev.preventDefault();
      ev.returnValue = false;
      return false;
    }

    if (ev.type === 'scroll' &&
      scrollTop > scrollTopMax - loadTriggerOffset) {
      this.show_more($el);
      return prevent();
    } else if (!up && scrollTop - delta > scrollTopMax) {
      // Scrolling down, but this will take us past the bottom.
      $el.scrollTop(scrollHeight);
      this.show_more($el);
      return prevent();
    } else if (up && delta > scrollTop) {
      // Scrolling up, but this will take us past the top.
      $el.scrollTop(0);
      return prevent();
    } else if (!up && scrollTop - delta > scrollTopMax - loadTriggerOffset) {
      // Scrolling down, close to bottom, so start loading more
      this.show_more($el);
    }
  },
  show_more: function ($el) {
    this.element.trigger('scrollNext');
  },
});

const LhnTooltipsControl = canControl.extend({
  defaults: {
    tooltip_view: GGRC.templates_path + '/base_objects/extended_info.stache',
    trigger_selector: '.show-extended',
    fade_in_delay: 300,
    fade_out_delay: 300,
  },
}, {
  init: function () {
    if (!this.options.$extended) {
      this.options.$extended = $('#extended-info');
      if (this.options.$extended.length < 1) {
        this.options.$extended =
          $('<div id="extended-info" class="extended-info hide" />')
            .appendTo('body');
      }
    }
    this.options.extended = this.options.$extended[0];

    if (!this.options.$lhs) {
      this.options.$lhs = $('#lhs');
    }
    // Renew event listening, since we assigned $extended, $lhs
    this.on();
  },

  // Tooltip / popover handling
  '{trigger_selector} mouseenter': 'on_mouseenter',
  '{trigger_selector} mouseleave': 'on_mouseleave',
  '{extended} mouseleave': 'on_mouseleave',
  '{extended} mouseenter': 'on_tooltip_mouseenter',
  on_mouseenter: loDebounce(function (el) {
    let instance = el.closest('[data-model]').data('model') ||
        el.closest(':data(model)').data('model');
    let delay = this.options.fade_in_delay;

    if (this.options.$extended.data('model') !== instance) {
      clearTimeout(this.fade_in_timeout);
      // If tooltip is already showing, show new content without delay
      if (this.options.$extended.hasClass('in')) {
        delay = 0;
      }
      this.fade_in_timeout = setTimeout(
        () => this.on_fade_in_timeout(el, instance), delay);
      clearTimeout(this.fade_out_timeout);
      this.fade_out_timeout = null;
    } else if (this.fade_out_timeout) {
      clearTimeout(this.fade_out_timeout);
      this.fade_out_timeout = null;
    }
  }, MOUSEENTER_THROTTLE),
  ensure_tooltip_visibility: function () {
    let offset = this.options.$extended.offset().top;
    let height = this.options.$extended.height();
    // "- 24" compensates for the Chrome URL display when hovering a link
    // "348" should be the widht of the Chrome URL display when displaying javascript://
    let windowHeight = $(window).height() + $(window).scrollTop() -
        (this.options.$extended.offset().left > 348 ? 0 : 24);
    let newOffset;

    if (offset + height > windowHeight) {
      if (height > windowHeight) {
        newOffset = 0;
      } else {
        newOffset = windowHeight - height;
      }
      this.options.$extended.css({top: newOffset});
    }
  },
  get_tooltip_view: function (el) {
    let tooltipView = $(el).closest('[data-tooltip-view]')
      .attr('data-tooltip-view');
    let path;

    if (tooltipView && tooltipView.length > 0) {
      if (tooltipView === 'null') {
        path = null;
      } else {
        path = GGRC.templates_path + tooltipView;
      }
    } else {
      path = this.options.tooltip_view;
    }

    return path;
  },
  on_fade_in_timeout: function (el, instance) {
    let tooltipView = this.get_tooltip_view(el);
    if (tooltipView) {
      this.fade_in_timeout = null;
      ggrcAjax({
        url: tooltipView,
        dataType: 'text',
      }).then((view) => {
        let frag = canStache(view)({instance: instance});
        let tooltipWidth = this.options.$extended.outerWidth();
        let offset = el.parent().offset();
        let elLeft = offset ? offset.left : 0;
        let offsetLeft = elLeft - tooltipWidth > 0 ?
          elLeft - tooltipWidth : elLeft + el.parent().width();

        this.options.$extended
          .html(frag)
          .addClass('in')
          .removeClass('hide')
          .css({top: el.offset().top, left: offsetLeft})
          .data('model', instance);
        this.ensure_tooltip_visibility();
      });
    }
  },
  on_tooltip_mouseenter: function () {
    clearTimeout(this.fade_out_timeout);
    this.fade_out_timeout = null;
  },
  on_fade_out_timeout: function () {
    clearTimeout(this.fade_in_timeout);
    this.fade_in_timeout = null;
    this.fade_out_timeout = null;
    this.options.$extended
      .removeClass('in')
      .addClass('hide')
      .data('model', null);
  },
  on_mouseleave: function (el, ev) {
    // Cancel fade_in, if we haven't displayed yet
    clearTimeout(this.fade_in_timeout);
    this.fade_in_timeout = null;

    clearTimeout(this.fade_out_timeout);
    this.fade_out_timeout =
      setTimeout(
        () => this.on_fade_out_timeout(),
        this.options.fade_out_delay);
  },
  destroy: function () {
    this._super();
    this.on_mouseleave();
  },
});

export {
  InfiniteScrollControl,
  LhnTooltipsControl,
};
