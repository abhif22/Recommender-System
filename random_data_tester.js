
var router = require('express').Router()
var Movie = require('../models/movie.js')
var User = require('../models/user.js')
var http = require('http')
var fs = require('fs')
var async = require('async')

// movieDetails = fs.readFileSync('./Movie_Details_Upto_2016.json')
// movieDetails = JSON.parse(movieDetails)

SimilarMovies = fs.readFileSync('./ProcessedSimilarMoviesData.json', {encoding: 'utf8'})
SimilarMovies = JSON.parse(SimilarMovies)
console.log('SIMILAR MOVIES READ!')

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
router.get('/movies/:movie_id',(req,res)=>{
	// console.log(req.user)
	var movieId = req.params.movie_id
	console.log('Movie Id is '+movieId)

	async.waterfall([(cb)=>{

		Movie.findOne({id: movieId},(err,result)=>{
					if(err)
						return cb(err)
						//If req.user that is user is logged in, then loop through its favorites list
						// To set wasFav flag
						if(req.user){
							for(i=0;i<req.user.favorites.length;i++){
								if(req.user.favorites[i].movieId==movieId){
									wasFav = 1
								}
							}
						}
						else
							wasFav = 0
					return cb(null, result)
				})
	}, (result,cb)=>{

		var movie_details = {}
		//Add Cast, Crew, Similar Movies to movie_details
		//For Cast and Crew make a TMDB API Call
		movie_details.wasFav = wasFav
		movie_details.movie = result

		var data
		http.request(`http://api.themoviedb.org/3/movie/${movieId}/casts?api_key=068e3f59f93f5c2aa67262e9e9f3db73`, function(response) {
			  response.setEncoding('utf8');
			  response.on('data', function (chunk) {
			    // console.log('BODY: ' + chunk);
			    data+=chunk
			  });
			  response.on('end',()=>{
			  	return cb(null, movie_details, data)
			  })
			  response.on('error', (err)=>{
			  	return cb(err)
			  })
		}).end();
	}, (movie_details, cast_and_crew, cb)=>{
			cast_and_crew = cast_and_crew.substring(9)
				   // console.log(result)
			cast_and_crew = JSON.parse(cast_and_crew)
			console.log('CAST AND CREW')
			// console.log(cast_and_crew)
			movie_details.cast = cast_and_crew.cast
			movie_details.crew= cast_and_crew.crew
			console.log('NOW PROCESSING SIMILAR MOVIES')
			var arr = []
			let similarMoviesIds = SimilarMovies[movieId]
			console.log('SIMILAR MOVIES IDS')
			console.log(similarMoviesIds)
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
				return cb(null, movie_details)
			})

	},(movie_details, cb)=>{

		var tmp = req.user.recent
		tmp.pop()

		User.findByIdAndUpdate(req.user._id,{$set:{'recent': tmp}},{safe: true, upsert: true},(err,updatedUser)=>{
			if(err){
				console.log(err)
			}
			else{
				console.log(updatedUser)
			}
			cb(null, movie_details)
		})			
	}], (err, finalResult)=>{
		if(err)
			return res.render('movie_details',{err: err})
		else
			return res.render('movie_details',{movie_details: movie_details})
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
			  console.log('STATUS: ' + res.statusCode);
			  console.log('HEADERS: ' + JSON.stringify(res.headers));
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
		var stringifiedResult = JSON.stringify(byPopularity,null, 4);
	   res.render('upcoming',{data: byPopularity})
	 }, function failureHandler(error) {
	  //handle
	  res.json(error)
	 });

})

module.exports = router; 












