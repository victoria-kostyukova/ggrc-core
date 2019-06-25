/*
 Copyright (C) 2019 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import loForEach from 'lodash/forEach';
/**
 * The util allows to perform batch of actions with some delay in a single transaction.
 * @param {function} completeTransaction - The function that allows to submit result of transaction.
 * @param {number} timeout - The execution delay in milliseconds.
 */
export default function (completeTransaction, timeout) {
  let deferredQueue = [];
  let timeoutId = null;

  let sequence = {
    transactionDfd: $.Deferred().resolve(),
    callbackAdded: false,
  };

  function runBatch(batch) {
    loForEach(batch, function (actionItem) {
      actionItem.action();
    });
  }

  function resolveBatch(batch, batchDfd, ...result) {
    loForEach(batch, function (actionItem) {
      actionItem.deferred.resolve(...result);
    });
    batchDfd.resolve();
  }

  function rejectBatch(batch, batchDfd, ...result) {
    loForEach(batch, function (actionItem) {
      actionItem.deferred.reject(...result);
    });
    batchDfd.resolve();
  }

  function processQueue() {
    let batchDfd = $.Deferred();
    let currentBatch = deferredQueue.splice(0, deferredQueue.length);

    runBatch(currentBatch);
    completeTransaction(
      resolveBatch.bind(this, currentBatch, batchDfd),
      rejectBatch.bind(this, currentBatch, batchDfd));

    return batchDfd.promise();
  }

  function runSequence(timeout) {
    if (sequence.transactionDfd.state() !== 'pending') {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(processSequentially, timeout);
    } else {
      addSequenceCallback();
    }
  }

  function processSequentially() {
    sequence.transactionDfd = $.Deferred();
    sequence.callbackAdded = false;
    processQueue().then(sequence.transactionDfd.resolve);
  }

  function addSequenceCallback() {
    if (!sequence.callbackAdded) {
      sequence.transactionDfd.then(processSequentially);
      sequence.callbackAdded = true;
    }
  }

  /**
   * Adds new action to execution queue.
   * @param {function} action - The action that should be executed.
   * @return {object} - The canJS promise indicates result of the transaction.
   */
  this.push = function (action) {
    let dfd = $.Deferred();
    deferredQueue.push({
      deferred: dfd,
      action: action,
    });

    runSequence(timeout);

    return dfd.promise();
  };

  /**
   * Adds new action to execution queue and execute all queue without delay.
   * @param {function} action - The action that should be executed.
   * @return {object} - The canJS promise indicates result of the transaction.
   */
  this.execute = function (action) {
    let dfd = $.Deferred();
    deferredQueue.push({
      deferred: dfd,
      action: action,
    });

    runSequence(0);

    return dfd.promise();
  };

  /**
  * Returns actions state of deferredQueue
  * @return {boolean} - deferredQueue has pending actions.
  */
  this.isPending = () => !!deferredQueue.length;
}
