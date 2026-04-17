#!/bin/sh
exec gunicorn -k uvicorn.workers.UvicornWorker -w 1 main:app --preload --bind 0.0.0.0:8000 