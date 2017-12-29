
var router = require('express').Router()
var Movie = require('../models/movie.js')
var User = require('../models/user.js')
var http = require('http')
var fs = require('fs')
var async = require('async')
var unixTimestamp = require("unix-timestamp")

// movieDetails = fs.readFileSync('./Movie_Details_Upto_2016.json')
// movieDetails = JSON.parse(movieDetails)

SimilarMovies = fs.readFileSync('./ProcessedSimilarMoviesData.json', {encoding: 'utf8'})
SimilarMovies = JSON.parse(SimilarMovies)
// console.log('SIMILAR MOVIES READ!')

var links = fs.readFileSync('./linksProcessed.json', {encoding: 'utf8'})
links = JSON.parse(links)

// console.log('Links READ!')

var ensureAuthentication = (req,res,next)=>{
		if(req.isAuthenticated())
			next()
		else{
			req.flash('error_msg', 'You are not Logged In. Login First')
			return res.redirect('/users/login')
		}
	}

//Make sure to remove ensureAuth function as any user can browse movies but only logged in user can vote
// For that pass this function to router.post('/users/favourite') and router.post('explore/movie/:movie_id/rate')
var wasFav = 0
var wasRated = 0
var rating = 0
router.get('/movies/:movie_id',(req,res)=>{
	// console.log(req.user)
	var movieId = req.params.movie_id
	// console.log('Movie Id is '+movieId)

	async.waterfall([(cb)=>{

		Movie.findOne({id: movieId},(err,result)=>{
					// console.log('result',result)
					if(!result){
						// console.log('Movie Not found in database')
						console.info(err)
						return cb(null, false, movieId)
						}
						//If req.user that is user is logged in, then loop through its favorites list
						// To set wasFav flag
						if(req.user){
							for(i=0;i<req.user.favorites.length;i++){
								if(req.user.favorites[i].movieId==movieId){
									wasFav = 1
								}
							}
							for(i=0;i<req.user.favorites.length;i++){
								if(req.user.rated[i].movieId==movieId){
									rating = req.user.rated[i].rating
									wasRated = 1
								}
							}
						}
						else{
							wasFav = 0
							wasRated = 0
							rating = 0
						}
					return cb(null, true, result)
				})
	}, (gotResultFromDB, result, cb)=>{

			if(!gotResultFromDB){
				//Get Data from TMDB
				// console.log('Getting Movie Data from TMDB')
				var data
				http.request(`http://api.themoviedb.org/3/movie/${result}?api_key=068e3f59f93f5c2aa67262e9e9f3db73`, function(response) {
					  response.setEncoding('utf8');
					  response.on('data', function (chunk) {
					    // console.log('BODY: ' + chunk);
					    data+=chunk
					  });
					  response.on('end',()=>{
					  	return cb(null, gotResultFromDB, JSON.parse(data.substring(9)))
					  })
					  response.on('error', (err)=>{
					  	return cb(err)
					  })
				}).end();
			}
			else{
				cb(null, gotResultFromDB, result)
			}

	}, (gotResultFromDB, result, cb)=>{

		if(!gotResultFromDB){
			//Save this movie in database since it was not present
			var newMovie = new Movie({
			backdrop_path: (result.backdrop_path|| ''),
			budget: result.budget,
			genres: result.genres,
			homepage: (result.homepage|| ' '),
			id: result.id,
			imdb_id: result.imdb_id,
			original_language: result.original_language,
			original_title: result.original_title,
			overview: result.overview,
			poster_path: result.poster_path,
			release_date: result.release_date,
			revenue: result.revenue,
			runtime: result.runtime,
			status: result.status,
			title: result.title,
			tagline: result.tagline,
			vote_average: result.vote_average,
			vote_count: result.vote_count,
			popularity: result.popularity,
			belongs_to_collection: (result.belongs_to_collection||'')
			})

			newMovie.save((err, savedMovie)=>{
				// console.log(savedMovie)
				if(err)
					return cb(null, gotResultFromDB, result)
				return cb(null, gotResultFromDB, result)
			})
		}
		else{
			cb(null, gotResultFromDB, result)
		}

	},(gotResultFromDB, result, cb)=>{

		var movie_details = {}
		//Add Cast, Crew, Similar Movies to movie_details
		//For Cast and Crew make a TMDB API Call
		movie_details.wasFav = wasFav
		movie_details.wasRated = wasRated
		movie_details.rating = rating
		movie_details.movie = result
		// console.log(movie_details.movie.cast)
		movie_details.movie.cast = []
		if(gotResultFromDB||movie_details.movie.cast.length==0){
			// console.log('Fetching Cast Data form API')
		var data
		http.request(`http://api.themoviedb.org/3/movie/${movieId}/casts?api_key=068e3f59f93f5c2aa67262e9e9f3db73`, function(response) {
			  response.setEncoding('utf8');
			  response.on('data', function (chunk) {
			    // console.log('BODY: ' + chunk);
			    data+=chunk
			  });
			  response.on('end',()=>{
			  	// console.log(data)
			  	return cb(null, gotResultFromDB, movie_details, JSON.parse(data.substring(9)))
			  })
			  response.on('error', (err)=>{
			  	return cb(err)
			  })
		}).end();
	}
	else{
		return cb(null, gotResultFromDB, movie_details, false)
	}
	}, (gotResultFromDB, movie_details, cast_and_crew, cb)=>{

		if(cast_and_crew){
				   // console.log(result)
			// console.log('CAST AND CREW')
			// console.log(cast_and_crew)
			movie_details.cast = cast_and_crew.cast
			var crew = {}
			for(j=0;j<cast_and_crew.crew.length;j++){
				var job = cast_and_crew.crew[j].job
				if(job == 'Director'){
					crew.director = cast_and_crew.crew[j].name
				}
				else if(job == 'Producer'){
					crew.producer = cast_and_crew.crew[j].name
				}
				else if(job=='Writer'){
					crew.writer = cast_and_crew.crew[j].name
				}
			}

			movie_details.crew= crew

			//Now Save this cast and crew to mongodb one by one insert all cast data
			Movie.findOneAndUpdate({id: movie_details.movie.id}, {$set: { cast: movie_details.cast, crew: movie_details.crew}},(err, updatedMovie)=>{
				if(err){
					console.log(err)
				}
				return cb(null,gotResultFromDB, movie_details)
			})
		}
		else{
			movie_details.cast = movie_details.movie.cast
			movie_details.crew = movie_details.movie.crew
			return cb(null,gotResultFromDB, movie_details)
		}
			

	}, (gotResultFromDB, movie_details, cb)=>{

		if(gotResultFromDB){
			var arr = []
			let similarMoviesIds = SimilarMovies[movieId]
			// console.log('SIMILAR MOVIES IDS')
			// console.log(similarMoviesIds)
			var count = 0
			async.each(similarMoviesIds, (id, cb1)=>{

				Movie.findOne({id: id.similar},(err,movieInfo)=>{
					if(err)
						return cb(err)
					count++;
					arr.push(movieInfo)
					cb1()
				})

			}, (err)=>{
				if(err)
					return cb(err)
				movie_details.similarmovies = arr
				return cb(null, gotResultFromDB, movie_details)
			})
		}
		else{
			// Set movie_details.similarmovies = empty array else it will give error in ejs rendering
			movie_details.similarmovies = []
			//Since gotResultFromDB is false don't stop waterfall
			cb(null, gotResultFromDB, movie_details)
		}

	} ,(gotResultFromDB, movie_details, cb)=>{

		if(req.user&&gotResultFromDB){
			/*var tmp = req.user.recent_movies
			console.log('TMP = '+tmp)
			tmp.pop()
			tmp.push(req.params.movie_id)*/

			if(req.user.recent_movies.length>=10){
				//Pull from back
				var pull_id = req.user.recent_movies[0].movieId
				// console.log('pull_id '+pull_id)
				User.findByIdAndUpdate(req.user._id,{$pull:{'recent_movies':{'movieId':pull_id}}},{safe: true, upsert: true},(err,updatedUser)=>{
					if(err){
						console.log(err)
					}
					else{
						// console.log('Successfully Pulled!')
					}
					return cb(null, gotResultFromDB, movie_details)
				})
			}
			else{
				return cb(null, gotResultFromDB, movie_details)
			}
		}
		else{
			return cb(null, gotResultFromDB, movie_details)
		}

	}, (gotResultFromDB, movie_details, cb)=>{

		if(req.user&&gotResultFromDB){
			/*var tmp = req.user.recent_movies
			console.log('TMP = '+tmp)
			tmp.pop()
			tmp.push(req.params.movie_id)*/
			User.findByIdAndUpdate(req.user._id,{$push:{'recent_movies':{'movieId': req.params.movie_id}}},{safe: true, upsert: true},(err,updatedUser)=>{
				if(err){
					console.log(err)
				}
				else{
					// console.log(updatedUser)
				}
				return cb(null, movie_details)
			})			
		}
		else{
			return cb(null, movie_details)
		}
	}], (err, finalResult)=>{
		if(err)
			return res.render('movie_details',{err: err})
		else{
			// console.log(finalResult)
			console.log('Was Rated '+finalResult.wasRated)
			console.log('Rating '+finalResult.rating)
			return res.render('movie_details',{movie_details: finalResult})
		}
	})

})

