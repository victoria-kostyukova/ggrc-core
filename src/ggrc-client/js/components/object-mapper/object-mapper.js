/*
 Copyright (C) 2018 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../../components/advanced-search/advanced-search-filter-container';
import '../../components/advanced-search/advanced-search-filter-state';
import '../../components/advanced-search/advanced-search-mapping-container';
import '../../components/advanced-search/advanced-search-wrapper';
import '../../components/unified-mapper/mapper-results';
import '../../components/collapsible-panel/collapsible-panel';
import '../../components/mapping-controls/mapping-type-selector';

import template from './object-mapper.mustache';

import ObjectOperationsBaseVM from '../view-models/object-operations-base-vm';
import {
  isInScopeModel,
  isSnapshotModel,
  isSnapshotParent,
} from '../../plugins/utils/snapshot-utils';
import {
  refreshCounts,
  getPageInstance,
} from '../../plugins/utils/current-page-utils';
import RefreshQueue from '../../models/refresh_queue';
import {
  BEFORE_MAPPING,
  REFRESH_MAPPING,
  REFRESH_SUB_TREE,
  MAP_OBJECTS,
} from '../../events/eventTypes';
import {backendGdriveClient} from '../../plugins/ggrc-gapi-client';
import tracker from '../../tracker';
import {
  allowedToMap,
} from '../../plugins/ggrc_utils';
import Mappings from '../../models/mappers/mappings';
import Relationship from '../../models/service-models/relationship';
import * as businessModels from '../../models/business-models';
import * as mappingModels from '../../models/mapping-models';

let DEFAULT_OBJECT_MAP = {
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
  RiskAssessment: 'Program',
  TaskGroup: 'Control',
  TechnologyEnvironment: 'Product',
};

let getDefaultType = function (type, object) {
  let treeView = GGRC.tree_view.sub_tree_for[object];
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
export default can.Component.extend({
  tag: 'object-mapper',
  template,
  viewModel: function (attrs, parentViewModel) {
    const refreshCounts = parentViewModel.attr('refresh_counts') !== undefined
      ? parentViewModel.attr('refresh_counts')
      : true;

    let config = {
      general: parentViewModel.attr('general'),
      special: parentViewModel.attr('special'),
    };

    let resolvedConfig = ObjectOperationsBaseVM.extractConfig(
      config.general.type,
      config
    );

    return ObjectOperationsBaseVM.extend({
      join_object_id: resolvedConfig.isNew ? null :
        resolvedConfig['join-object-id'] ||
        (getPageInstance() && getPageInstance().id),
      object: resolvedConfig.object,
      type: getDefaultType(resolvedConfig.type, resolvedConfig.object),
      refreshCounts,
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
       * target object - they will be stored in the scope of modal-connector
       * component. This component will decide, when mapped objects should be
       * mapped to target object.
       * @property {boolean}
       */
      deferred: false,
      allowedToCreate: function () {
        // Don't allow to create new instances for "In Scope" Objects that
        // are snapshots
        let isInScopeSrc = isInScopeModel(this.attr('object'));

        return !isInScopeSrc ||
          (isInScopeSrc && !isSnapshotModel(this.attr('type')));
      },
      showAsSnapshots: function () {
        if (this.attr('freezedConfigTillSubmit.useSnapshots')) {
          return true;
        }
        return false;
      },
      showWarning: function () {
        let isInScopeSrc = isInScopeModel(this.attr('object'));
        let isSnapshotParentSrc = isSnapshotParent(this.attr('object'));
        let isSnapshotParentDst = isSnapshotParent(this.attr('type'));
        let isSnapshotModelSrc = isSnapshotModel(this.attr('object'));
        let isSnapshotModelDst = isSnapshotModel(this.attr('type'));

        let result =
          // Dont show message if source is inScope model, for example Assessment.
          !isInScopeSrc &&
          // Show message if source is snapshotParent and destination is snapshotable.
          ((isSnapshotParentSrc && isSnapshotModelDst) ||
          // Show message if destination is snapshotParent and source is snapshotable.
          (isSnapshotParentDst && isSnapshotModelSrc));

        return result;
      },
      updateFreezedConfigToLatest: function () {
        this.attr('freezedConfigTillSubmit', this.attr('currConfig'));
      },
      onSubmit: function () {
        this.updateFreezedConfigToLatest();
        // calls base version
        this._super(...arguments);
      },
    });
  },

  events: {
    [`{parentInstance} ${MAP_OBJECTS.type}`](instance, event) {
      this.mapObjects(event.objects);
    },
    '.create-control modal:success': function (el, ev, model) {
      this.map(model);
    },
    '.create-control modal:added': function (el, ev, model) {
      this.viewModel.attr('newEntries').push(model);
    },
    '.create-control click': function () {
      // reset new entries
      this.viewModel.attr('newEntries', []);
      this.element.trigger('hideModal');
    },
    '.create-control modal:dismiss'() {
      this.closeModal();
    },
    '{window} modal:dismiss': function (el, ev, options) {
      let joinObjectId = this.viewModel.attr('join_object_id');

      // mapper sets uniqueId for modal-ajax.
      // we can check using unique id which modal-ajax is closing
      if (options && options.uniqueId &&
        joinObjectId === options.uniqueId &&
        this.viewModel.attr('newEntries').length > 0) {
        this.mapObjects(this.viewModel.attr('newEntries'));
      } else {
        this.element.trigger('showModal');
      }
    },
    inserted: function () {
      let self = this;
      let deferredToList;
      this.viewModel.attr('selected').replace([]);
      this.viewModel.attr('entries').replace([]);

      if (this.viewModel.attr('deferred_to.list')) {
        deferredToList = this.viewModel.attr('deferred_to.list')
          .map(function (item) {
            return {
              id: item.id,
              type: item.type,
            };
          });
        this.viewModel.attr('deferred_list', deferredToList);
      }

      self.viewModel.attr('submitCbs').fire();
    },
    map(model) {
      const viewModel = this.viewModel;
      const newEntries = viewModel.attr('newEntries');

      viewModel.updateFreezedConfigToLatest();
      newEntries.push(model);

      if (this.viewModel.attr('deferred')) {
        // postpone map operation unless target object is saved
        this.deferredSave(newEntries);
      } else {
        // map objects immediately
        this.mapObjects(newEntries);
      }
    },
    closeModal: function () {
      this.viewModel.attr('is_saving', false);

      // TODO: Find proper way to dismiss the modal
      if (this.element) {
        this.element.find('.modal-dismiss').trigger('click');
      }
    },
    deferredSave: function (objects) {
      let source = this.viewModel.attr('deferred_to').instance ||
        this.viewModel.attr('object');
      let data = {};

      data = {
        multi_map: true,
        arr: _.compact(_.map(
          objects,
          function (desination) {
            if (allowedToMap(source, desination)) {
              desination.isNeedRefresh = true;
              return desination;
            }
          }
        )),
      };

      // Send data to modal-connector component
      this.viewModel.attr('deferred_to').controller.element.trigger(
        'defer:add', [data]);
      this.closeModal();
    },
    '.modal-footer .btn-map click': function (el, ev) {
      ev.preventDefault();
      if (el.hasClass('disabled') ||
        this.viewModel.attr('is_saving')) {
        return;
      }

      const selectedObjects = this.viewModel.attr('selected');
      // TODO: Figure out nicer / proper way to handle deferred save
      if (this.viewModel.attr('deferred')) {
        return this.deferredSave(selectedObjects);
      }
      this.viewModel.attr('is_saving', true);
      this.mapObjects(selectedObjects);
    },
    mapObjects: function (objects) {
      let type = this.viewModel.attr('type');
      let object = this.viewModel.attr('object');
      let instance = businessModels[object].findInCacheById(
        this.viewModel.attr('join_object_id'));
      let mapping;
      let Model;
      let data = {};
      let defer = [];
      let que = new RefreshQueue();
      let stopFn = tracker.start(tracker.FOCUS_AREAS.MAPPINGS(instance.type),
        tracker.USER_JOURNEY_KEYS.MAP_OBJECTS(type),
        tracker.USER_ACTIONS.MAPPING_OBJECTS(objects.length));

      instance.dispatch({
        ...BEFORE_MAPPING,
        destinationType: type,
      });

      que.enqueue(instance).trigger().done((inst) => {
        data.context = instance.context || null;
        objects.forEach((destination) => {
          let modelInstance;
          let isAllowed;
          // Use simple Relationship Model to map Snapshot
          if (this.viewModel.attr('useSnapshots')) {
            modelInstance = new Relationship({
              context: data.context,
              source: instance,
              destination: {
                href: '/api/snapshots/' + destination.id,
                type: 'Snapshot',
                id: destination.id,
              },
            });

            return defer.push(modelInstance.save());
          }

          isAllowed = allowedToMap(instance, destination);

          if (!isAllowed) {
            return;
          }
          mapping = Mappings.get_canonical_mapping(object, type);
          Model = mappingModels[mapping.model_name];
          data[mapping.object_attr] = {
            href: instance.href,
            type: instance.type,
            id: instance.id,
          };
          data[mapping.option_attr] = destination;
          modelInstance = new Model(data);
          defer.push(backendGdriveClient.withAuth(() => {
            return modelInstance.save();
          }));
        });

        $.when(...defer)
          .fail((response, message) => {
            $('body').trigger('ajax:flash', {error: message});
          })
          .always(() => {
            this.viewModel.attr('is_saving', false);
            this.closeModal();
          })
          .done(() => {
            if (instance && instance.dispatch) {
              instance.dispatch('refreshInstance');
              instance.dispatch({
                ...REFRESH_MAPPING,
                destinationType: type,
              });
            }

            stopFn();

            if (this.viewModel.attr('refreshCounts')) {
              // This Method should be modified to event
              refreshCounts();
            }

            instance.dispatch(REFRESH_SUB_TREE);
          });
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
