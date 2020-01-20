/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const fs = require('fs');

function getReleaseNotesDate(path) {
  const md = fs.readFileSync(path, 'utf-8');
  const updated = /\[\/\/\]: <> \(updated (.*)\)/gi.exec(md)[1];

  return new Date(updated);
}

module.exports = getReleaseNotesDate;
