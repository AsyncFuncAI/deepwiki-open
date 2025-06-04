#!/bin/bash

# variables
IMAGE_TAG_BASE=europe-west2-docker.pkg.dev/dsa-playground-ai/deepwiki/deepwiki-test

env=DEV
# gcloud container clusters get-credentials f-da-dev-datatools-gke --region europe-west2 --project f-da-dev-datatools


echo
echo ">> $env <<"
echo

# checking if everything is committed
git status

BUILD_GIT_HASH=$(git rev-parse --short HEAD)

echo "Do you want to build with this commit? $BUILD_GIT_HASH"

if [ "$3" != "--no-build" ]; then
    # building
    IMAGE_TAG="$IMAGE_TAG_BASE:latest"
    docker build . --no-cache -t $IMAGE_TAG --platform=linux/amd64 -f Dockerfile-appengine

    # publishing
    docker push $IMAGE_TAG

    # removing the image
    docker rmi $IMAGE_TAG
fi