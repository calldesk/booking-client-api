#!/bin/sh

npm run doc
git clone -b gh-pages https://github.com/calldesk/booking-client-api.git
cd booking-client-api
rm -R *
cp -R ../doc/* .
git commit -a -m "Auto publish"
git push origin gh-pages
cd ..
rm -Rf booking-client-api
