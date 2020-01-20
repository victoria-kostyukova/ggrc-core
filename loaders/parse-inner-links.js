/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

module.exports = function(html) {
  let headerRegexp = /<h2>(.*)<\/h2>/g;
  let headerMatches = [];
  let result;

  // find all links
  while ((result = headerRegexp.exec(html)) !== null) {
    headerMatches.push(result);
  }

  headerMatches.forEach((match, index) => {
    let hash = (Date.now() * Math.random()).toFixed();
    let innerText = match[1];
    let anchorStr = `<h3>${innerText}<\/h3>`;
    let headerStr = `<h2>${innerText}<\/h2>`;

    if (html.indexOf(anchorStr) > -1) {
      // set hash as id for anchor header
      html = html.replace(anchorStr,
        `<h3 id="${hash}">${innerText}<\/h3>`);

      // replace h2 header by link with hash
      html = html.replace(headerStr,
        `<p><a href="#${hash}">${innerText}<\/a></p>`);
    }
  });

  return html;
}
