#!/bin/bash
echo "\n--------------------------------"
echo "------> Generating .profile.d file to generate google-credentials.json at startup"

if [ -f .env  ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi
if [ -f .config  ]
then
  export $(cat .config | sed 's/#.*//g' | xargs)
fi

echo "\n--------------------------------"
printenv
echo "--------------------------------\n"

DECODED=$(echo $GOOGLE_CREDENTIALS | base64 --d)
echo $DECODED
echo $DECODED > google-credentials.json

