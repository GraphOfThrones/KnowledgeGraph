const underscored = require('underscore.string/underscored')
const fs = require('fs')
const request = require('request')
const sparqlTransformer = require('sparql-transformer')

const query = {
  "proto": [{
    "id" : "?id"
    // "name": "$rdfs:label$required",
    // "image": "$foaf:depiction$required"
  }],
  "$where": [
    "?s ?p ?o"
  ],
  "$limit": 100
}

const options = {
  endpoint: 'http://localhost:8889/bigdata/namespace/got3/sparql'
}

sparqlTransformer(query, options)
.then(res => console.log(res))
.catch(err => console.error(err));