/*
  Copyright (C) 2020 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loFind from 'lodash/find';
import canList from 'can-list';
import canMap from 'can-map';
import {isAllowedFor} from '../../permission';
import {hasRelatedAssessments} from './models-utils';
import Person from '../../models/business-models/person';
import Audit from '../../models/business-models/audit';
import Stub from '../../models/stub';
import tracker from '../../tracker';
import * as businessModels from '../../models/business-models';
import {ggrcGet} from '../ajax-extensions';

/**
 * Util methods for work with Snapshots.
 */

const auditScopeModels = ['Assessment', 'AssessmentTemplate'];

/**
 * Check whether object is snapshot
 * @param {Object} instance - Object instance
 * @return {Boolean} True or False
 */
function isSnapshot(instance) {
  return instance && (instance.snapshot || instance.isRevision);
}

/**
 * Check whether provided model name is snapshot parent
 * @param {String} parent - Model name
 * @return {Boolean} True or False
 */
function isSnapshotParent(parent) {
  return GGRC.config.snapshotable_parents.indexOf(parent) > -1;
}

/**
 * Check whether provided model name should be snapshot or default one
 * @param {String} modelName - model to check
 * @return {Boolean} True or False
 */
function isSnapshotModel(modelName) {
  return GGRC.config.snapshotable_objects.indexOf(modelName) > -1;
}

/**
 * Check if the relationship is of type snapshot.
 * @param {String} parent - Parent of the related objects
 * @param {String} child - Child of the related objects
 * @return {Boolean} True or False
 */
function isSnapshotRelated(parent, child) {
  return isSnapshotParent(parent) && isSnapshotModel(child) ||
    isAuditScopeModel(parent) && isSnapshotModel(child);
}

/**
 * Check if object type related to snapshots.
 * @param {String} type - Type of object
 * @return {Boolean} True or False
 */
function isSnapshotRelatedType(type) {
  return GGRC.config.snapshot_related.indexOf(type) > -1;
}

function isAuditScopeModel(model) {
  return auditScopeModels.indexOf(model) > -1;
}

/**
 * Convert snapshot to object
 * @param {Object} instance - Snapshot instance
 * @return {Object} The object
 */
function toObject(instance) {
  let content = instance.revision.content.attr
    ? instance.revision.content.attr()
    : instance.revision.content;

  content.originalLink = getParentUrl(instance);
  content.snapshot = new canMap(instance);
  content.related_sources = [];
  content.related_destinations = [];
  content.viewLink = content.snapshot.viewLink;
  content.selfLink = content.snapshot.selfLink;
  content.type = instance.child_type;
  content.id = instance.id;
  content.originalObjectDeleted = instance.original_object_deleted;
  content.canRead = isAllowedFor('read', {
    type: instance.child_type,
    id: instance.child_id,
  });
  content.updated_at = instance.updated_at;
  content.canGetLatestRevision =
    !instance.is_latest_revision && !instance.is_identical_revision &&
    isAllowedFor('update', {
      type: instance.child_type,
      id: instance.child_id}) &&
    !instance.original_object_deleted &&
    !instance.archived;

  if (content.access_control_list) {
    content.access_control_list.forEach(function (item) {
      item.person = new Stub(new Person({id: item.person_id}));
    });
  }

  if (hasRelatedAssessments(instance.child_type)) {
    content.last_assessment_date = instance.last_assessment_date;
  }

  let model = businessModels[instance.child_type];
  let object = new model(content);
  object.attr('originalLink', content.originalLink);
  // Update archived flag in content when audit is archived:
  if (instance.parent &&
    Audit.findInCacheById(instance.parent.id)) {
    let audit = Audit.findInCacheById(instance.parent.id);
    audit.bind('change', function () {
      let field = arguments[1];
      let newValue = arguments[3];
      if (field !== 'archived' || !object.snapshot) {
        return;
      }
      object.snapshot.attr('archived', newValue);
    });
  }
  model.removeFromCacheById(content.id); /* removes snapshot object from cache */

  return object;
}

/**
 * Build url for snapshot's parent
 * @param {Object} instance - Snapshot instance
 * @return {String} Url
 */
function getParentUrl(instance) {
  let model = businessModels[instance.child_type];
  let plural = model.table_plural;
  let link = '/' + plural + '/' + instance.child_id;

  return link;
}

/**
 * Convert array of snapshots to array of object
 * @param {Object} values - array of snapshots
 * @return {Object} The array of objects
 */
function toObjects(values) {
  return new canList(values.map(toObject));
}

/**
 * Transform query for objects into query for snapshots of the same type
 * @param {Object} query - original query
 * @return {Object} The transformed query
 */
function transformQueryToSnapshot(query) {
  let type = query.object_name;
  let expression = query.filters.expression;
  query.object_name = 'Snapshot';
  query.filters.expression = {
    left: {
      left: 'child_type',
      op: {name: '='},
      right: type,
    },
    op: {name: 'AND'},
    right: expression,
  };
  return query;
}

/**
 * Check whether object type is snapshot
 * @param {Object} instance - Object instance
 * @return {Boolean} True or False
 */
function isSnapshotType(instance) {
  return instance && instance.type === 'Snapshot';
}

/**
 * get snapshot counts
 * @param {Array} widgets - available widgets names
 * @param {Object} instance - Object instance
 * @return {Promise} Promise
 */
function getSnapshotsCounts(widgets, instance) {
  let url = `${instance.selfLink}/snapshot_counts`;

  let widgetsObject = widgets.filter((widget) => {
    return isSnapshotRelated(instance.attr('type'), widget.name) ||
      widget.isObjectVersion;
  });

  // return empty object as no widgets to update count
  if (!widgetsObject.length) {
    return $.Deferred().resolve({});
  }

  const stopFn = tracker.start(
    tracker.FOCUS_AREAS.COUNTS,
    tracker.USER_JOURNEY_KEYS.API,
    tracker.USER_ACTIONS[instance.type.toUpperCase()].SNAPSHOTS_COUNT);

  return ggrcGet(url)
    .then((counts) => {
      stopFn();
      let countsMap = {};
      Object.keys(counts).forEach((name) => {
        let widget = loFind(widgetsObject, (widgetObj) => {
          return widgetObj.name === name;
        });

        if (widget) {
          let countsName = widget.countsName || widget.name;
          countsMap[countsName] = counts[name];
        }
      });

      return countsMap;
    })
    .fail(() => {
      stopFn(true);
    });
}

/**
 * Extend object properties from snapshot properties
 * @param {canMap | Object} object - Extendable object
 * @param {canMap} snapshot - Snapshot object
 * @return {canMap} Extended object
 */
function extendSnapshot(object, snapshot) {
  const extendedObject = object instanceof canMap ? object : new canMap(object);

  extendedObject.attr('title', snapshot.title);
  extendedObject.attr('description', snapshot.description);
  extendedObject.attr('viewLink', snapshot.originalLink);

  // replace extended object constructor with snapshot constructor
  // to save static properties from it
  extendedObject.constructor = snapshot.constructor;

  return extendedObject;
}

export {
  isSnapshot,
  isSnapshotParent,
  isSnapshotRelated,
  isSnapshotRelatedType,
  isSnapshotModel,
  isAuditScopeModel,
  toObject,
  toObjects,
  transformQueryToSnapshot,
  isSnapshotType,
  getParentUrl,
  getSnapshotsCounts,
  extendSnapshot,
};
