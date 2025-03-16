#!/bin/bash

echo "==================================="
echo "Vega TV APK Generation Script"
echo "==================================="

echo "Cleaning project..."
./gradlew clean

echo "Building all release APKs..."
./gradlew generateAllApks

echo "Building App Bundle for Play Store..."
./gradlew generateAppBundle

echo "APK files generated in:"
echo "app-tv/build/outputs/apk/"

echo "App Bundle generated in:"
echo "app-tv/build/outputs/bundle/"

echo "==================================="
echo "Build process completed!"
echo "===================================" 