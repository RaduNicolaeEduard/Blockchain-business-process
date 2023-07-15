#!/bin/sh


ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD='1030mitahollow'
ELASTICSEARCH_HOST=http://localhost:9200
set -e
alias curles="curl -k -i -u $ELASTICSEARCH_USERNAME:$ELASTICSEARCH_PASSWORD"

#  Wait for ES to be ready
until curles $ELASTICSEARCH_HOST; do
  >&2 echo "Elasticsearch is unavailable - sleeping"
  sleep 1
done

# Create index

for file in ../artifacts/mappings/*.json; do
echo $file
  if [ -f "$file" ]; then
    echo "Found mapping file $file"
    mapping=$(cat $file)
    # index=$(basename $file .json)`
    echo "Initializing index $index"
    # Create the index with the mapping
    curl -k -i -u ${ES_USER}:${ES_PASSWORD} -XPUT -H 'Content-Type: application/json' "$ES_ENDPOINT/$index" -d "$mapping" 
  fi
  # Get the index name from the filename
done
exec "$@"