router.get('/popular', (req, res)=>{
	var message = req.query.message
	console.log(message)
	async.waterfall([(cb)=>{

			//For Popular
				if(req.user&&req.user.local.username){
					var id = req.user.local.id
					var url = `http://127.0.0.1:5000/get-popular/${id}`					
				}
				else if(req.user&&req.user.facebook.email){
					var id = req.user.facebook.id
					console.log('Fetching Recommendations for '+req.user.facebook.email)
					console.log('fb id '+id)
					var url = `http://127.0.0.1:5000/get-popular/${id}`					
				}
				else{
					console.log('Fetching Recommendations for not logged in user')
					var url = `http://127.0.0.1:5000/get-popular/1`	
				}
			
			var data
				http.request(url, function(response) {
					  response.setEncoding('utf8');
					  response.on('data', function (chunk) {
					    // console.log('BODY: ' + chunk);
					    data+=chunk
					  });
					  response.on('end',()=>{
					  	// console.log('Data Received from Python')
					  	// console.log(JSON.parse(data.substring(9)))
					  	return cb(null, JSON.parse(data.substring(9)))
					  })
					  response.on('error', (err)=>{
					  	return cb(err)
					  })
				}).end();

		},(recommendations, cb)=>{

			var movies = []
			async.each(recommendations, (recommendation, cb1)=>{
				// console.log(recommendation.movieId)
				// console.log('Movie Id '+links[recommendation.movieId].tmdbId)
				Movie.findOne({id: links[recommendation.movieId].tmdbId}, (err, movieData)=>{
					// console.log(movieData)
					if(err){
						return cb1()
					}
					movies.push(movieData)
					return cb1()
				})
			}, (err)=>{
				if(err){
					return cb(err)
				}
				return cb(null, movies)
			})

		}],(err, recommendations)=>{
			if(err){
				//Do this inside the callback which returns recent data
				console.log(err)
				// console.log('Called with Error!')
				// return res.render('recommendations.ejs',{err: err})
			}
			// console.log(recommendations)
			// console.log('Calling without err')
			// return res.json(recommendations)
			return res.render('popular.ejs', {data: recommendations, message: message})

		})
})

