const Deepstream = require('deepstream.io')
const ElasticSearchStorageConnector = require('deepstream.io-storage-elasticsearch')
const server = new Deepstream();

server.set('storage', new ElasticSearchStorageConnector({
  host: 'localhost:9200',
  splitChar: '/'
}))


module.exports = server
