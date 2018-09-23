//  This isn't maintained anymore, pending deletion
const underscored = require('underscore.string/underscored')
const fs = require('fs')
const request = require('request')
let characters = require('./data/characters')
let houses = require('./data/houses')

// const graph = []
let graph = [
  'PREFIX got: <http://asoiaf.org/ont/elements/1.1/>',
  'INSERT DATA',
  '{'
]

let statements = ''
let batch = 0
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
  c.uri = 'http://asoiaf.org/character/' + c.id + '/' + c.identifier
  return c
})

houses = houses.map((h) => {

  // Defines the character's label
  const label = h['Name']
  const identifier = underscored(label)

  h.id = h['Id']
  h.label = label
  h.identifier = identifier
  h.uri = 'http://asoiaf.org/house/' + h.id + '/' + h.identifier
  h.region = h['Region']
  h.coa = h['CoatOfArms']
  h.words = h['Words']

  if (h['CurrentLord']) {
    h.currentLord = characters.find(e => e.id === h['CurrentLord']).uri
  }

  if (h['Founder']) {
    h.founder = characters.find(e => e.id === h['Founder']).uri
  }

  if (h['Heir']) {
    h.heir = characters.find(e => e.id === h['Heir']).uri
  }

  if (h['Overlord']) {
    h.overlord = characters.find(e => e.id === h['Overlord']).uri
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
      return houses.find(e => e.id === cadet).uri
    })
    // h.currentLord = characters.find(e => e.id === h['CurrentLord']).uri
  }
  // {
  //   "CadetBranches":[]
  // }

  return h
})

characters = characters.map((c) => {

  c.allegiances = c['Allegiances'].map((a) => {
    // return characters.find(e => a === e.id).uri
    return houses.find(e => a === e.id).uri
  })

  if (c['Father']) {
    c.father = characters.find(e => c['Father'] === e.id).uri
  }

  if (c['Mother']) {
    c.mother = characters.find(e => c['Mother'] === e.id).uri
  }

  if (c['Spouse']) {
    c.spouse = characters.find(e => c['Spouse'] === e.id).uri
  }

  return c
})

characters.forEach((c) => {

  // Almost done - no we join the triples into SPARQL statements
  // `  <http://example/book1> dc:title "${c['name']}" dc:creator "A.N.Other" .`,
  graph.push(`  <${c.uri}> ${prefix}label "${c.label}" .`)

  c['Aliases'].forEach((a) => {
    graph.push(`  <${c.uri}> ${prefix}alias "${a}" .`)
  })


  //
  // {
  //   Id: 1358,
  //   Name: 'Elaena Targaryen',
  //   IsFemale: true,
  //   Culture: 'Valyrian',
  //   Titles: [ 'Princess' ],
  //   Aliases: [],
  //   Born: 'In 150 AC',
  //   Died: 'In or after 220 AC',
  //   Spouse: 803,
  //   Children: [],
  //   Allegiances: [ 378, 303, 300, 257 ],
  //   Books: [ 11, 3, 5, 8 ],
  //   PovBooks: [],
  //   PlayedBy: [ '' ],
  //   TvSeries: []
  // }

  c.allegiances.forEach((a) => {
    graph.push(`  <${c.uri}> ${prefix}allegianceTo <${a}> .`)
  })

  c['PovBooks'].forEach((b) => {
    graph.push(`  <${c.uri}> ${prefix}povInBook <http://asoiaf.org/book/${b}> .`)
  })

  c['Titles'].forEach((t) => {
    graph.push(`  <${c.uri}> ${prefix}title "${t}" .`)
  })

  if (c.father) {
    graph.push(`  <${c.uri}> ${prefix}father <${c.father}> .`)
  }

  if (c.mother) {
    graph.push(`  <${c.uri}> ${prefix}mother <${c.mother}> .`)
  }

  if (c.spouse) {
    graph.push(`  <${c.uri}> ${prefix}spouse <${c.spouse}> .`)
  }

  if (c.born) {
    graph.push(`  <${c.uri}> ${prefix}born "${c.born}" .`)
  }

  if (c.died) {
    graph.push(`  <${c.uri}> ${prefix}died "${c.died}" .`)
  }


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

  if (graph.length > 1000) {

    graph.push('}')

    fs.writeFileSync(`./data/characters-${batch}.ld.json`, graph.join('\n'))
    request.post('http://localhost:8889/bigdata/namespace/got3/sparql').form({update: graph.join('\n') })

    batch++

    graph = [
      'PREFIX got: <http://asoiaf.org/ont/elements/1.1/>',
      'INSERT DATA',
      '{'
    ]

  }

})

graph.push('}')

// Writes linked data to file
// fs.writeFileSync('./data/characters.ld.json', JSON.stringify(graph, null, 2))
// fs.writeFileSync('./data/characters.ld.json', statements)
fs.writeFileSync(`./data/characters-${batch}.ld.json`, graph.join('\n'))
request.post('http://localhost:8889/bigdata/namespace/got3/sparql').form({update: graph.join('\n') })


// //////////////
// //////////////

graph = [
  'PREFIX got: <http://asoiaf.org/ont/elements/1.1/>',
  'INSERT DATA',
  '{'
]

houses.forEach((h) => {

  graph.push(`  <${h.uri}> ${prefix}label "${h.label}" .`)

  if (h.currentLord) {
    graph.push(`  <${h.uri}> ${prefix}currentLord <${h.currentLord}> .`)
  }

  if (h.heir) {
    graph.push(`  <${h.uri}> ${prefix}heir <${h.heir}> .`)
  }

  if (h.founder) {
    graph.push(`  <${h.uri}> ${prefix}founder <${h.founder}> .`)
  }

  if (h.words) {
    graph.push(`  <${h.uri}> ${prefix}words "${h.words}" .`)
  }

  if (h.coa) {
    graph.push(`  <${h.uri}> ${prefix}coa "${h.coa.replace('"', '')}" .`)
  }

  if (h.region) {
    graph.push(`  <${h.uri}> ${prefix}region <http://asoiaf.org/regions/${underscored(h.region)}> .`)
  }

  if (h.cadetBranches) {
    h.cadetBranches.forEach((e) => {
      graph.push(`  <${h.uri}> ${prefix}leaderBranchOf <${e}> .`)
    })
  }

  if (graph.length > 1000) {

    graph.push('}')

    fs.writeFileSync(`./data/houses-${batch}.ld.json`, graph.join('\n'))
    request.post('http://localhost:8889/bigdata/namespace/got3/sparql').form({update: graph.join('\n') })

    batch++

    graph = [
      'PREFIX got: <http://asoiaf.org/ont/elements/1.1/>',
      'INSERT DATA',
      '{'
    ]

  }

})

graph.push('}')
fs.writeFileSync(`./data/houses-${batch}.ld.json`, graph.join('\n'))
request.post('http://localhost:8889/bigdata/namespace/got3/sparql').form({update: graph.join('\n') })