router.get('/upcoming',(req,res)=>{
	
	var request = new Promise(function(resolve, reject) {
	   //do an ajax call here. or a database request or whatever.
	   //depending on its results, either call resolve(value) or reject(error)
	   //where value is the thing which the operation's successful execution returns and
	   //error is the thing which the operation's failure returns.
	   var options = {
		  host: 'http://api.themoviedb.org',
		  path: '/3/movie/upcoming?api_key=068e3f59f93f5c2aa67262e9e9f3db73',
		  method: 'GET'
		};
		var data
		http.request('http://api.themoviedb.org/3/movie/upcoming?api_key=068e3f59f93f5c2aa67262e9e9f3db73', function(result) {
			  result.setEncoding('utf8');
			  result.on('data', function (chunk) {
			    // console.log('BODY: ' + chunk);
			    data+=chunk
			  });
			  result.on('end',()=>{
			  	resolve(data)
			  })
		}).end();
	 });

	 request.then(function successHandler(result) {
	   //do something with the result
	   result = result.substring(9)
	   // console.log(result)
	   result = JSON.parse(result)
	   var byPopularity = result['results'].slice(0);
		byPopularity.sort(function(a,b) {
		    return b.popularity - a.popularity;
		});
		// var stringifiedResult = JSON.stringify(byPopularity,null, 4);
	   res.render('upcoming',{data: byPopularity, total_pages: result.total_pages})
	 }, function failureHandler(error) {
	  //handle
	  res.json(error)
	 });

})

