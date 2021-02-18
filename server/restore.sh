#!/bin/bash
DB_NAME=$1
mongorestore --drop -d $DB_NAME ./data/$DB_NAME
