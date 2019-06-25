/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loForEach from 'lodash/forEach';
import {ggrcAjax} from '../plugins/ajax_extensions';
import canStache from 'can-stache';
import canMap from 'can-map';
import canControl from 'can-control';
import DashboardWidgets from './dashboard_widgets_controller';
import InfoPin from './info_pin_controller';
import {
  isAdmin,
  getPageInstance,
} from '../plugins/utils/current-page-utils';
import {getChildTreeDisplayList} from '../plugins/utils/display-prefs-utils';
import {clear as clearLocalStorage} from '../plugins/utils/local-storage-utils';
import TreeViewConfig from '../apps/base_widgets';
import pubSub from '../pub-sub';

const DashboardControl = canControl.extend({
  defaults: {
    widget_descriptors: null,
    innerNavDescriptors: [],
    /*
      The widget should refetch items when opening
      if "refetchOnce" has the model name of the widget.

      For example: "refetchOnce" contains "Control" item.
      The items of "Control" widget should be reloaded.
    */
    refetchOnce: new Set(),
    pubSub,
  },
}, {
  init: function (el, options) {
    this.options = new canMap(this.options);
    this.init_tree_view_settings();
    this.init_page_title();
    this.init_page_header();
    this.init_widget_descriptors();

    // Before initializing widgets, hide the container to not show
    // loading state of multiple widgets before reducing to one.
    this.hide_widget_area();
    this.init_default_widgets();
    this.init_inner_nav();
  },

  init_tree_view_settings: function () {
    let validModels;
    let savedChildTreeDisplayList;
    if (isAdmin()) { // Admin dashboard
      return;
    }

    validModels = canMap.keys(TreeViewConfig.attr('base_widgets_by_type'));
    // only change the display list
    validModels.forEach( function (mName) {
      savedChildTreeDisplayList = getChildTreeDisplayList(mName);
      if (savedChildTreeDisplayList !== null) {
        TreeViewConfig.attr('sub_tree_for').attr(mName + '.display_list',
          savedChildTreeDisplayList);
      }
    });
  },

  init_page_title: function () {
    let pageTitle = null;
    if (typeof (this.options.page_title) === 'function') {
      pageTitle = this.options.page_title(this);
    } else if (this.options.page_title) {
      pageTitle = this.options.page_title;
    }
    if (pageTitle) {
      $('head > title').text(pageTitle);
    }
  },

  init_page_header: function () {
    let $pageHeader = $('#page-header');
    if (this.options.header_view && $pageHeader.length) {
      ggrcAjax({
        url: this.options.header_view,
        dataType: 'text',
      }).then((view) => {
        let frag = canStache(view)();
        $pageHeader.html(frag);
      });
    }
  },

  init_inner_nav: function () {
    let $innernav = this.element.find('#inner-nav');
    if ($innernav.length && this.options.innernav_view) {
      let pageInstance = getPageInstance();
      let options = {
        ...this.options,
        isAuditScope: pageInstance.attr('type') === 'Audit',
        instance: pageInstance,
        showWidgetArea: this.showWidgetArea.bind(this),
      };
      ggrcAjax({
        url: this.options.innernav_view,
        dataType: 'text',
        async: false,
      }).then((view) => {
        let render = canStache(view);
        $innernav.html(render(options));
      });
      return;
    }
  },

  showWidgetArea(event) {
    let widget = event.widget;
    let $widget = $('#' + widget.id);

    if ($widget.length) {
      this.show_widget_area();
      $widget.siblings().addClass('hidden').trigger('widget_hidden');
      $widget.removeClass('hidden').trigger('widget_shown');

      let widgetController = $widget.control();
      if (widgetController && widgetController.display) {
        let refetch = this.tryToRefetchOnce(widget)
          || widget.forceRefetch;
        return widgetController.display(refetch);
      }
    }
  },

  tryToRefetchOnce(descriptor) {
    const refetchOnce = this.options.attr('refetchOnce');

    if (!refetchOnce.size) {
      return false;
    }

    return refetchOnce.delete(descriptor.model.model_singular);
  },

  addRefetchOnceItems(modelNames) {
    modelNames = typeof modelNames === 'string' ? [modelNames] : modelNames;
    const refetchOnce = this.options.attr('refetchOnce');

    modelNames.forEach((modelName) => {
      refetchOnce.add(modelName);
    });
  },

  '{pubSub} refetchOnce'(scope, event) {
    this.addRefetchOnceItems(event.modelNames);
  },

  '.nav-logout click': function () {
    clearLocalStorage();
  },

  init_widget_descriptors: function () {
    this.options.widget_descriptors = this.options.widget_descriptors || {};
  },

  init_default_widgets: function () {
    loForEach(this.options.default_widgets, function (name) {
      let descriptor = this.options.widget_descriptors[name];
      this.add_dashboard_widget_from_descriptor(descriptor);
    }.bind(this));
  },

  hide_widget_area: function () {
    this.get_active_widget_containers().addClass('hidden');
  },
  show_widget_area: function () {
    this.get_active_widget_containers().removeClass('hidden');
  },

  get_active_widget_containers: function () {
    return this.element.find('.widget-area');
  },

  add_widget_from_descriptor: function (...args) {
    let descriptor = {};
    let that = this;
    let $element;
    let control;
    let $container;
    let $lastWidget;

    // Construct the final descriptor from one or more arguments
    args.forEach(function (nameOrDescriptor) {
      if (typeof (nameOrDescriptor) === 'string') {
        nameOrDescriptor =
          that.options.widget_descriptors[nameOrDescriptor];
      }
      $.extend(descriptor, nameOrDescriptor || {});
    });

    // Create widget in container?
    // return this.options.widget_container[0].add_widget(descriptor);

    if ($('#' + descriptor.controller_options.widget_id).length > 0) {
      return;
    }

    // FIXME: This should be in some Widget superclass
    if (descriptor.controller_options.widget_guard &&
        !descriptor.controller_options.widget_guard()) {
      return;
    }

    $element = $("<section class='widget'>");
    control = new descriptor
      .controller($element, descriptor.controller_options);

    if (isAdmin()) {
      control.prepare();
    }

    // FIXME: Abstraction violation: Sortable/DashboardWidget
    //   controllers should maybe handle this?
    $container = this.get_active_widget_containers().eq(0);
    $lastWidget = $container.find('section.widget').last();

    if ($lastWidget.length > 0) {
      $lastWidget.after($element);
    } else {
      $container.append($element);
    }

    this.options.innerNavDescriptors.push(control.options);

    return control;
  },

  add_dashboard_widget_from_descriptor: function (descriptor) {
    return this.add_widget_from_descriptor({
      controller: DashboardWidgets,
      controller_options: $.extend(descriptor, {dashboard_controller: this}),
    });
  },

  add_dashboard_widget_from_name: function (name) {
    let descriptor = this.options.widget_descriptors[name];
    if (!descriptor) {
      console.warn(`Unknown descriptor: ${name}`);
    } else {
      return this.add_dashboard_widget_from_descriptor(descriptor);
    }
  },
});

const PageObjectControl = DashboardControl.extend({}, {
  init: function () {
    this.options.model = this.options.instance.constructor;
    this._super();
    this.init_info_pin();
  },

  init_info_pin: function () {
    this.info_pin = new InfoPin(this.element.find('.pin-content'));
  },

  hideInfoPin() {
    const infopinCtr = this.info_pin.element.control();

    if (infopinCtr) {
      infopinCtr.hideInstance();
    }
  },

  init_page_title: function () {
    // Reset page title only when title of object is modified
    let that = this;
    let thatSuper = this._super;

    this.options.instance.bind('title', function () {
      thatSuper.apply(that);
    });
    this._super();
  },

  init_widget_descriptors: function () {
    this.options.widget_descriptors = this.options.widget_descriptors || {};
  },

  showWidgetArea(event) {
    if (this.info_pin) {
      this.hideInfoPin();
    }

    this._super(event);
  },
});

export {
  DashboardControl,
  PageObjectControl,
};
