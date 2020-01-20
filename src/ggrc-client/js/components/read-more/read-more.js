/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canMap from 'can-map';
import canComponent from 'can-component';
import template from './read-more.stache';
import {convertMarkdownToHtml} from '../../plugins/utils/markdown-utils';

const readMore = 'Read More';
const readLess = 'Read Less';
const classPrefix = 'ellipsis-truncation-';
const viewModel = canMap.extend({
  define: {
    text: {
      type: 'string',
      value: '',
      set(val) {
        return this.attr('handleMarkdown') ? convertMarkdownToHtml(val) : val;
      },
    },
    maxLinesNumber: {
      type: 'number',
      value: 5,
    },
    cssClass: {
      type: 'string',
      value: '',
      get() {
        return this.attr('expanded') ? '' :
          classPrefix + this.attr('maxLinesNumber');
      },
    },
  },
  isLazyRender: false,
  handleMarkdown: false,
  expanded: false,
  overflowing: false,
  btnText() {
    return this.attr('expanded') ? readLess : readMore;
  },
  toggle(ev) {
    ev.stopPropagation();
    this.attr('expanded', !this.attr('expanded'));
  },
  updateOverflowing(el) {
    let truncatedHeight;
    let extendedHeight;
    const readMore = $(el);
    const linesNumber = this.attr('maxLinesNumber');

    // have to use opacity:0 when we use visibility:hidden line clamp
    // is not working properly
    const clonedReadMoreWrap = readMore.find('div.read-more')
      .clone()
      .css({position: 'absolute', opacity: 0});

    const clonedReadMoreBody = clonedReadMoreWrap.find('div.read-more__body');
    clonedReadMoreWrap.appendTo(readMore);

    if (!clonedReadMoreBody.hasClass(`ellipsis-truncation-${linesNumber}`)) {
      clonedReadMoreBody.addClass(`ellipsis-truncation-${linesNumber}`);
    }

    truncatedHeight = clonedReadMoreBody.height();
    clonedReadMoreBody.removeClass(`ellipsis-truncation-${linesNumber}`);
    extendedHeight = clonedReadMoreBody.height();
    clonedReadMoreWrap.remove();
    this.attr('overflowing', extendedHeight > truncatedHeight);
  },
});

export default canComponent.extend({
  tag: 'read-more',
  view: canStache(template),
  leakScope: true,
  viewModel,
  init() {
    const element = arguments[0];
    const observedElement = $(element).children()[0];

    const observer = new MutationObserver((mutations) => {
      if (mutations.find((mutation) => mutation.type === 'childList')) {
        this.viewModel.updateOverflowing(element);
      }
    });
    observer.observe(observedElement, {childList: true, subtree: true});

    if (this.viewModel.attr('isLazyRender')) {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.viewModel.updateOverflowing(element);
            intersectionObserver.unobserve(observedElement);
          }
        });
      });

      intersectionObserver.observe(observedElement);
    }
  },
  events: {
    inserted() {
      this.viewModel.updateOverflowing(this.element);
    },
    '{window} resize'() {
      this.viewModel.updateOverflowing(this.element);
    },
  },
});
