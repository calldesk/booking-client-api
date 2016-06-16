#!/bin/bash
# Pack module for production and upload to s3 with current version

# To test manually
# babel -d softphone/lib/ softphone/src/ && rm softphone.zip && zip -r softphone.zip softphone

# http://stackoverflow.com/a/246128
SCRIPT_PATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CURRENT_PATH=`pwd`
NAME=`node -p -e "require('$SCRIPT_PATH/../package.json').name"`
cd $SCRIPT_PATH
./packS3.sh "$NAME-prod/src/*" "$NAME-prod/test/*" "$NAME-prod/scripts/*" "$NAME-prod/doc/*" "$NAME-prod/.*"
cd $CURRENT_PATH
