/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

export default can.Control.extend({
  defaults: {},
}, {
  init_spinner: function () {
    let $footer;
    let $wrapper;

    if (this.element) {
      $footer = this.element.children('.tree-item-add').first();

      if (this.options.is_subtree) {
        $wrapper = $('<li class="tree-item tree-spinner"/>');
      } else {
        $wrapper = $('<div class="tree-spinner"/>');
      }

      if (!this.options.is_subtree && !this.element.next().length) {
        $wrapper.css('height', '40px');
      }

      let view = '<spinner-component {extra-css-class}="\'tree-items\'"' +
      ' {toggle}="{showMe}" {size}="\'large\'"></spinner-component>';
      let renderer = can.stache(view);
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

  display: function (refetch) {
    let that = this;
    let loader = this.fetch_list.bind(this);

    if (refetch) {
      this._draw_list_deferred = null;
      this._display_deferred = null;
      this.element.slideUp('fast').empty().slideDown();
    }

    if (this._display_deferred) {
      return this._display_deferred;
    }

    this._display_deferred = $.when(this._attached_deferred, this.prepare());

    this._display_deferred = this._display_deferred
      .then(this._ifNotRemoved(function () {
        let dfds = [loader()];
        if (that._init_view_deferred) {
          dfds.push(that._init_view_deferred);
        } else {
          dfds.push(that.init_view());
        }
        return $.when(...dfds);
      }))
      .then(that._ifNotRemoved((list, forcePrepareChildren) =>
        this.draw_list(list, forcePrepareChildren)));
    return this._display_deferred;
  },

  draw_list: function (list, forcePrepareChildren) {
    // TODO figure out why this happens and fix the root of the problem
    if (!list && !this.options.list) {
      return undefined;
    }
    if (this._draw_list_deferred) {
      return this._draw_list_deferred;
    }
    this._draw_list_deferred = $.Deferred();
    if (this.element && !this.element.closest('body').length) {
      return undefined;
    }

    if (list) {
      list = list.length === null ? new can.List([list]) : list;
    } else {
      list = this.options.list;
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
    this.options.attr('list', []);
    this.on();

    this._draw_list_deferred =
      this.enqueue_items(list, forcePrepareChildren);
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

  enqueue_items: function (items, forcePrepareChildren) {
    if (!this._pending_items) {
      this._pending_items = [];
      this._loading_started();
    }

    this.insert_items(items, forcePrepareChildren)
      .then(this._ifNotRemoved(() => this._loading_finished()));

    return this._loading_deferred;
  },

  insert_items: function (items, forcePrepareChildren) {
    let that = this;
    let preppedItems = [];
    let idMap = {};
    let toInsert;
    let dfd;

    if (this.options.attr('is_subtree')) {
      // Check the list of items to be inserted for any duplicate items.

      _.forEach(this.options.list, function (item) {
        idMap[item.instance.type + item.instance.id] = true;
      });
      toInsert = _.filter(items, function (item) {
        return !idMap[item.instance.type + item.instance.id];
      });
    } else {
      toInsert = items;
    }

    _.forEach(toInsert, function (item) {
      let prepped = that.prepare_child_options(item, forcePrepareChildren);
      // Should we skip items without selfLink?
      if (prepped.instance.selfLink) {
        preppedItems.push(prepped);
      }
    });

    if (preppedItems.length > 0) {
      this.options.list.push(...preppedItems);
      dfd = this.add_child_lists(preppedItems);
    } else {
      dfd = $.Deferred().resolve();
    }

    return dfd;
  },
});
