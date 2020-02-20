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
  REFRESH_MAPPED_COUNTER,
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

let getDefaultType = (type, object) => {
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
  viewModel(attrs, parentViewModel) {
    let config = {
      general: parentViewModel.attr('general'),
      special: parentViewModel.attr('special'),
    };

    let resolvedConfig = ObjectOperationsBaseVM.extractConfig(
      config.general.type,
      config
    );

    return ObjectOperationsBaseVM.extend({
      isRefreshCountsNeeded: {
        value: (parentViewModel.is_refresh_counts_needed !== undefined)
          ? parentViewModel.is_refresh_counts_needed
          : true,
      },
      join_object_id: {
        value: resolvedConfig.isNew
          ? null
          : resolvedConfig['join-object-id']
            || (getPageInstance() && getPageInstance().id),
      },
      object: {
        value: resolvedConfig.object,
      },
      type: {
        value: () => getDefaultType(resolvedConfig.type, resolvedConfig.object),
      },
      config: {
        value: () => config,
      },
      useSnapshots: {
        value: resolvedConfig.useSnapshots,
      },
      isLoadingOrSaving() {
        return this.is_saving ||
          //  disable changing of object type while loading
          //  to prevent errors while speedily selecting different types
          this.is_loading;
      },
      deferred_to: {
        value: () =>
          parentViewModel.attr('deferred_to') || {},
      },
      deferred_list: {
        value: () => [],
      },
      /**
       * This property is needed to work together with deferredSave() method.
       * If it's true then mapped objects shouldn't be mapped immediately to
       * target object - they will be stored in the scope of deferred-mapper
       * component. This component will decide, when mapped objects should be
       * mapped to target object.
       * @property {boolean}
       */
      deferred: {
        value: false,
      },
      isMappableExternally: {
        value: false,
      },
      searchModel: {
        value: null,
      },
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
        value: () => ({
          defaultValue: config.general.megaRelation || 'child',
        }),
      },
      pubSub: {
        value: () => pubSub,
      },
      /**
       * There is situation when user switch type from one two another.
       * After it current config is changed immediately. It leads to the fact
       * that all things in the templates are rerendered.
       * But several controls must not be rerendered till submit action will not be
       * occurred (for example it's a results in unified mapper - when we switch
       * object type the results should not be painted in another color (if
       * unified mapper operates with a snapshots and usual objects)).
       */
      freezedConfigTillSubmit: {
        value: () => ({}),
      },
      showAsSnapshots() {
        return this.freezedConfigTillSubmit
          && this.freezedConfigTillSubmit.useSnapshots
          ? true
          : false;
      },
      isSnapshotMapping() {
        let isSnapshotParentSrc = isSnapshotParent(this.object);
        let isSnapshotParentDst = isSnapshotParent(this.type);
        let isSnapshotModelSrc = isSnapshotModel(this.object);
        let isSnapshotModelDst = isSnapshotModel(this.type);

        let result =
          // Show message if source is snapshotParent and destination is snapshotable.
          (isSnapshotParentSrc && isSnapshotModelDst) ||
          // Show message if destination is snapshotParent and source is snapshotable.
          (isSnapshotParentDst && isSnapshotModelSrc);

        return result;
      },
      updateFreezedConfigToLatest() {
        this.freezedConfigTillSubmit = this.currConfig;
      },
      onSubmit: function () {
        this.updateFreezedConfigToLatest();
        this.searchModel = this.model;

        let source = this.object;
        let destination = this.type;
        if (shouldBeMappedExternally(source, destination)) {
          this.isMappableExternally = true;
          return;
        } else {
          this.isMappableExternally = false;
          // calls base version
          this._super(...arguments);
        }
      },
      onDestroyItem(item) {
        if (!this.deferred_to.list) {
          return;
        }
        const source = this.deferred_to.instance;
        const object = loFind(this.deferred_to.list,
          (x) => x.id === item.id);
        const deferredToList = this.deferred_to.list
          .filter((x) => x.id !== item.id);
        this.deferred_to.list.replace(deferredToList);
        if (source) {
          if (source.list) {
            const deferredList = deferredToList
              .map((x) => {
                return ({
                  id: x.id,
                  type: x.type,
                });
              });
            this.deferred_to.instance.list.replace(deferredList);
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
      this.viewModel.megaRelationObj[ev.id] = ev.val;
    },
    inserted() {
      this.viewModel.selected.replace([]);

      if (this.viewModel.deferred_to.list) {
        let deferredToList = this.viewModel.deferred_to.list
          .map((item) => {
            return ({
              id: item.id,
              type: item.type,
            });
          });
        this.viewModel.deferred_list = deferredToList;
      }

      this.viewModel.onSubmit();
    },
    map(objects, options) {
      if (this.viewModel.deferred) {
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
    closeModal() {
      this.viewModel.is_saving = false;

      // TODO: Find proper way to dismiss the modal
      if (this.element) {
        this.element.find('.modal-dismiss').trigger('click');
      }
    },
    deferredSave(objects) {
      let source = this.viewModel.deferred_to.instance;
      const deferredObjects = objects
        .filter((destination) => allowedToMap(source, destination));

      source.dispatch({
        ...DEFERRED_MAP_OBJECTS,
        objects: deferredObjects,
      });
      this.closeModal();
    },
    '.modal-footer .btn-map click'(el, ev) {
      ev.preventDefault();
      if (el.hasClass('disabled') ||
        this.viewModel.is_saving) {
        return;
      }

      const selectedObjects = this.viewModel.selected;
      // If we need to map object later on (set by 'data-deferred' attribute)
      // TODO: Figure out nicer / proper way to handle deferred save
      if (this.viewModel.deferred) {
        return this.deferredSave(selectedObjects);
      }

      const megaMapping = isMegaMapping(this.viewModel.object,
        this.viewModel.type);

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
        this.viewModel.is_saving = true;
        this.mapObjects(selectedObjects, true,
          this.viewModel.megaRelationObj);
      });
    },
    proceedWithRegularMapping(selectedObjects) {
      this.viewModel.is_saving = true;
      this.mapObjects(selectedObjects);
    },
    mapObjects(objects, megaMapping, relationsObj) {
      const viewModel = this.viewModel;
      const object = viewModel.object;
      const type = viewModel.type;
      const instance = businessModels[object].findInCacheById(
        viewModel.join_object_id
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
        useSnapshots: viewModel.useSnapshots,
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

          if (viewModel.isRefreshCountsNeeded) {
            // This Method should be modified to event
            refreshCounts();
          }

          instance.dispatch({
            ...REFRESH_MAPPED_COUNTER,
            modelType: type,
          });
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
    get_title() {
      let instance = this.parentInstance;
      return (
        (instance && instance.title) ?
          instance.title :
          this.object
      );
    },
    get_object() {
      let type = businessModels[this.type];
      if (type && type.title_plural) {
        return type.title_plural;
      }
      return 'Objects';
    },
  },
});
