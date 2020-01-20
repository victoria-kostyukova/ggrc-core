/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import canStache from 'can-stache';
import canComponent from 'can-component';
import loFind from 'lodash/find';
import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-mapping-container';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/unified-mapper/mapper-results';
import '../../components/collapsible-panel/collapsible-panel';
import '../../components/mapping-controls/mapping-type-selector';
import '../questionnaire-mapping-link/questionnaire-mapping-link';
import './create-and-map';

import template from './object-mapper.stache';

import tracker from '../../tracker';
import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import {
  isSnapshotModel,
  isSnapshotParent,
} from '../../plugins/utils/snapshot-utils';
import {getPageInstance} from '../../plugins/utils/current-page-utils';
import {refreshCounts} from '../../plugins/utils/widgets-utils';
import {
  MAP_OBJECTS,
  REFRESH_MAPPING,
  REFRESH_SUB_TREE,
  BEFORE_MAPPING,
  OBJECTS_MAPPED_VIA_MAPPER,
  DEFERRED_MAP_OBJECTS,
  OBJECT_DESTROYED,
  UNMAP_DESTROYED_OBJECT,
} from '../../events/event-types';
import {
  allowedToMap,
  shouldBeMappedExternally,
} from '../../models/mappers/mappings';
import {mapObjects as mapObjectsUtil} from '../../plugins/utils/mapper-utils';
import * as businessModels from '../../models/business-models';
import TreeViewConfig from '../../apps/base-widgets';
import {confirm} from '../../plugins/utils/modals';
import {isMegaMapping} from '../../plugins/utils/mega-object-utils';
import pubSub from '../../pub-sub';

let DEFAULT_OBJECT_MAP = {
  AccountBalance: 'Control',
  Assessment: 'Control',
  Objective: 'Control',
  Requirement: 'Objective',
  Regulation: 'Requirement',
  Product: 'System',
  ProductGroup: 'Product',
  Standard: 'Requirement',
  Contract: 'Requirement',
  Control: 'Objective',
  System: 'Product',
  KeyReport: 'Control',
  Metric: 'Product',
  Process: 'Risk',
  AccessGroup: 'System',
  DataAsset: 'Policy',
  Facility: 'Program',
  Issue: 'Control',
  Market: 'Program',
  OrgGroup: 'Program',
  Policy: 'DataAsset',
  Program: 'Standard',
  Project: 'Program',
  Risk: 'Control',
  CycleTaskGroupObjectTask: 'Control',
  Threat: 'Risk',
  Vendor: 'Program',
  Audit: 'Product',
  TaskGroup: 'Control',
  TechnologyEnvironment: 'Product',
};

let getDefaultType = function (type, object) {
  let treeView = TreeViewConfig.attr('sub_tree_for')[object];
  let defaultType =
    (businessModels[type] && type) ||
    DEFAULT_OBJECT_MAP[object] ||
    (treeView ? treeView.display_list[0] : 'Control');
  return defaultType;
};

/**
 * A component implementing a modal for mapping objects to other objects,
 * taking the object type mapping constraints into account.
 */