router.get('/upcoming/:page',(req,res)=>{

	async.waterfall([(cb)=>{

		var page = req.params.page
		console.log('Asked for page '+page)  
		var data
		http.request('http://api.themoviedb.org/3/movie/upcoming?api_key=068e3f59f93f5c2aa67262e9e9f3db73&page='+page, function(result) {
			  result.setEncoding('utf8');
			  result.on('data', function (chunk) {
			    // console.log('BODY: ' + chunk);
			    data+=chunk
			  });
			  result.on('end',()=>{
			  	return cb(null, JSON.parse(data.substring(9)))
			  })
		}).end();
	}, (result, cb)=>{

			var byPopularity = result['results'].slice(0);
				byPopularity.sort(function(a,b) {
				    return b.popularity - a.popularity;
				});
				cb(null, result.total_pages, byPopularity)

	}],(err, total_pages, finalResult)=>{
		if(err){
			return res.render('upcoming',{data: finalResult, total_pages: total_pages})
		}
		res.render('upcoming',{data: finalResult, total_pages: total_pages})
	})
})


router.post('/movies/:movieId/rate', ensureAuthentication, (req, res)=>{
	// console.log(req.user.local.username)
	// console.log(Object.keys(req.user.local).length)
	// console.log(req.user.facebook)
	async.waterfall([(cb)=>{
	if(req.user.local.username){
		var id = req.user.local.id
	}
	else{
		var id = req.user.facebook.id
	}
	console.log('ID '+id)
	var timestamp = Math.round(unixTimestamp.now())
	var mid
	for(key in links){
		if(links[key].tmdbId==req.body.movieId)
			mid =  links[key].movieId
	}

	fs.appendFileSync('./my_vir_env/flask1/Project/ml-latest-small-for-practice/ratings.csv', `\n${id},${mid},${req.body.rating},${timestamp}`)
	
	return cb(null,mid,timestamp)

	},(mid, timestamp, cb)=>{

		if(req.user.local.username){
		var id = req.user.local.id
		User.findOneAndUpdate({'local.id': id}, {$push: {rated: {movieId: mid, rating: req.body.rating, timestamp: timestamp}}}, {safe: true, upsert: true}, (err, updatedUser)=>{
			if(err){
				console.log(err)
			}
			return cb(null)
		})
	}
	else{
		var id = req.user.facebook.id
		User.findOneAndUpdate({'facebook.id': id}, {$push: {rated: {movieId: mid, rating: req.body.rating, timestamp: timestamp}}}, {safe: true, upsert: true}, (err, updatedUser)=>{
			if(err){
				console.log(err)
			}
			return cb(null)
		})
	}
		
	}], (err)=>{
		return res.end('Acknowledged')
	})
	//modify it res.end()
	//Send a post request to Flask with userId,movieId,rating,timestamp and
	//append it to the Ratings SFrame
	//Give a logic to it that when number of ratings obtained is above a threshold, 
	//save the ratings SFrame as csv
})

module.exports = router; 
