/*
 Copyright (C) 2020 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import {filteredMap} from '../plugins/ggrc-utils';
import loForEach from 'lodash/forEach';
import canModel from 'can-model';
import {reify} from '../plugins/utils/reify-utils';
import allModels from './all-models';

class ModelRefreshQueue {
  constructor(model) {
    this.model = model;
    this.ids = [];
    this.deferred = new $.Deferred();
    this.triggered = false;
    this.completed = false;
    this.updated_at = Date.now();
  }

  enqueue(id) {
    if (this.triggered) {
      return null;
    }
    if (this.ids.indexOf(id) === -1) {
      this.ids.push(id);
      this.updated_at = Date.now();
    }
    return this;
  }

  trigger() {
    if (!this.triggered) {
      this.triggered = true;
      if (this.ids.length && this.model) {
        this.model.findAll({id__in: this.ids.join(',')}).then(() => {
          this.completed = true;
          this.deferred.resolve();
        }, () => {
          this.deferred.reject(...arguments);
        });
      } else {
        this.completed = true;
        this.deferred.resolve();
      }
    }
    return this.deferred;
  }

  triggerWithDebounce(delay, manager) {
    let msToWait = (delay || 0) + this.updated_at - Date.now();

    if (!this.triggered) {
      if (msToWait < 0 &&
        (!manager || manager.triggeredQueues().length < 6)) {
        this.trigger();
      } else {
        setTimeout(
          () => this.triggerWithDebounce(delay, manager), msToWait);
      }
    }

    return this.deferred;
  }
}

class RefreshQueueManager {
  constructor() {
    this.queues = [];
  }

  triggeredQueues() {
    return filteredMap(this.queues, (queue) => {
      if (queue.triggered) {
        return queue;
      }
    });
  }

  enqueue(obj, force) {
    let model = obj.constructor;
    let modelName = model.model_singular;
    let foundQueue = null;
    let id = obj.id;

    if (!obj.selfLink) {
      if (obj instanceof canModel) {
        modelName = obj.constructor.model_singular;
      } else if (obj.type) {
        // FIXME: obj.kind is to catch invalid stubs coming from Directives
        modelName = obj.type || obj.kind;
      }
    }
    model = allModels[modelName];

    if (!force) {
      // Check if the ID is already contained in another queue
      this.queues.forEach((queue) => {
        if (!foundQueue &&
          queue.model === model && queue.ids.indexOf(id) > -1) {
          foundQueue = queue;
        }
      });
    }

    if (!foundQueue) {
      this.queues.forEach((queue) => {
        if (!foundQueue &&
          queue.model === model &&
          !queue.triggered && queue.ids.length < 150) {
          foundQueue = queue.enqueue(id);
          return false;
        }
      });
      if (!foundQueue) {
        foundQueue = new ModelRefreshQueue(model);
        this.queues.push(foundQueue);
        foundQueue.enqueue(id);
        foundQueue.deferred.done(() => {
          let index = this.queues.indexOf(foundQueue);
          if (index > -1) {
            this.queues.splice(index, 1);
          }
        });
      }
    }

    return foundQueue;
  }
}

const refreshQueueManager = new RefreshQueueManager();

/*  RefreshQueue
 *
 *  enqueue(objs, force=false) -> queue or null
 *  trigger() -> Deferred
 */
class RefreshQueue {
  constructor() {
    this.objects = [];
    this.queues = [];
    this.deferred = new $.Deferred();
    this.triggered = false;
    this.completed = false;
  }

  enqueue(objs, force) {
    let queue;
    if (!objs) {
      return;
    }
    if (this.triggered) {
      return null;
    }
    if (objs.push) {
      loForEach(objs, (obj) => {
        this.enqueue(obj, force);
      });
      return this;
    }

    this.objects.push(objs);
    if (force || !objs.selfLink) {
      queue = refreshQueueManager.enqueue(objs, force);
      if (this.queues.indexOf(queue) === -1) {
        this.queues.push(queue);
      }
    }
    return this;
  }

  trigger(delay) {
    let deferreds = [];

    if (!delay) {
      delay = 150;
    }

    this.triggered = true;
    this.queues.forEach((queue) => {
      deferreds.push(
        queue.triggerWithDebounce(delay, refreshQueueManager));
    });

    if (deferreds.length) {
      $.when(...deferreds).then(() => {
        this.deferred.resolve(filteredMap(this.objects, (obj) => reify(obj)));
      }, () => {
        this.deferred.reject(...arguments);
      });
    } else {
      return this.deferred.resolve(this.objects);
    }

    return this.deferred;
  }
}

function refreshAll(instance, props, force) {
  let dfd = new $.Deferred();

  refreshAllProperties(instance, props, dfd);
  return dfd;

  // Helper function called recursively for each property
  function refreshAllProperties(instance, props, dfd) {
    let prop = props[0];
    let nextProps = props.slice(1);
    let next = instance[prop];
    let refreshQueue = new RefreshQueue();
    let dfds = [];
    let deferred;

    if (next) {
      refreshQueue.enqueue(next, force);
      deferred = refreshQueue.trigger();
    }

    if (deferred) {
      deferred.then((refreshedItems) => {
        if (nextProps.length) {
          loForEach(refreshedItems, function (item) {
            let df = new $.Deferred();
            refreshAllProperties(item, nextProps, df);
            dfds.push(df);
          });
          // Resolve the original deferred only when all list deferreds
          //   have been resolved
          $.when(...dfds).then((items) => {
            dfd.resolve(items);
          }, () => {
            dfd.reject(...arguments);
          });
          return;
        }
        // All items were refreshed, resolve the deferred
        if (next.push || next.list) {
          // Last refreshed property was a list
          dfd.resolve(refreshedItems);
        }
        // Last refreshed property was a single instance, return it as such
        dfd.resolve(refreshedItems[0]);
      }, () => {
        dfd.reject(...arguments);
      });
    } else {
      console.warn('refreshAll failed at', prop);
    }
  }
}

export default RefreshQueue;
export {
  refreshAll,
};
