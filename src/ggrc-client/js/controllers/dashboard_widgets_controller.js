/*
    Copyright (C) 2018 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {
  getCounts,
} from '../plugins/utils/current-page-utils';
import {inferObjectType} from '../plugins/utils/models-utils';

export default can.Control({
  pluginName: 'dashboard_widgets',
  defaults: {
    model: null,
    widget_id: '',
    widget_name: '',
    widget_icon: '',
    widget_view: '/static/mustache/dashboard/object_widget.mustache',
    widget_guard: null,
    widget_initial_content: '',
    show_filter: false,
    object_category: null,
    content_selector: '.content',
    content_controller: null,
    content_controller_options: {},
    content_controller_selector: null,
  },
}, {
  init: function () {
    if (!this.options.model && GGRC.page_model) {
      this.options.model = inferObjectType(GGRC.page_object);
    }

    if (!this.options.widget_icon && this.options.model) {
      this.options.widget_icon = this.options.model.table_singular;
    }

    if (!this.options.object_category && this.options.model) {
      this.options.object_category = this.options.model.category;
    }

    this.options.widget_count = new can.Observe();

    this.element
      .addClass('widget')
      .addClass(this.options.object_category)
      .addClass(this.options.widgetType)
      .attr('id', this.options.widget_id);

    if (this.options.widgetType && this.options.widgetType === 'treeview') {
      let counts = getCounts();

      let countsName = this.options.countsName ||
        (this.options.content_controller_options &&
          this.options.content_controller_options.countsName) ||
        this.options.model.shortName;

      this.options.widget_count.attr('count', '' + counts.attr(countsName));

      counts.on(countsName, function (ev, newVal, oldVal) {
        can.trigger(this.element, 'updateCount', [newVal]);
      }.bind(this));
    }
  },
  prepare: function () {
    if (this._prepare_deferred) {
      return this._prepare_deferred;
    }

    this._prepare_deferred =
      can.view(this.options.widget_view, $.when(this.options))
        .then(this.proxy('draw_widget'));

    return this._prepare_deferred;
  },
  draw_widget: function (frag) {
    this.element.html(frag);

    if (this.options.content_controller) {
      let controllerContent = this.element.find(this.options.content_selector);
      if (this.options.content_controller_selector) {
        controllerContent =
          controllerContent.find(this.options.content_controller_selector);
      }
      if (this.options.content_controller_options.init) {
        this.options.content_controller_options.init();
      }

      this.options.content_controller_options.show_header = true;
      this.content_controller = new this.options.content_controller(
        controllerContent, this.options.content_controller_options
      );

      if (this.content_controller.prepare) {
        return this.content_controller.prepare();
      }
      else {
        return new $.Deferred().resolve();
      }
    }
  },
  display: function (refetch) {
    const that = this;

    this._display_deferred = this.prepare().then(function () {
      let dfd;
      let $containerVM = that.element
        .find('tree-widget-container')
        .viewModel();
      let FORCE_REFRESH = true;

      if (!that.content_controller && $containerVM.needToRefresh()) {
        dfd = $containerVM.display(FORCE_REFRESH);
      } else if (that.options.widgetType === 'treeview') {
        dfd = $containerVM.display(refetch);
      } else if (that.content_controller && that.content_controller.display) {
        dfd = that.content_controller.display();
      } else {
        dfd = new $.Deferred().resolve();
      }

      return dfd;
    });

    return this._display_deferred;
  },
  updateCount: function (el, ev, count, updateCount) {
    this.options.widget_count.attr('count', '' + count);
  },
});
