/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canMap from 'can-map';
import InnerNavVM from '../inner-nav-vm';
import {
  makeFakeInstance,
} from '../../../../js_specs/spec-helpers';
import router, * as RouterUtils from '../../../router';
import * as ObjectVersionsUtils
  from '../../../plugins/utils/object-versions-utils';
import * as CurrentPageUtils from '../../../plugins/utils/current-page-utils';
import * as WidgetsUtils from '../../../plugins/utils/widgets-utils';
import Cacheable from '../../../models/cacheable';
import * as Mappings from '../../../models/mappers/mappings';

describe('inner-nav view model', () => {
  let viewModel;

  beforeEach(() => {
    viewModel = new InnerNavVM();
  });

  describe('initVM() method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'handleDescriptors');
      spyOn(viewModel, 'route');
      spyOn(router, 'bind');
    });

    it('should call handleDescriptors()', () => {
      viewModel.initVM();

      expect(viewModel.handleDescriptors).toHaveBeenCalled();
    });

    it('should subscribe on router widget change', () => {
      viewModel.initVM();
      expect(router.bind)
        .toHaveBeenCalledWith('widget', jasmine.any(Function));
    });

    it('should route to selected in router widget', () => {
      router.attr('widget', 'selected widget');
      viewModel.initVM();

      expect(viewModel.route).toHaveBeenCalledWith('selected widget');
    });
  });

  describe('showTabs prop', () => {
    let isAdminSpy;
    let getCountsSpy;

    beforeEach(() => {
      isAdminSpy = spyOn(CurrentPageUtils, 'isAdmin');
      getCountsSpy = spyOn(WidgetsUtils, 'getCounts');
    });

    it('returns TRUE when on Admin page', () => {
      isAdminSpy.and.returnValue(true);
      getCountsSpy.and.returnValue(new canMap());

      expect(viewModel.attr('showTabs')).toBe(true);
    });

    it('returns FALSE when counts is empty and not Admin page', () => {
      isAdminSpy.and.returnValue(false);
      getCountsSpy.and.returnValue(new canMap());

      expect(viewModel.attr('showTabs')).toBe(false);
    });

    it('returns TRUE when counts is not empty and not Admin page', () => {
      isAdminSpy.and.returnValue(false);
      getCountsSpy.and.returnValue(new canMap({
        Assessment: 10,
      }));

      expect(viewModel.attr('showTabs')).toBe(true);
    });
  });

  describe('showAllTabs prop', () => {
    it('should return show_all_tabs value from instance model', () => {
      let instance = makeFakeInstance({model: Cacheable, staticProps: {
        obj_nav_options: {
          show_all_tabs: true,
        },
      }})();
      viewModel.attr('instance', instance);

      expect(viewModel.attr('showAllTabs')).toBe(true);
    });
  });

  describe('handleDescriptors() method', () => {
    it('should create widgets from descriptors', () => {
      spyOn(viewModel, 'createWidget')
        .and.returnValues({id: 0}, {id: 1}, {id: 2});
      viewModel.attr('widgetList', null);

      let descriptors = [{}, {}, {}];
      viewModel.attr('widgetDescriptors', descriptors);

      viewModel.handleDescriptors();

      let widgetList = viewModel.attr('widgetList');
      expect(viewModel.createWidget).toHaveBeenCalledTimes(3);
      widgetList.forEach((widget, i) => {
        expect(widget.serialize()).toEqual({id: i});
      });
      expect(widgetList.length).toBe(3);
    });

    it('should sort widgets by order and title', () => {
      spyOn(viewModel, 'createWidget').and.callFake((descriptor) => {
        return {
          order: descriptor.order,
          title: descriptor.widget_name,
        };
      });

      let descriptors = [
        {order: 3, widget_name: 'b'},
        {order: 2, widget_name: 'a'},
        {order: 3, widget_name: 'a'},
        {order: 2, widget_name: 'b'},
      ];
      viewModel.attr('widgetDescriptors', descriptors);

      viewModel.handleDescriptors();

      let widgets = viewModel.attr('widgetList');

      expect(widgets[0].serialize())
        .toEqual(jasmine.objectContaining({order: 2, title: 'a'}));
      expect(widgets[1])
        .toEqual(jasmine.objectContaining({order: 2, title: 'b'}));
      expect(widgets[2])
        .toEqual(jasmine.objectContaining({order: 3, title: 'a'}));
      expect(widgets[3])
        .toEqual(jasmine.objectContaining({order: 3, title: 'b'}));
    });
  });

  describe('createWidget() method', () => {
    beforeEach(() => {
      let instance = makeFakeInstance({model: Cacheable, staticProps: {
        obj_nav_options: {
          force_show_list: ['force show widget title'],
        },
      }})();
      viewModel.attr('instance', instance);
    });

    it('should set id', () => {
      let result = viewModel.createWidget({
        widget_id: 'id',
        model: {},
        content_controller_options: {},
      });
      expect(result.id).toBe('id');
    });

    it('should set title when widgetName is function in descriptor', () => {
      let result = viewModel.createWidget({
        widget_name: () => 'title',
        model: {},
        content_controller_options: {},
      });
      expect(result.title).toBe('title');
    });

    it('should set title when widgetName is string in descriptor', () => {
      let result = viewModel.createWidget({
        widget_name: 'title',
        model: {},
        content_controller_options: {},
      });
      expect(result.title).toBe('title');
    });

    it('should set empty type for not object version widgets', () => {
      spyOn(ObjectVersionsUtils, 'isObjectVersion').and.returnValue(false);
      let result = viewModel.createWidget({
        widget_id: 'id',
        model: {},
        content_controller_options: {},
      });
      expect(result.type).toBe('');
    });

    it('should set version type for object versions widgets', () => {
      spyOn(ObjectVersionsUtils, 'isObjectVersion').and.returnValue(true);
      let result = viewModel.createWidget({
        widget_id: 'id',
        model: {},
        content_controller_options: {},
      });
      expect(result.type).toBe('version');
    });

    it('should set icon', () => {
      let result = viewModel.createWidget({
        widget_icon: 'icon',
        model: {},
        content_controller_options: {},
      });
      expect(result.icon).toBe('icon');
    });

    it('should set href', () => {
      spyOn(RouterUtils, 'buildUrl').and.returnValue('href');
      let result = viewModel.createWidget({
        widget_id: 'id',
        model: {},
        content_controller_options: {},
      });
      expect(result.href).toBe('href');
    });

    it('should set model', () => {
      let result = viewModel.createWidget({
        model: 'model',
        content_controller_options: {},
      });
      expect(result.model).toBe('model');
    });

    it('should set order', () => {
      let result = viewModel.createWidget({
        order: 'order',
        model: {},
        content_controller_options: {},
      });
      expect(result.order).toBe('order');
    });

    it('should set uncountable', () => {
      let result = viewModel.createWidget({
        uncountable: true,
        model: {},
        content_controller_options: {},
      });
      expect(result.uncountable).toBe(true);
    });

    it('should set default count', () => {
      let result = viewModel.createWidget({
        model: {},
        content_controller_options: {},
      });
      expect(result.count).toBe(0);
    });

    it('should set countsName from descriptor if exists', () => {
      let result = viewModel.createWidget({
        countsName: 'name',
        content_controller_options: {},
      });
      expect(result.countsName).toBe('name');
    });

    it('should set countsName from descriptor\'s content_controller_options' +
        ' if exists', () => {
      let result = viewModel.createWidget({
        content_controller_options: {
          countsName: 'name',
        },
      });
      expect(result.countsName).toBe('name');
    });

    it('should use model model_singular as countsName if no other options',
      () => {
        let result = viewModel.createWidget({
          model: {
            model_singular: 'name',
          },
          content_controller_options: {},
        });
        expect(result.countsName).toBe('name');
      });

    it('should not set countsName if widget is uncountable', () => {
      let result = viewModel.createWidget({
        uncountable: true,
        model: {
          shortName: 'name',
        },
        content_controller_options: {},
      });
      expect(result.countsName).toBe('');
    });

    it('should set default forceShow', () => {
      let result = viewModel.createWidget({
        model: {},
        content_controller_options: {},
      });
      expect(result.forceShow).toBe(false);
    });

    it('should set inForceShowList TRUE ' +
        'if widget is in instance force show list', () => {
      let result = viewModel.createWidget({
        widget_name: 'force show widget title',
        model: {},
        content_controller_options: {},
      });
      expect(result.inForceShowList).toBe(true);
    });

    it('should set inForceShowList FALSE ' +
        'if widget is not in instance force show list', () => {
      let result = viewModel.createWidget({
        widget_name: 'not in force show list widget title',
        model: {},
        content_controller_options: {},
      });
      expect(result.inForceShowList).toBe(false);
    });
  });

  describe('updateHiddenWidgets(widget) method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'addToHiddenWidgets');
      spyOn(viewModel, 'removeFromHiddenWidgets');
      spyOn(Mappings, 'allowedToCreateOrMap').and.returnValue(true);
    });

    function showAllTabs(value) {
      let instance = makeFakeInstance({model: Cacheable, staticProps: {
        obj_nav_options: {
          show_all_tabs: value,
        },
      }})();
      viewModel.attr('instance', instance);
    }

    it('should do nothing if should be shown all widgets', () => {
      showAllTabs(true);

      viewModel.updateHiddenWidgets({model: {}});

      expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
      expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
    });

    it('should do nothing if widget is in forceShowList', () => {
      showAllTabs(false);

      let widget = new canMap({
        inForceShowList: true,
        model: {},
      });

      viewModel.updateHiddenWidgets(widget);

      expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
      expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
    });

    it('should do nothing if widget has version type', () => {
      showAllTabs(false);

      let widget = new canMap({
        type: 'version',
        model: {},
      });

      viewModel.updateHiddenWidgets(widget);

      expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
      expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
    });

    it('should do nothing if widget is uncountable', () => {
      showAllTabs(false);

      let widget = new canMap({
        uncountable: true,
        model: {},
      });

      viewModel.updateHiddenWidgets(widget);

      expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
      expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
    });

    it('should do nothing if widget is not allowed to be mappped or created',
      () => {
        showAllTabs(false);

        let widget = new canMap({
          uncountable: false,
          type: '',
          inForceShowList: false,
          model: {},
        });

        Mappings.allowedToCreateOrMap.and.returnValue(false);

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.addToHiddenWidgets).not.toHaveBeenCalled();
        expect(viewModel.removeFromHiddenWidgets).not.toHaveBeenCalled();
      });

    it('should remove from hiddenWidgets when widget has count',
      () => {
        showAllTabs(false);

        let widget = new canMap({
          count: 5,
          forceShow: false,
          model: {},
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.removeFromHiddenWidgets)
          .toHaveBeenCalledWith(widget);
      });

    it('should remove from hiddenWidgets when widget forceShow is true',
      () => {
        showAllTabs(false);

        let widget = new canMap({
          count: 0,
          forceShow: true,
          model: {},
        });

        viewModel.updateHiddenWidgets(widget);

        expect(viewModel.removeFromHiddenWidgets)
          .toHaveBeenCalledWith(widget);
      });

    it('should add to hiddenWidgets when widget has no count and ' +
        'forceShow is false', () => {
      showAllTabs(false);

      let widget = new canMap({
        count: 0,
        forceShow: false,
        model: {},
      });

      viewModel.updateHiddenWidgets(widget);

      expect(viewModel.addToHiddenWidgets).toHaveBeenCalledWith(widget);
    });
  });

  describe('addToHiddenWidgets(widget) method', () => {
    it('should add widget if not in the list', () => {
      viewModel.attr('hiddenWidgets', []);

      let widget = new canMap();
      viewModel.addToHiddenWidgets(widget);

      expect(viewModel.attr('hiddenWidgets').length).toBe(1);
      expect(viewModel.attr('hiddenWidgets')[0]).toBe(widget);
    });

    it('should not add widget if already in the list', () => {
      let widget = new canMap({id: '1'});
      viewModel.attr('hiddenWidgets', [widget]);

      viewModel.addToHiddenWidgets(widget);

      expect(viewModel.attr('hiddenWidgets').length).toBe(1);
      expect(viewModel.attr('hiddenWidgets')[0]).toBe(widget);
    });

    describe('should add widget to list according to alph order', () => {
      it('if need add to the beginning of the array', () => {
        let widget = new canMap({id: '1', title: 'A'});
        const hiddenWidgets = [new canMap({id: '2', title: 'B'})];
        viewModel.attr('hiddenWidgets', hiddenWidgets);

        viewModel.addToHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(2);
        expect(viewModel.attr('hiddenWidgets')[0]).toBe(widget);
      });

      it('if need add to the middle of the array', () => {
        let widget = new canMap({id: '2', title: 'B'});
        const hiddenWidgets = [
          new canMap({id: '1', title: 'A'}),
          new canMap({id: '3', title: 'C'}),
        ];
        viewModel.attr('hiddenWidgets', hiddenWidgets);

        viewModel.addToHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(3);
        expect(viewModel.attr('hiddenWidgets')[1]).toBe(widget);
      });

      it('if need add to the endning of the array', () => {
        let widget = new canMap({id: '2', title: 'B'});
        const hiddenWidgets = [new canMap({id: '1', title: 'A'})];
        viewModel.attr('hiddenWidgets', hiddenWidgets);

        viewModel.addToHiddenWidgets(widget);

        expect(viewModel.attr('hiddenWidgets').length).toBe(2);
        expect(viewModel.attr('hiddenWidgets')[1]).toBe(widget);
      });
    });
  });

  describe('removeFromHiddenWidgets(widget) method', () => {
    it('should remove widget if it is in the list', () => {
      let widget = new canMap({id: '1'});
      viewModel.attr('hiddenWidgets', [widget]);

      viewModel.removeFromHiddenWidgets(widget);

      expect(viewModel.attr('hiddenWidgets').length).toBe(0);
    });

    it('should not remove widget if it is not in the list', () => {
      let widget = new canMap({id: '1'});
      viewModel.attr('hiddenWidgets', [widget]);

      viewModel.removeFromHiddenWidgets({id: '2'});

      expect(viewModel.attr('hiddenWidgets').length).toBe(1);
    });
  });

  describe('route(widgetId) method', () => {
    let findWidgetByIdSpy;

    beforeEach(() => {
      spyOn(viewModel, 'updateHiddenWidgets');
      findWidgetByIdSpy = spyOn(viewModel, 'findWidgetById');
    });

    it('should select first widget from widgetList ' +
        'if selected widget is not in the list', () => {
      findWidgetByIdSpy.and.returnValue(null);
      viewModel.attr('widgetList', [{id: '1'}, {id: '2'}]);
      spyOn(router, 'attr');

      viewModel.route('selected widget id');
      expect(router.attr).toHaveBeenCalledWith('widget', '1');
    });

    it('should set forceShow TRUE for widget', () => {
      let widget = new canMap({id: '1', forceShow: false});
      findWidgetByIdSpy.and.returnValue(widget);

      viewModel.route('1');

      expect(widget.attr('forceShow')).toBe(true);
    });

    it('should set activeWidget if widget is in widgetList ', () => {
      let widget = new canMap({id: '1'});
      findWidgetByIdSpy.and.returnValue(widget);
      viewModel.attr('activeWidget', null);

      viewModel.route('1');

      expect(viewModel.attr('activeWidget').serialize().id)
        .toEqual(widget.id);
    });

    it('should dispatch "activeChanged" event if widget is in widgetList',
      () => {
        spyOn(viewModel, 'dispatch');
        let widget = new canMap({id: '1'});
        findWidgetByIdSpy.and.returnValue(widget);

        viewModel.route('1');

        expect(viewModel.dispatch).toHaveBeenCalledWith({
          type: 'activeChanged',
          widget,
        });
      });

    it('should update hiddenWidgets list', () => {
      let widget = new canMap({id: '1'});
      findWidgetByIdSpy.and.returnValue(widget);

      viewModel.route('1');

      expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
    });
  });

  describe('findWidgetById(widgetId) method', () => {
    it('should search widgets by id in widgetList', () => {
      let widget1 = {id: '1'};
      let widget2 = {id: '2'};
      viewModel.attr('widgetList', [widget1, widget2]);

      let result = viewModel.findWidgetById('2');

      expect(result.serialize()).toEqual(widget2);
    });

    it('returns undefined when widget is not found', () => {
      let widget1 = {id: '1'};
      let widget2 = {id: '2'};
      viewModel.attr('widgetList', [widget1, widget2]);

      let result = viewModel.findWidgetById('3');

      expect(result).toBeUndefined();
    });
  });

  describe('findWidgetsByCountsName(countsName) method', () => {
    it('should search widgets by countsName in widgetList', () => {
      let widget1 = {id: '1', countsName: 'name1'};
      let widget2 = {id: '2', countsName: 'name2'};
      viewModel.attr('widgetList', [widget1, widget2]);

      let result = viewModel.findWidgetByCountsName('name2');

      expect(result.serialize()).toEqual(widget2);
    });

    it('returns undefined when widget is not found', () => {
      let widget1 = {id: '1', countsName: 'name1'};
      let widget2 = {id: '2', countsName: 'name2'};
      viewModel.attr('widgetList', [widget1, widget2]);

      let result = viewModel.findWidgetByCountsName('name3');

      expect(result).toBeUndefined();
    });
  });

  describe('setWidgetCount(name, count) method', () => {
    it('should set count to widget', () => {
      spyOn(viewModel, 'updateHiddenWidgets');
      let widget = new canMap();
      spyOn(viewModel, 'findWidgetByCountsName').and.returnValue(widget);

      viewModel.setWidgetCount('name', 5);

      expect(widget.count).toBe(5);
    });

    it('should update hiddenWidgets list', () => {
      spyOn(viewModel, 'updateHiddenWidgets');
      let widget = new canMap();
      spyOn(viewModel, 'findWidgetByCountsName').and.returnValue(widget);

      viewModel.setWidgetCount('name', 5);

      expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
    });
  });

  describe('closeTab(event) method', () => {
    beforeEach(() => {
      spyOn(viewModel, 'updateHiddenWidgets');
    });

    it('should set forceShow FALSE for widget', () => {
      let widget = new canMap({id: '1', forceShow: true});

      viewModel.closeTab({widget});

      expect(widget.attr('forceShow')).toBe(false);
    });

    it('should not update router if closed tab is not currently selected',
      () => {
        router.attr('widget', 'selected');

        viewModel.closeTab({widget: new canMap({id: 'another widget'})});

        expect(router.attr('widget')).toBe('selected');
      });

    it('should open first tab in widgetList ' +
        'if closed tab is currently selected',
    () => {
      router.attr('widget', 'selected');
      viewModel.attr('widgetList', [new canMap({id: 'first tab'})]);

      viewModel.closeTab({widget: new canMap({id: 'selected'})});

      expect(router.attr('widget')).toBe('first tab');
    });

    it('should update hiddenWidgets list', () => {
      let widget = new canMap({id: '1', forceShow: true});

      viewModel.closeTab({widget});

      expect(viewModel.updateHiddenWidgets).toHaveBeenCalledWith(widget);
    });
  });
});