/*

var router = require('express').Router()
var Movie = require('../models/movie.js')
var http = require('http')
var fs = require('fs')
var async = require('async')

// movieDetails = fs.readFileSync('./Movie_Details_Upto_2016.json')
// movieDetails = JSON.parse(movieDetails)

SimilarMovies = fs.readFileSync('./ProcessedSimilarMoviesData.json', {encoding: 'utf8'})
SimilarMovies = JSON.parse(SimilarMovies)
console.log('SIMILAR MOVIES READ!')

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
router.get('/movies/:movie_id',(req,res)=>{
	// console.log(req.user)
	var movieId = req.params.movie_id
	console.log('Movie Id is '+movieId)
	var promise = new Promise((resolve, reject)=>{
			//Get Movie Details from Mongodb
				Movie.findOne({id: movieId},(err,result)=>{
					if(err)
						return reject(err)
						//If req.user that is user is logged in, then
						if(req.user){
							for(i=0;i<req.user.favorites.length;i++){
								if(req.user.favorites[i].movieId==movieId){
									wasFav = 1
								}
							}
						}
						else
							wasFav = 0
					return resolve(result)
				})
	})

	promise.then((result)=>{
		// console.log(result)
		var movie_details = {}
		//Add Cast, Crew, Similar Movies to movie_details
		//For Cast and Crew make a TMDB API Call
		movie_details.wasFav = wasFav
		movie_details.movie = result
		var get_cast_promise = new Promise((resolve, reject)=>{
						var data
						http.request(`http://api.themoviedb.org/3/movie/${movieId}/casts?api_key=068e3f59f93f5c2aa67262e9e9f3db73`, function(result) {
							  console.log('STATUS: ' + res.statusCode);
							  console.log('HEADERS: ' + JSON.stringify(res.headers));
							  result.setEncoding('utf8');
							  result.on('data', function (chunk) {
							    // console.log('BODY: ' + chunk);
							    data+=chunk
							  });
							  result.on('end',()=>{
							  	resolve(data)
							  })
						}).end();
				})

		get_cast_promise.then((cast_and_crew)=>{
				cast_and_crew = cast_and_crew.substring(9)
			   // console.log(result)
			   cast_and_crew = JSON.parse(cast_and_crew)
			console.log('CAST AND CREW')
			// console.log(cast_and_crew)
			movie_details.cast = cast_and_crew.cast
			movie_details.crew= cast_and_crew.crew

					//For Similar movies ??
				console.log('NOW PROCESSING SIMILAR MOVIES')
				var process_delay_promise = new Promise((resolve, reject)=>{
					console.log('INSIDE SIMILAR MOVIES PROMISE')
					var arr = []
					let similarMoviesIds = SimilarMovies[movieId]
					console.log('SIMILAR MOVIES IDS')
					console.log(similarMoviesIds)
					var count = 0
					for(i=0;i<10;i++){
						//Get SimilarMovies Data
						console.log('')
						var get_similar_movie_detail = new Promise((resolve, reject)=>{
							console.log('Finding For Similar Movie with Id '+similarMoviesIds[i].similar)
							Movie.findOne({id: similarMoviesIds[i].similar},(err,movieInfo)=>{
								if(err)
									reject(err)
								count++;
								arr.push(movieInfo)
								resolve(movieInfo)
							})
						})

						get_similar_movie_detail.then((simMovieDetail)=>{
							// console.log('Found Movie')
							// console.log(simMovieDetail)
							// console.log('-------------------------------------------------------')
							if(count>=10)
							resolve(arr)
						},(err)=>{
							arr.push({})
						})	
					}
				})

				process_delay_promise.then((simMovies)=>{
					console.log('SIMILAR MOVIES PROCESSING FINISHED!')
					movie_details.similarmovies = simMovies
					console.log('-------------------------------------------------------')
					console.log('-------------------------------------------------------')
					console.log(movie_details.similarmovies)
					console.log('-------------------------------------------------------')
					console.log('-------------------------------------------------------')
					return res.render('movie_details',{movie_details: movie_details})
				},(err)=>{
					movie_details['similarmovies'] = []
				})

				// console.log(movie_details)

				// res.render('movie_details',{movie_details: movie_details})
			},(err)=>{
				res.render('movie_details',{err: err})
			})

		},(err)=>{
			movie_details.cast = []
			movie_details.crew = []
		})



//movieDetails[req.params.movie_id]
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
			  console.log('STATUS: ' + res.statusCode);
			  console.log('HEADERS: ' + JSON.stringify(res.headers));
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
		var stringifiedResult = JSON.stringify(byPopularity,null, 4);
	   res.render('upcoming',{data: byPopularity})
	 }, function failureHandler(error) {
	  //handle
	  res.json(error)
	 });

})

module.exports = router; 



*/