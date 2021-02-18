#!/bin/bash
DB_NAME=$1
mongodump -d $DB_NAME -o ./data
