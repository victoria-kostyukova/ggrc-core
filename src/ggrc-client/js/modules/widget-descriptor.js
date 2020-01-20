/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import SummaryWidgetController from '../controllers/summary-widget-controller';
import DashboardWidget from '../controllers/dashboard-widget-controller';
import InfoWidget from '../controllers/info-widget-controller';
import {getWidgetConfig} from '../plugins/utils/widgets-utils';
import Program from '../models/business-models/program';

const widgetDescriptors = {};

/*
  A widget descriptor has the minimum five properties:
  widget_id:  the unique ID string for the widget
  widget_name: the display title for the widget in the UI
  widget_icon: the CSS class for the widget in the UI
  content_controller: The controller class for the widget's content section
  content_controller_options: options passed directly to the content controller; the
    precise options depend on the controller itself.  They usually require instance
    and/or model and some view.
*/
function createWidgetDescriptor(id, opts) {
  if (!opts && typeof id === 'object') {
    opts = id;
    id = opts.widget_id;
  }

  if (widgetDescriptors[id]) {
    $.extend(widgetDescriptors[id], opts);
    return widgetDescriptors[id];
  }

  const widgetDescriptor = {};
  $.extend(widgetDescriptor, opts);
  widgetDescriptors[id] = widgetDescriptor;
  return widgetDescriptor;
}

/*
  make an info widget descriptor for a GGRC object
  You must provide:
  instance - an instance that is a subclass of Cacheable
  widgetView [optional] - a template for rendering the info.
*/
function makeInfoWidget(instance, widgetView) {
  let defaultInfoWidgetView = '/base_objects/info.stache';
  return createWidgetDescriptor(
    instance.constructor.model_singular + ':info', {
      widget_id: 'info',
      widget_name: function () {
        if (instance.constructor.title_singular === 'Person') {
          return 'Info';
        }
        return instance.constructor.title_singular + ' Info';
      },
      widget_icon: 'info-circle',
      content_controller: InfoWidget,
      content_controller_options: {
        instance: instance,
        model: instance.constructor,
        widget_view: widgetView || defaultInfoWidgetView,
      },
      order: 5,
      uncountable: true,
    });
}

/*
  make an summary widget descriptor for a GGRC object
  You must provide:
  instance - an instance that is a subclass of Cacheable
  widgetView [optional] - a template for rendering the info.
*/
function makeSummaryWidget(instance, widgetView) {
  return createWidgetDescriptor(
    instance.constructor.model_singular + ':summary', {
      widget_id: 'summary',
      widget_name: function () {
        return instance.constructor.title_singular + ' Summary';
      },
      widget_icon: 'pie-chart',
      content_controller: SummaryWidgetController,
      content_controller_options: {
        instance: instance,
        model: instance.constructor,
        widget_view: widgetView,
      },
      order: 3,
      uncountable: true,
    });
}

function makeDashboardWidget(instance, widgetView) {
  return createWidgetDescriptor(
    instance.constructor.model_singular + ':dashboard', {
      widget_id: 'dashboard',
      widget_name: function () {
        if (instance.constructor.title_singular === 'Person') {
          return 'Dashboard';
        }
        return instance.constructor.title_singular + ' Dashboard';
      },
      widget_icon: 'tachometer',
      content_controller: DashboardWidget,
      content_controller_options: {
        instance: instance,
        model: instance.constructor,
        widget_view: widgetView,
      },
      order: 6,
      uncountable: true,
    });
}

/*
  make a tree view widget descriptor with mostly default-for-GGRC settings.
  You must provide:
  instance - an instance that is a subclass of Cacheable
  farModel - a Cacheable class
  extenders [optional] - an array of objects that will extend the default widget config.
*/
function makeTreeView(instance, farModel, extenders, id) {
  let descriptor;
  let objectConfig = getWidgetConfig(id);

  // Should not even try to create descriptor if configuration options are missing
  if (!instance || !farModel) {
    console.warn(
      `Arguments are missing or have incorrect format ${arguments}`);
    return null;
  }

  let widgetId = objectConfig.isObjectVersion ?
    farModel.table_singular + '_version' :
    (objectConfig.isMegaObject ?
      farModel.table_singular + '_' + objectConfig.relation :
      farModel.table_singular);

  descriptor = {
    widgetType: 'treeview',
    treeViewDepth: 2,
    widget_id: widgetId,
    widget_guard: function () {
      if (
        farModel.title_plural === 'Audits' &&
        instance instanceof Program
      ) {
        return 'context' in instance && !!(instance.context.id);
      }
      return true;
    },
    widget_name: function () {
      let farModelName =
        objectConfig.isObjectVersion || objectConfig.isMegaObject ?
          objectConfig.widgetName :
          farModel.title_plural;

      return farModelName;
    },
    widget_icon: farModel.table_singular,
    object_category: farModel.category || 'default',
    model: farModel,
    objectVersion: objectConfig.isObjectVersion,
    content_controller_options: {
      parent_instance: instance,
      model: farModel,
      objectVersion: objectConfig.isObjectVersion,
      megaRelated: objectConfig.isMegaObject,
      countsName: objectConfig.countsName,
      widgetId,
    },
  };

  $.extend(...([true, descriptor].concat(extenders || [])));

  return createWidgetDescriptor(
    instance.constructor.model_singular + ':' +
    id || instance.constructor.model_singular,
    descriptor
  );
}

export {
  createWidgetDescriptor,
  makeInfoWidget,
  makeSummaryWidget,
  makeDashboardWidget,
  makeTreeView,
};
