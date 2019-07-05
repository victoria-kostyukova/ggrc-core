/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import loMap from 'lodash/map';
import RefreshQueue from '../../models/refresh_queue';
import {backendGdriveClient} from '../ggrc-gapi-client';
import Relationship from '../../models/service-models/relationship';

async function mapObjects(instance, objects, {
  useSnapshots = false,
  megaMapping = false,
  relationsObj = false,
} = {}) {
  let defer = [];
  let que = new RefreshQueue();

  return que.enqueue(instance).trigger().then(async (inst) => {
    let context = instance.context || null;
    objects.forEach((destination) => {
      let modelInstance;
      // Use simple Relationship Model to map Snapshot
      if (useSnapshots) {
        modelInstance = getSnapshotInstance(instance, destination, context);

        return defer.push(modelInstance.save());
      } else if (megaMapping) {
        modelInstance =
          getMegaInstance(instance, destination, context, relationsObj);

        return defer.push(modelInstance.save());
      }

      modelInstance = new Relationship({
        source: instance,
        destination,
        context,
      });
      defer.push(backendGdriveClient.withAuth(() => {
        return modelInstance.save();
      }));
    });

    return $.when(...defer);
  });
}

function getSnapshotInstance(instance, destination, context) {
  return new Relationship({
    context,
    source: instance,
    destination: {
      href: '/api/snapshots/' + destination.id,
      type: 'Snapshot',
      id: destination.id,
    },
  });
}

function getMegaInstance(instance, destination, context, relationsObj) {
  // If we map a new child to base program (relation == 'child'),
  // the source is the base program and the destination is a new child.
  // If we map a new parent to base program (relation == 'parent'),
  // the source is a new program and the destination is the base program
  const relation = relationsObj[destination.id] ||
    relationsObj.defaultValue;
  let src;
  let dest;

  if (relation === 'child') {
    src = instance;
    dest = destination;
  } else if (relation === 'parent') {
    src = destination;
    dest = instance;
  }

  return new Relationship({
    context,
    source: src,
    destination: dest,
  });
}

function unmapObjects(instance, objects) {
  const pendingUnmap = loMap(objects, (object) =>
    Relationship.findRelationship(instance, object)
      .then((relationship) => relationship.destroy())
  );

  return Promise.all(pendingUnmap);
}

export {
  mapObjects,
  unmapObjects,
};