export default canComponent.extend({
  tag: 'object-mapper',
  view: canStache(template),
  leakScope: true,
  viewModel: function (attrs, parentViewModel) {
    let config = {
      general: parentViewModel.attr('general'),
      special: parentViewModel.attr('special'),
    };

    let resolvedConfig = ObjectOperationsBaseVM.extractConfig(
      config.general.type,
      config
    );

    return ObjectOperationsBaseVM.extend({
      isRefreshCountsNeeded:
        (parentViewModel.attr('is_refresh_counts_needed') !== undefined)
          ? parentViewModel.attr('is_refresh_counts_needed')
          : true,
      join_object_id: resolvedConfig.isNew ? null :
        resolvedConfig['join-object-id'] ||
        (getPageInstance() && getPageInstance().id),
      object: resolvedConfig.object,
      type: getDefaultType(resolvedConfig.type, resolvedConfig.object),
      config: config,
      useSnapshots: resolvedConfig.useSnapshots,
      isLoadingOrSaving: function () {
        return this.attr('is_saving') ||
          //  disable changing of object type while loading
          //  to prevent errors while speedily selecting different types
          this.attr('is_loading');
      },
      deferred_to: parentViewModel.attr('deferred_to'),
      deferred_list: [],
      /**
       * This property is needed to work together with deferredSave() method.
       * If it's true then mapped objects shouldn't be mapped immediately to
       * target object - they will be stored in the scope of deferred-mapper
       * component. This component will decide, when mapped objects should be
       * mapped to target object.
       * @property {boolean}
       */
      deferred: false,
      isMappableExternally: false,
      searchModel: null,
      /**
       * Stores "id: relation" pairs for mega objects mapping
       * @type {Object}
       * @example
       * {
       *    1013: 'parent',
       *    1025: 'child',
       *    defaultValue: 'child',
       * }
       */
      megaRelationObj: {
        defaultValue: config.general.megaRelation || 'child',
      },
      pubSub,
      /**
       * There is situation when user switch type from one two another.
       * After it current config is changed immediately. It leads to the fact
       * that all things in the templates are rerendered.
       * But several controls must not be rerenderd till submit action will not be
       * occurred (for example it's a results in unified mapper - when we switch
       * object type the results should not be painted in another color (if
       * unified mapper operates with a snapshots and usual objects)).
       */
      freezedConfigTillSubmit: {},
      showAsSnapshots: function () {
        if (this.attr('freezedConfigTillSubmit.useSnapshots')) {
          return true;
        }
        return false;
      },
      isSnapshotMapping: function () {
        let isSnapshotParentSrc = isSnapshotParent(this.attr('object'));
        let isSnapshotParentDst = isSnapshotParent(this.attr('type'));
        let isSnapshotModelSrc = isSnapshotModel(this.attr('object'));
        let isSnapshotModelDst = isSnapshotModel(this.attr('type'));

        let result =
          // Show message if source is snapshotParent and destination is snapshotable.
          (isSnapshotParentSrc && isSnapshotModelDst) ||
          // Show message if destination is snapshotParent and source is snapshotable.
          (isSnapshotParentDst && isSnapshotModelSrc);

        return result;
      },
      updateFreezedConfigToLatest: function () {
        this.attr('freezedConfigTillSubmit', this.attr('currConfig'));
      },
      onSubmit: function () {
        this.updateFreezedConfigToLatest();
        this.attr('searchModel', this.attr('model'));

        let source = this.attr('object');
        let destination = this.attr('type');
        if (shouldBeMappedExternally(source, destination)) {
          this.attr('isMappableExternally', true);
          return;
        } else {
          this.attr('isMappableExternally', false);
          // calls base version
          this._super(...arguments);
        }
      },

      onDestroyItem: function (item) {
        if (!this.attr('deferred_to.list')) {
          return;
        }
        const source = this.attr('deferred_to').instance;
        const object = loFind(this.attr('deferred_to.list'),
          (x) => x.id === item.id);
        const deferredToList = this.attr('deferred_to.list')
          .filter((x) => x.id !== item.id);
        this.attr('deferred_to.list').replace(deferredToList);
        if (source) {
          if (source.list) {
            const deferredList = deferredToList
              .map((x) => {
                return ({
                  id: x.id,
                  type: x.type,
                });
              });
            this.attr('deferred_to.instance.list').replace(deferredList);
          }
          source.dispatch({
            ...UNMAP_DESTROYED_OBJECT,
            object,
          });
        }
      },
    });
  },

  events: {
    [`{parentInstance} ${MAP_OBJECTS.type}`]([instance], event) {
      // this event is called when objects just created and should be mapped
      // so object-mapper modal should be closed and removed from DOM
      this.closeModal();

      if (event.objects.length) {
        this.map(event.objects, event.options);
      }
    },

    [`{parentInstance} ${OBJECT_DESTROYED.type}`](event, {object}) {
      // this event is called when item was removed from mapper-result
      // so deferred list should be updated
      if (object && object.id) {
        this.viewModel.onDestroyItem(object);
      }
    },

    // hide object-mapper modal when create new object button clicked
    'create-and-map click'() {
      this.element.trigger('hideModal');
    },
    // close mapper as mapping will be handled externally
    'create-and-map mapExternally'() {
      this.closeModal();
    },
    // reopen object-mapper if creating was canceled
    'create-and-map canceled'() {
      this.element.trigger('showModal');
    },
    '{pubSub} mapAsChild'(el, ev) {
      this.viewModel.attr('megaRelationObj')[ev.id] = ev.val;
    },
    inserted() {
      this.viewModel.attr('selected').replace([]);

      if (this.viewModel.attr('deferred_to.list')) {
        let deferredToList = this.viewModel.attr('deferred_to.list')
          .map((item) => {
            return ({
              id: item.id,
              type: item.type,
            });
          });
        this.viewModel.attr('deferred_list', deferredToList);
      }

      this.viewModel.onSubmit();
    },
    map(objects, options) {
      if (this.viewModel.attr('deferred')) {
        // postpone map operation unless target object is saved
        this.deferredSave(objects);
      } else if (options && options.megaMapping) {
        this.performMegaMap(objects, options.megaRelation);
      } else {
        // map objects immediately
        this.mapObjects(objects);
      }
    },
    performMegaMap(objects, relation) {
      const relationsObj = {};
      objects.forEach((obj) => relationsObj[obj.id] = relation);
      this.mapObjects(objects, true, relationsObj);
    },
    closeModal: function () {
      this.viewModel.attr('is_saving', false);

      // TODO: Find proper way to dismiss the modal
      if (this.element) {
        this.element.find('.modal-dismiss').trigger('click');
      }
    },
    deferredSave: function (objects) {
      let source = this.viewModel.attr('deferred_to').instance;
      const deferredObjects = objects
        .filter((destination) => allowedToMap(source, destination));

      source.dispatch({
        ...DEFERRED_MAP_OBJECTS,
        objects: deferredObjects,
      });
      this.closeModal();
    },
    '.modal-footer .btn-map click': function (el, ev) {
      ev.preventDefault();
      if (el.hasClass('disabled') ||
        this.viewModel.attr('is_saving')) {
        return;
      }

      const selectedObjects = this.viewModel.attr('selected');
      // If we need to map object later on (set by 'data-deferred' attribute)
      // TODO: Figure out nicer / proper way to handle deferred save
      if (this.viewModel.attr('deferred')) {
        return this.deferredSave(selectedObjects);
      }

      const megaMapping = isMegaMapping(this.viewModel.attr('object'),
        this.viewModel.attr('type'));

      if (megaMapping) {
        this.proceedWithMegaMapping(selectedObjects);
      } else {
        this.proceedWithRegularMapping(selectedObjects);
      }
    },
    proceedWithMegaMapping(selectedObjects) {
      confirm({
        modal_title: 'Confirmation',
        modal_description: 'Objects from the child program will' +
          ' automatically be mapped to parent program. Do you want' +
          ' to proceed?',
        modal_confirm: 'Proceed',
        button_view: '/modals/confirm-cancel-buttons.stache',
      }, () => {
        this.viewModel.attr('is_saving', true);
        this.mapObjects(selectedObjects, true,
          this.viewModel.attr('megaRelationObj'));
      });
    },
    proceedWithRegularMapping(selectedObjects) {
      this.viewModel.attr('is_saving', true);
      this.mapObjects(selectedObjects);
    },
    mapObjects(objects, megaMapping, relationsObj) {
      const viewModel = this.viewModel;
      const object = viewModel.attr('object');
      const type = viewModel.attr('type');
      const instance = businessModels[object].findInCacheById(
        viewModel.attr('join_object_id')
      );
      let stopFn = tracker.start(
        tracker.FOCUS_AREAS.MAPPINGS(instance.type),
        tracker.USER_JOURNEY_KEYS.MAP_OBJECTS(type),
        tracker.USER_ACTIONS.MAPPING_OBJECTS(objects.length)
      );

      instance.dispatch({
        ...BEFORE_MAPPING,
        destinationType: type,
      });

      mapObjectsUtil(instance, objects, {
        useSnapshots: viewModel.attr('useSnapshots'),
        megaMapping,
        relationsObj,
      })
        .then(() => {
          stopFn();

          instance.dispatch({
            ...OBJECTS_MAPPED_VIA_MAPPER,
            objects,
          });
          instance.dispatch('refreshInstance');
          instance.dispatch({
            ...REFRESH_MAPPING,
            destinationType: type,
          });
          instance.dispatch(REFRESH_SUB_TREE);

          if (viewModel.attr('isRefreshCountsNeeded')) {
            // This Method should be modified to event
            refreshCounts();
          }
        })
        .catch((response, message) => {
          $('body').trigger('ajax:flash', {error: message});
        })
        .finally(() => {
          this.closeModal();
        });
    },
  },

  helpers: {
    get_title: function (options) {
      let instance = this.attr('parentInstance');
      return (
        (instance && instance.title) ?
          instance.title :
          this.attr('object')
      );
    },
    get_object: function (options) {
      let type = businessModels[this.attr('type')];
      if (type && type.title_plural) {
        return type.title_plural;
      }
      return 'Objects';
    },
  },
});
