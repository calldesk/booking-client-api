'use strict';
/* @flow */
const ghpages = require('gh-pages');
const path = require('path');
const process = require('child_process');

const name = process.execSync('git config user.name').toString().trim();
const email = process.execSync('git config user.email').toString().trim();

console.log(`Uploading to gh-pages from ${name} (${email})`);

ghpages.publish(
  path.join(__dirname, 'doc'),
  {
    user: {
      name: name,
      email: email
    }
  },
  function (err) {
    if (err) {
      console.log(err);
      console.log('Deploy failed');
    } else {
      console.log('Deploy succeeded');
    }
  }
);
