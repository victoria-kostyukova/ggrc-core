/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
import canStache from 'can-stache';
import canControl from 'can-control';
export default canControl.extend({
  defaults: {},
}, {
  init_spinner: function () {
    let $footer;
    let $wrapper;

    if (this.element) {
      $footer = this.element.children('.tree-item-add').first();

      $wrapper = $('<div class="tree-spinner"/>');

      if (!this.element.next().length) {
        $wrapper.css('height', '40px');
      }

      let view = '<spinner-component extraCssClass:from="\'tree-items\'"' +
      ' toggle:from="showMe" size:from="\'large\'"></spinner-component>';
      let renderer = canStache(view);
      let spinner = renderer({showMe: true});

      // Admin dashboard
      if ($footer.length === 0 &&
        this.element.children('.tree-structure').length > 0) {
        this.element.children('.tree-structure')
          .addClass('new-tree_loading').append($wrapper);
      } else if ($footer.length === 0) { // My work
        this.element.addClass('new-tree_loading').append($wrapper);
      } else {
        $footer.before($wrapper);
      }

      $wrapper.append(spinner);
    }
  },
  prepare: function () {
    if (this._prepare_deferred) {
      return this._prepare_deferred;
    }

    this._prepare_deferred = $.Deferred();
    this._prepare_deferred.resolve();

    this._attached_deferred.then(function () {
      if (!this.element) {
        return;
      }
      this.init_count();
    }.bind(this));

    return this._prepare_deferred;
  },

  display() {
    let that = this;
    let loader = this.fetch_list.bind(this);

    if (this._display_deferred) {
      return this._display_deferred;
    }

    this._display_deferred = $.when(this._attached_deferred, this.prepare());

    this._display_deferred = this._display_deferred
      .then(this._ifNotRemoved(function () {
        let dfds = [loader()];

        dfds.push(that.init_view());

        return $.when(...dfds);
      }))
      .then(that._ifNotRemoved((list) => this.draw_list(list)));
    return this._display_deferred;
  },

  draw_list: function (list) {
    // TODO figure out why this happens and fix the root of the problem
    if (!list) {
      return undefined;
    }
    if (this._draw_list_deferred) {
      return this._draw_list_deferred;
    }
    this._draw_list_deferred = $.Deferred();
    if (this.element && !this.element.closest('body').length) {
      return undefined;
    }

    // make attributes queue is correct.
    list.sort(function (a, b) {
      return a.id - b.id;
    });

    if (!this.element) {
      return undefined; // controller has been destroyed
    }

    this.clearList();

    this.options.attr('original_list', list);
    this.on();

    this._draw_list_deferred =
      this.enqueue_items(list);
    return this._draw_list_deferred;
  },

  _loading_started: function () {
    let $contentContainer;

    if (!this._loading_deferred) {
      this._loading_deferred = $.Deferred();

      // for some reason, .closest(<selector>) does not work, thus need to use
      // using a bit less roboust .parent()
      $contentContainer = this.element.parent();
      $contentContainer
        .find('spinner[extra-css-class="initial-spinner"]')
        .remove();

      this.init_spinner(); // the tree view's own items loading spinner
      this.element.trigger('loading');
    }
  },

  _loading_finished: function () {
    let loadingDeferred;

    if (this._loading_deferred) {
      this.element.trigger('loaded');
      this.element.find('.tree-spinner').remove();

      if (this.element.hasClass('new-tree_loading')) {
        this.element.removeClass('new-tree_loading');
      } else {
        this.element.find('.new-tree_loading')
          .removeClass('new-tree_loading');
      }

      loadingDeferred = this._loading_deferred;
      this._loading_deferred = null;
      loadingDeferred.resolve();
    }
  },

  enqueue_items: function (items) {
    if (!this._pending_items) {
      this._pending_items = [];
      this._loading_started();
    }

    this.insert_items(items)
      .then(this._ifNotRemoved(() => this._loading_finished()));

    return this._loading_deferred;
  },

  insert_items: function (items) {
    let that = this;
    let preppedItems = [];
    let dfd;

    loForEach(items, function (item) {
      let prepped = that.prepare_child_options(item);
      // Should we skip items without selfLink?
      if (prepped.instance.selfLink) {
        preppedItems.push(prepped);
      }
    });

    if (preppedItems.length > 0) {
      dfd = this.add_child_lists(preppedItems);
    } else {
      dfd = $.Deferred().resolve();
    }

    return dfd;
  },
});
