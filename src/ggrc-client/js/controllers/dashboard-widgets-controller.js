/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {getFragment} from '../plugins/ggrc-utils';
import canControl from 'can-control';
import {getPageModel} from '../plugins/utils/current-page-utils';

export default canControl.extend({
  defaults: {
    model: null,
    widget_id: '',
    widget_name: '',
    widget_icon: '',
    widget_view: '/dashboard/object-widget.stache',
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
    if (!this.options.model) {
      this.options.model = getPageModel();
    }

    if (!this.options.widget_icon && this.options.model) {
      this.options.widget_icon = this.options.model.table_singular;
    }

    if (!this.options.object_category && this.options.model) {
      this.options.object_category = this.options.model.category;
    }

    this.element
      .addClass('widget')
      .addClass(this.options.object_category)
      .addClass(this.options.widgetType)
      .attr('id', this.options.widget_id);
  },
  prepare: function () {
    if (this._prepare_deferred) {
      return this._prepare_deferred;
    }

    this._prepare_deferred = $.when(this.options)
      .then((ctx) => {
        let frag = getFragment(this.options.widget_view, ctx);
        this.draw_widget(frag);
      });

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
      } else {
        return new $.Deferred().resolve();
      }
    }
  },
  display: function () {
    const that = this;

    this._display_deferred = this.prepare().then(function () {
      let dfd = new $.Deferred().resolve();

      if (that.content_controller && that.content_controller.display) {
        dfd = that.content_controller.display();
      }

      return dfd;
    });

    return this._display_deferred;
  },
});
