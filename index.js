const underscored = require('underscore.string/underscored')
const fs = require('fs')
const request = require('request')
const jsonld = require('jsonld');
let characters = require('./data/characters')
let houses = require('./data/houses')

// // // //

const graph = []

// {
//   "@context": "http://schema.org",
//   "@graph": [{
//     "@type": "City",
//     "@id" : "http://dbpedia.org/resource/Bologna",
//     "name": [
//        {"@value":"Bologna","@language":"it"},
//        {"@value":"Bologne","@language":"fr"}
//      ],
//     "image": "http://commons.wikimedia.org/wiki/Special:FilePath/Bologna_postcard.jpg"
//   }, {
//     "@type": "City",
//     "@id" : "http://dbpedia.org/resource/Siena",
//     "name": { "@value":"Siena", "@language":"en" },
//     "image": "http://commons.wikimedia.org/wiki/Special:FilePath/PiazzadelCampoSiena.jpg"
//   }]
// }

const prefix = 'got:'

characters = characters.map((c) => {

  // Defines the character's label
  const label = c['Name'] || c['Aliases'][0]
  const identifier = underscored(label)
  // const characterId = 'http://asoiaf.org/character/' + c['Id'] + '/' + identifier

  c.id = c['Id']
  c.label = label
  c.identifier = identifier
  c.born = c['Born']
  c.died = c['Died']
  c['@id'] = 'http://asoiaf.org/character/' + c.id + '/' + c.identifier
  return c
})

houses = houses.map((h) => {

  // Defines the character's label
  const label = h['Name']
  const identifier = underscored(label)

  h.id = h['Id']
  h.label = label
  h.identifier = identifier
  h['@id'] = 'http://asoiaf.org/house/' + h.id + '/' + h.identifier
  h.region = h['Region']
  h.coa = h['CoatOfArms']
  h.words = h['Words']

  if (h['CurrentLord']) {
    h.currentLord = characters.find(e => e.id === h['CurrentLord'])['@id']
  }

  if (h['Founder']) {
    h.founder = characters.find(e => e.id === h['Founder'])['@id']
  }

  if (h['Heir']) {
    h.heir = characters.find(e => e.id === h['Heir'])['@id']
  }

  if (h['Overlord']) {
    h.overlord = characters.find(e => e.id === h['Overlord'])['@id']
  }

  // {
  //   "Id":1,
  //   "Name":"House Algood",
  //   "Seats":[],
  //   "Region":"The Westerlands",
  //   "CoatOfArms":"A golden wreath, on a blue field with a gold border(Azure, a garland of laurel within a bordure or)",
  //   "Words":"",
  //   "Titles":[],
  //   "CurrentLord":null,
  //   "Founder":null,
  //   "Founded":"",
  //   "Heir":null,
  //   "Overlord":229,
  //   "DiedOut":"",
  //   "AncestralWeapons":[],
  //   "CadetBranches":[]
  // }

  return h
})

houses = houses.map((h) => {

  if (h['CadetBranches']) {
    h.cadetBranches = h['CadetBranches'].map((cadet) => {
      return houses.find(e => e.id === cadet)['@id']
    })
    // h.currentLord = characters.find(e => e.id === h['CurrentLord'])['@id']
  }
  // {
  //   "CadetBranches":[]
  // }

  return h
})

characters = characters.map((c) => {

  c.parent = []
  c.child = []

  c.child = c['Children'].map((a) => {
    // return characters.find(e => a === e.id)['@id']
    return { '@id': characters.find(e => a === e.id)['@id'] }
  })

  c.allegiances = c['Allegiances'].map((a) => {
    // return characters.find(e => a === e.id)['@id']
    return { '@id': houses.find(e => a === e.id)['@id'] }
  })

  if (c['Father']) {
    c.parent.push({ '@id': characters.find(e => c['Father'] === e.id)['@id'] })
  }

  if (c['Mother']) {
    c.parent.push({ '@id': characters.find(e => c['Mother'] === e.id)['@id'] })
    // c.mother = characters.find(e => c['Mother'] === e.id)['@id']
  }

  if (c['Spouse']) {
    c.spouse = characters.find(e => c['Spouse'] === e.id)['@id']
  }

  c.nickname = c['Aliases']
  c.honorificPrefix = c['Titles']

  if (c.IsFemale) {
    c.gender = { '@type': 'foaf:gender', '@id': 'http://schema.org/Female' }
  } else {
    c.gender =  { '@type': 'foaf:gender', '@id': 'http://schema.org/Male' }
  }

  delete c.Aliases
  delete c.Titles
  delete c.Father
  delete c.Mother
  delete c.Spouse
  delete c.Name

  return c
})

characters.forEach((c) => {
  // c['rdfs:label'] = c.label
  c['name'] = c.label
  c['@type'] = 'foaf:Person'
  c["@context"] = "https://tetherless-world.github.io/angular-json-ld-editor/person.jsonld"
  delete c.id
  delete c.Id
  delete c.TvSeries
  delete c.Children
  delete c.PovBooks
  delete c.Allegiances
  delete c.IsFemale
  delete c.Culture
  delete c.Titles
  delete c.Born
  delete c.born
  delete c.Died
  delete c.died
  delete c.PlayedBy
  delete c.Books
  delete c.label
  delete c.identifier
  // delete c.spouse
  delete c.mother
  delete c.father

  c['affiliation'] = c.allegiances
  delete c.allegiances

  graph.push(c)

  // {
  //   Id: 1358,
  //   Name: 'Elaena Targaryen',
  //   IsFemale: true,
  //   Culture: 'Valyrian',
  //   Titles: [ 'Princess' ],
  //   Aliases: [],
  //   Born: 'In 150 AC',
  //   Died: 'In or after 220 AC',
  //   Father: null,
  //   Mother: null,
  //   Spouse: 803,
  //   Children: [],
  //   Allegiances: [ 378, 303, 300, 257 ],
  //   Books: [ 11, 3, 5, 8 ],
  //   PovBooks: [],
  //   PlayedBy: [ '' ],
  //   TvSeries: []
  // }

})

houses.forEach((h) => {
  // h['rdfs:label'] = h.label
  h['name'] = h.label
  h['@type'] = 'foaf:Organization'
  h["@context"] = "https://tetherless-world.github.io/angular-json-ld-editor/person.jsonld"
  delete h.id
  delete h.Id
  delete h.Name
  delete h.Seats
  delete h.Region
  delete h.CoatOfArms
  delete h.Words
  delete h.Titles
  delete h.CurrentLord
  delete h.Founder
  delete h.founder
  delete h.Founded
  delete h.Heir
  delete h.Overlord
  delete h.DiedOut
  delete h.AncestralWeapons
  delete h.CadetBranches
  delete h.label
  delete h.identifier
  delete h.region
  delete h.coa
  delete h.words
  delete h.currentLord
  delete h.heir
  delete h.overlord
  delete h.cadetBranches
  graph.push(h)
})

// console.log(graph)

const kb = {
  "@context": "http://foaf.org",
  "@graph": graph
}

// fs.writeFileSync(`./data/graph.ld.json`, JSON.stringify(kb, null, 2))
// fs.writeFileSync(`./data/graph.ld.json`, JSON.stringify(graph, null, 2))
jsonld.toRDF(graph, {format: 'application/n-quads'}, (err, nquads) => {
  // nquads is a string of N-Quads
  console.log('NQUADS??')
  fs.writeFileSync(`./data/quads.nq`, nquads)
  console.log(err)
});
