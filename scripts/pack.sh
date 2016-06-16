#!/bin/bash
# Pack module for production and upload to s3 with current version
# TODO Replace by Amazon CodeDeploy
# zip -r intents-prod-v0.0.7.zip intents
# BUCKET="calldesk-src"

# http://stackoverflow.com/a/246128
# current directory must be one folder down the package we want to pack
BASE=`pwd`
VERSION=`node -p -e "require('$BASE/../package.json').version"`
NAME=`node -p -e "require('$BASE/../package.json').name"`
URL=`node -p -e "require('$BASE/../package.json').repository.url"`
echo "Cloning $NAME(v$VERSION) from $URL"
git clone "$URL" "$NAME-prod"
echo "Intall deps..."
cd "$NAME-prod"
git checkout "tags/v$VERSION"
npm install --production
cd ..
echo "Packing $NAME-prod-v$VERSION.zip..."
zip -r "$NAME-prod-v$VERSION.zip" "$NAME-prod" -x "$@"
mv "$NAME-prod-v$VERSION.zip" .
rm -rf "$NAME-prod"
