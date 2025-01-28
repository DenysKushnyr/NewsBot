#!/bin/bash
npm i

tsc && echo "Compiled successfully"

node --env-file .env build/main.js &