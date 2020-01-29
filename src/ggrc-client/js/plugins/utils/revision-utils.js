/*
 Copyright (C) 2020 Google Inc., authors, and contributors
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
  * Sets actual global custom attributes from object's instance
  * to content of proposal or revision
  * @param {canMap} content - content of revision or proposal
  * @param {canMap} instance - object's instance
  *
  * @return {canMap} modified content
  */
export const setActualGCAs = (content, instance) => {
  const instanceCADs = instance.custom_attribute_definitions.attr();
  const instanceCAVs = instance.custom_attribute_values.attr();
  const instanceCADsIds = instanceCADs.map((item) => item.id);
  const contentCADs = content.custom_attribute_definitions.attr();
  const contentCAVs = content.custom_attribute_values.attr();
  const contentCADsIds = contentCADs.map((item) => item.id);

  const missedCADsIds = instanceCADs.reduce((array, item, index) => {
    if (!contentCADsIds.includes(item.id)) {
      array.push(index);
    }
    return array;
  }, []);

  const extraCADsIds = contentCADs.reduce((array, item, index) => {
    if (!instanceCADsIds.includes(item.id)) {
      array.push(index);
    }
    return array;
  }, []);
  if (!missedCADsIds.length && !extraCADsIds.length) {
    return content;
  }

  extraCADsIds.forEach((index) => {
    contentCADs[index] = null;
    contentCAVs[index] = null;
  });

  missedCADsIds.forEach((index) => {
    contentCADs.push(instanceCADs[index]);
    contentCAVs.push(instanceCAVs[index]);
  });

  content.attr('custom_attribute_definitions')
    .replace(contentCADs.filter((item) => item));
  content.attr('custom_attribute_values')
    .replace(contentCAVs.filter((item) => item));

  return content;
};
