/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFindIndex from 'lodash/findIndex';
import canStache from 'can-stache';
import canComponent from 'can-component';
import baseAutocompleteResults from '../../custom-autocomplete/autocomplete-results';
import template from './people-autocomplete-results.stache';

export default canComponent.extend({
  tag: 'people-autocomplete-results',
  view: canStache(template),
  leakScope: false,
  viewModel: baseAutocompleteResults.extend({
    currentValue: null,
    showResults: false,
    showNewValue: false,
    element: null,
    preventHighlighting: false,
  }),
  events: {
    inserted() {
      this.viewModel.attr('element', this.element);
    },
    removeActive() {
      const activeItems =
        $(this.element).find('.autocomplete-item.active');
      activeItems.removeClass('active');
    },
    '.autocomplete-item mouseenter'(element) {
      /**
       * We need prevent highlighting of element
       * when 'mouseenter' event fired without 'mousemove' event.
       * This case happens when new list of items was rendered under cursor.
      */
      if (!this.viewModel.attr('preventHighlighting')) {
        this.removeActive();
        $(element).addClass('active');
      }
    },
    '{viewModel} selectActive'() {
      const items = $(this.element).find('.autocomplete-item');
      const activeIndex = loFindIndex(items,
        (item) => $(item).hasClass('active'));
      this.viewModel.selectItem(activeIndex);
    },
    '{viewModel} highlightElement'([viewModel], {element}) {
      this.removeActive();
      $(element).closest('.autocomplete-item').addClass('active');
    },
    '{viewModel} highlightNext'() {
      const nextItem = $(this.element)
        .find('.autocomplete-item.active + .autocomplete-item')[0];

      if (nextItem) {
        this.removeActive();
        $(nextItem).addClass('active');
      } else {
        const firstItem = $(this.element).find('.autocomplete-item')[0];

        if (firstItem) {
          this.removeActive();
          $(firstItem).addClass('active');
        }
      }
    },
    '{viewModel} highlightPrevious'() {
      const items = $(this.element).find('.autocomplete-item');

      const activeIndex = loFindIndex(items,
        (item) => $(item).hasClass('active'));

      if (activeIndex && activeIndex > 0) {
        this.removeActive();
        $(items[activeIndex - 1]).addClass('active');
      } else {
        if (activeIndex === 0 && items.length > 1) {
          this.removeActive();
          $(items[items.length - 1]).addClass('active');
        }
      }
    },
    '{viewModel} _items'() {
      const viewModel = this.viewModel;

      viewModel.attr('preventHighlighting', true);

      if (viewModel.attr('element')) {
        viewModel.attr('element')
          .off('mousemove')
          .one('mousemove', (event) => {
            viewModel.attr('preventHighlighting', false);
            viewModel.dispatch({
              type: 'highlightElement',
              element: event.target,
            });
          });
      }
    },
  },
});
