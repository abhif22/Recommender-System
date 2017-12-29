var fs = require('fs')

SimilarMovies = fs.readFileSync('SimilarMovies.json', {encoding: 'utf8'})
links = fs.readFileSync('linksProcessed.json', {encoding: 'utf8'})
SimilarMovies = JSON.parse(SimilarMovies)
links = JSON.parse(links)
data = {}
var map,holder,tmdbId
for(i=0;i<SimilarMovies.length;i+=10){
	var t1 = []
	tmdbId = Math.round(links[(SimilarMovies[i].movieId)].tmdbId)
	console.log('TMDB ID '+tmdbId)
	for(j=0;j<10;j++){
		holder = SimilarMovies[i+j]
		// console.log(holder)
		// console.log(links[holder.similar])
		holder.movieId = tmdbId
		holder.similar = Math.round((links[holder.similar]).tmdbId)
		t1.push(holder)
	}
	data[tmdbId] = t1
	}
data = JSON.stringify(data)

fs.writeFileSync('./ProcessedSimilarMoviesData.json',data)