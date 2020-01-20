/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

export default class PersistentNotifier {
  constructor(options) {
    this.dfds = [];
    this.onEmptyCallbacksList = [];

    Object.assign(this, options);
  }

  whileQueueHasElements() {}

  whenQueueEmpties() {}

  queue(dfd) {
    if (!dfd || !dfd.always) {
      throw new Error('Attempted to queue something other than a Deferred');
    }

    if (!this.dfds.includes(dfd)) {
      this.dfds.push(dfd);
      dfd.always(this._whenDeferredResolved.bind(this, dfd));
    }

    let pendingCallbacks = this.onEmptyCallbacksList.length;
    if (pendingCallbacks === 0 && this.dfds.length > 0) {
      this.whileQueueHasElements();
    }
  }

  _whenDeferredResolved(dfd) {
    let dfdIndex = this.dfds.indexOf(dfd);
    if (dfdIndex > -1) {
      this.dfds.splice(dfdIndex, 1);
    }

    if (this.dfds.length === 0) {
      this.whenQueueEmpties();
      this.onEmptyCallbacksList.forEach((fn) => fn());
      this.onEmptyCallbacksList = [];
    }
  }

  onEmpty(fn) {
    if (this.dfds.length === 0) {
      fn();
    }
    if (this.dfds.length > 0 && !this.onEmptyCallbacksList.includes(fn)) {
      this.onEmptyCallbacksList.push(fn);
    }
  }
}
