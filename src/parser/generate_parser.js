#!/usr/bin/env node
/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

/*
Script used to generate ggrc-filter-query-parser.js

-- updating dev environment by running:

  vagrant provision

-- manual dev env setup:

to run this script you need node.js and peg.js
  sudo apt-get install nodejs npm
  npm install pegjs
  npm install mkdirp

if npm install returns a 404 just run the next command and try again.
  npm config set registry http://registry.npmjs.org/


then edit the parser.pegjs file and run the generator
  ./generate_parser.js
*/


let parserSrc;
let ggrcParser;
let parserGrammar = '/vagrant/src/parser/parser.pegjs';
let parserTemplateFile = '/vagrant/src/parser/parser_template.js';
let ggrcParserFolder = '/vagrant/src/ggrc-client/js/generated/';
let ggrcParserJsFile = 'ggrc-filter-query-parser.js';
let peg = require('pegjs');
let fs = require('fs');
let mkdirp = require('mkdirp');
let parserString = fs.readFileSync(parserGrammar, 'utf8');
let filterTemplate = fs.readFileSync(parserTemplateFile, 'utf8');

console.log('building parser'); // eslint-disable-line no-console
parserSrc = peg.generate(parserString, {output: 'source'});

console.log('saving parser to js files'); // eslint-disable-line no-console
ggrcParser = filterTemplate.replace('"GENERATED_PLACEHOLDER"', parserSrc);

mkdirp.sync(ggrcParserFolder);
fs.writeFileSync(ggrcParserFolder + ggrcParserJsFile, ggrcParser);

console.log('\ndone :)'); // eslint-disable-line no-console
