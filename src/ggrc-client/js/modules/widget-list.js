/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMerge from 'lodash/merge';
import loForEach from 'lodash/forEach';
import SummaryWidgetController from '../controllers/summary-widget-controller';
import DashboardWidget from '../controllers/dashboard-widget-controller';
import InfoWidget from '../controllers/info-widget-controller';
import {
  makeInfoWidget,
  makeSummaryWidget,
  makeDashboardWidget,
  makeTreeView,
  createWidgetDescriptor,
} from './widget-descriptor';

const modules = {};

/*
  WidgetList - an extensions-ready repository for widget descriptor configs.
  Create a new widget list with new WidgetList(list_name, widget_descriptions)
    where widget_descriptions is an object with the structure:
    { <page_name> :
      { <widget_id> :
        { <widget descriptor-ready properties> },
      ...},
    ...}

  See the comments for WidgetDescriptor for details in what is necessary to define
  a widget descriptor.
*/

class WidgetList {
  constructor(name, opts) {
    modules[name] = this;
    Object.assign(this, opts);
  }

  /*
    Here instead of using the object format described in the class comments, you may instead
    add widgets to the WidgetList by using addWidget.

    pageType - the shortName of a GGRC object class, or "admin"
    id - the desired widget's id.
    descriptor - a widget descriptor appropriate for the widget type. FIXME - the descriptor's
      widget_id value must match the value passed as "id"
  */
  addWidget(pageType, id, descriptor) {
    this[pageType] = this[pageType] || {};
    if (this[pageType][id]) {
      loMerge(this[pageType][id], descriptor);
    } else {
      this[pageType][id] = descriptor;
    }
  }
}

/*
  getWidgetListFor: return a keyed object of widget descriptors for the specified page type.

  pageType - one of a GGRC object model's shortName, or "admin"

  The widget descriptors are built on the first call of this function; subsequently they are retrieved from the
    widget descriptor cache.
*/
function getWidgetListFor(pageType) {
  let widgets = {};
  let descriptors = {};

  loForEach(modules, (module) => {
    loForEach(module[pageType], (descriptor, id) => {
      if (!widgets[id]) {
        widgets[id] = descriptor;
      } else {
        loMerge(widgets[id], descriptor);
      }
    });
  });

  loForEach(widgets, (widget, widgetId) => {
    let ctrl = widget.content_controller;
    let options = widget.content_controller_options;

    if (ctrl && ctrl === InfoWidget) {
      descriptors[widgetId] = makeInfoWidget(
        options && options.instance ||
          widget.instance,
        options && options.widget_view || widget.widget_view
      );
    } else if (ctrl && ctrl === SummaryWidgetController) {
      descriptors[widgetId] = makeSummaryWidget(
        options && options.instance ||
          widget.instance,
        options && options.widget_view || widget.widget_view
      );
    } else if (ctrl && ctrl === DashboardWidget) {
      descriptors[widgetId] = makeDashboardWidget(
        options && options.instance ||
          widget.instance,
        options && options.widget_view || widget.widget_view
      );
    } else if (widget.widgetType === 'treeview') {
      descriptors[widgetId] = makeTreeView(
        options && (options.instance || options.parent_instance) ||
          widget.instance,
        options && options.model || widget.far_model ||
          widget.model,
        widget,
        widgetId
      );
    } else {
      descriptors[widgetId] = createWidgetDescriptor(
        pageType + ':' + widgetId, widget);
    }
  });

  loForEach(descriptors, (descriptor, id) => {
    if (!descriptor || descriptor.suppressed) {
      delete descriptors[id];
    }
  });

  return descriptors;
}

export default WidgetList;
export {
  getWidgetListFor,
};
