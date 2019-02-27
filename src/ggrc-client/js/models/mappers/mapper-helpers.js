/*
    Copyright (C) 2019 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

function Direct(
  optionModelName, instanceJoinAttr, remoteJoinAttr) {
  return new GGRC.ListLoaders.DirectListLoader(
    optionModelName, instanceJoinAttr, remoteJoinAttr);
}

function Search(queryFunction, observeTypes) {
  return new GGRC.ListLoaders.SearchListLoader(queryFunction, observeTypes);
}

export {
  Direct,
  Search,
};

