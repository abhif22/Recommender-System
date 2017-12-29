	var router = require('express').Router()
	var User = require('../models/user.js')
	var Movie = require('../models/movie.js')
	var async = require('async')
	var http = require('http')
	var fs = require('fs')

	var ensureAuthentication = (req,res,next)=>{
		if(req.isAuthenticated())
			next()
		else{
			req.flash('error_msg', 'You are not Logged In. Login First')
			return res.redirect('/users/login')
		}
	}

	var links = fs.readFileSync('./linksProcessed.json', {encoding: 'utf8'})
	links = JSON.parse(links)

//Work on recommendation and recent Movies will be done here

	router.get('/', ensureAuthentication, (req,res)=>{

		async.waterfall([(cb)=>{

			var recent = req.user.recent_movies
			console.log(recent)
			var movieData = []
			async.each(recent, (movie, cb1)=>{
				Movie.findOne({'id': movie.movieId},(err, result)=>{
					if(err){
						return cb1(err)
					}
					movieData.push(result)
					//This statement means increment counter of loop and run loop again
					return cb1()
				})
			}, (err)=>{
				//This callback is invoked if
				// i.  err occurs and cb1(err) is called
				// ii. loop finishes 
				if(err)
					return cb(err)
				return cb(null, movieData)
			})


		},(res1, cb)=>{

			//For Recommendations
			var data
				http.request(`http://127.0.0.1:5000/get-recommendations/user/${req.user.local.username}`, function(response) {
					  response.setEncoding('utf8');
					  response.on('data', function (chunk) {
					    // console.log('BODY: ' + chunk);
					    data+=chunk
					  });
					  response.on('end',()=>{
					  	// console.log('Data Received from Python')
					  	// console.log(JSON.parse(data.substring(9)))
					  	return cb(null, res1, JSON.parse(data.substring(9)))
					  })
					  response.on('error', (err)=>{
					  	return cb(err)
					  })
				}).end();

		},(recentMovies, recommendations, cb)=>{

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
				return cb(null, recentMovies, movies)
			})

		}],(err, finalResult, recommendations)=>{
			if(err){
				//Do this inside the callback which returns recent data
				return res.render('index.ejs',{err: err})
			}
			return res.render('index.ejs', {data: finalResult})

		})

	})
	module.exports = router;