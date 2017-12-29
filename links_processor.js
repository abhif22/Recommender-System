var fs = require('fs')

links = fs.readFileSync('links.json', {encoding: 'utf8'})
links = JSON.parse(links)
// console.log(links)
var tmp = {}
for(i=0;i<links.length;i++){
	console.log(links[i].movieId)
	console.log(links[i])
	tmp[links[i].movieId] = links[i]
}

tmp = JSON.stringify(tmp)
fs.writeFileSync('./linksProcessed.json', tmp);