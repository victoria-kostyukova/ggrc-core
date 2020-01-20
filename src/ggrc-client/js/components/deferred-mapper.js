/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loUniq from 'lodash/uniq';
import loFindIndex from 'lodash/findIndex';
import loFilter from 'lodash/filter';
import canMap from 'can-map';
import canComponent from 'can-component';
import * as MapperUtils from '../plugins/utils/mapper-utils';
import {
  REFRESH_MAPPING,
  REFRESH_SUB_TREE,
  DEFERRED_MAP_OBJECTS,
  DEFERRED_MAPPED_UNMAPPED,
  UNMAP_DESTROYED_OBJECT,
} from '../events/event-types';
import {getPageInstance} from '../plugins/utils/current-page-utils';

export default canComponent.extend({
  tag: 'deferred-mapper',
  leakScope: true,
  viewModel: canMap.extend({
    define: {
      instance: {
        set(instance) {
          // _pendingJoins is set to instance only to check
          // whether instance is dirty on modals
          if (instance) {
            instance.attr('_pendingJoins', []);
          }
          return instance;
        },
      },
      // objects which should be mapped to new instance
      preMappedObjects: {
        value: [],
        set(objects) {
          if (objects.length) {
            this.addMappings(objects);
          }

          return objects;
        },
      },
    },
    useSnapshots: false,
    instance: null,
    performMapActions(instance, objects) {
      let pendingMap = Promise.resolve();

      if (objects.length > 0) {
        pendingMap = MapperUtils.mapObjects(instance, objects, {
          useSnapshots: this.attr('useSnapshots'),
        });
      }

      return pendingMap;
    },
    performUnmapActions(instance, objects) {
      let pendingUnmap = Promise.resolve();

      if (objects.length > 0) {
        pendingUnmap = MapperUtils.unmapObjects(instance, objects);
      }

      return pendingUnmap;
    },
    afterDeferredUpdate(objectsToMap, objectsToUnmap) {
      const objects = objectsToMap.concat(objectsToUnmap);
      const instance = this.attr('instance');
      const objectTypes = loUniq(objects
        .map((object) => object.type)
      );

      instance.dispatch({
        ...DEFERRED_MAPPED_UNMAPPED,
        mapped: objectsToMap,
        unmapped: objectsToUnmap,
      });

      objectTypes.forEach((objectType) => {
        instance.dispatch({
          ...REFRESH_MAPPING,
          destinationType: objectType,
        });
      });
      instance.dispatch(REFRESH_SUB_TREE);

      const pageInstance = getPageInstance();
      const pageInstanceIndex = loFindIndex(objects, ({id, type}) =>
        id === pageInstance.id &&
        type === pageInstance.type
      );

      if (pageInstanceIndex !== -1) {
        pageInstance.dispatch({
          ...REFRESH_MAPPING,
          destinationType: instance.type,
        });
      }
    },
    async deferredUpdate() {
      const instance = this.attr('instance');
      const pendingJoins = instance.attr('_pendingJoins');

      // If there are no objects for mapping/unmapping
      if (!pendingJoins.length) {
        return;
      }

      const objectsToMap =
        loFilter(pendingJoins, ({how}) => how === 'map')
          .map(({what}) => what);
      const objectsToUnmap =
        loFilter(pendingJoins, ({how}) => how === 'unmap')
          .map(({what}) => what);

      await Promise.all([
        this.performMapActions(instance, objectsToMap),
        this.performUnmapActions(instance, objectsToUnmap),
      ]);

      instance.attr('_pendingJoins', []);

      this.afterDeferredUpdate(objectsToMap, objectsToUnmap);
    },
    _indexOfPendingJoin(object, action) {
      return loFindIndex(this.attr('instance._pendingJoins'),
        ({what, how}) =>
          what.id === object.id &&
          what.type === object.type &&
          how === action
      );
    },
    addMappings(objects) {
      const pendingJoins = this.attr('instance._pendingJoins');

      objects.forEach((obj) => {
        const indexOfUnmap = this._indexOfPendingJoin(obj, 'unmap');

        if (indexOfUnmap !== -1) {
          pendingJoins.splice(indexOfUnmap, 1);
        } else {
          pendingJoins.push({
            what: obj,
            how: 'map',
          });
        }
      });
    },
    removeMappings(obj) {
      const pendingJoins = this.attr('instance._pendingJoins');
      const indexOfMap = this._indexOfPendingJoin(obj, 'map');

      if (indexOfMap !== -1) {
        pendingJoins.splice(indexOfMap, 1);
      } else {
        pendingJoins.push({
          what: obj,
          how: 'unmap',
        });
      }

      this.dispatch({
        type: 'removeMappings',
        object: obj,
      });
    },
  }),
  events: {
    '{instance} updated'() {
      this.viewModel.deferredUpdate();
    },
    [`{instance} ${UNMAP_DESTROYED_OBJECT.type}`](event, {object}) {
      if (object) {
        this.viewModel.removeMappings(object);
      }
    },
    '{instance} created'() {
      this.viewModel.deferredUpdate();
    },
    [`{instance} ${DEFERRED_MAP_OBJECTS.type}`](el, {objects}) {
      this.viewModel.addMappings(objects);
      this.viewModel.dispatch({
        type: 'addMappings',
        objects,
      });
    },
    removed() {
      const instance = this.viewModel.attr('instance');

      if (instance) {
        instance.removeAttr('_pendingJoins');
      }
    },
  },
});
