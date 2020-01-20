/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import {notifier} from '../../plugins/utils/notifiers-utils';

export const connectionLostNotifier = () => {
  const message = `Internet connection was lost. You may close this page or
  continue your work. We will send you an email notification when it completes
  or if there are errors or warnings.`;

  notifier('error', message);
};
