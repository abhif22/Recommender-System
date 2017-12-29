var router = require('express').Router()
var User = require('../models/user.js')
var async = require('async')
var Movie = require('../models/movie.js')

var ensureAuthentication = (req,res,next)=>{
		if(req.isAuthenticated())
			next()
		else{
			req.flash('error_msg', 'You are not Logged In. Login First')
			return res.redirect('/users/login')
		}
	}

	//Now we have all favorate Movies 
	//Loop through each movieId in favorites and fetch their details form mongodb
	//Add these details to an array
	//In view for your_watchlist loop and display all results as on upcoming page
var req
 getFavourites = (cb)=>{
 	// console.log(req.user)
	/*if(req.user.facebook!=null){
		console.log('Fetching Watchlist by Facebook')
		User.findOne({'facebook.email': req.user.facebook.email},(err, result)=>{
			if(err){
				cb(err)
			}
			cb(null, result.favorites)
		})
	}
	else if(req.user.local){
		console.log('Fetching Watchlist by Username')
		User.findOne({'local.username': req.user.local.username},(err, result)=>{
			console.log(result)
			if(err){
				cb(err)
			}
			cb(null, result.favorites)
		})
	}*/
	cb(null, req.user.favorites)
}

 getMovies = (favs, cb)=>{
	var i = 0
	var movies = []

	// console.log(favs)

	async.each(favs, (fav, callback)=>{
		Movie.findOne({id: fav.movieId}, (err, movie)=>{
			if(err)
				console.log('Not found Movie with id '+fav.movieId)
			if(movie)
			movies.push(movie)
			callback()
		})
	},(err)=>{
		if(err)
			cb(err)
		else{
			cb(null, movies)
		}
	})
}

router.get('/',ensureAuthentication,(request,res,next)=>{
	req = request
	async.waterfall([getFavourites, getMovies], (err, result)=>{
		if(err)
			return res.json(err)
		// return res.json(result)
		return res.render('watchlist',{data: result})
	})
})

router.post('/delete/',ensureAuthentication,(req,res,next)=>{
	User.findByIdAndUpdate(req.user._id,{$pull:{'favorites':{'movieId':req.body.movieId}}},{safe: true, upsert: true},(err,updatedUser)=>{
		if(err){
			console.log(err)
			return res.status(401).send({"status" : 'Some Error Occurred', 'movieId': req.body.movieId});
		}
		else{
			// console.log(updatedUser)
			return res.status(200).send({"status" : 'Done!', 'movieId': req.body.movieId});
		}
	})
})

module.exports = router;

/*[(cb)=>{
	if(req.user.facebook){
		User.findOne({'facebook.email': req.user.facebook.email},(err, result)=>{
			if(err){
				console.log(err)
			}
			cb(null, result.favorites)
		})
	}
	else if(req.user.local){
		User.findOne({'local.username': req.user.local.username},(err, result)=>{
			if(err){
				console.log(err)
			}
			cb(null, result.favorites)
		})
	}
}, (favs, cb)=>{
	var i = 0
	var movies = []

	console.log(favs)

	async.each(favs, (fav, callback)=>{
		Movie.findOne({id: fav.movieId}, (err, movie)=>{
			if(err)
				console.log('Not found Movie with id '+fav.movieId)
			movies.push(movie)
			callback()
		})
	},(err)=>{
		if(err)
			console.log(err)
		else{
			cb(null, movies)
		}
	})
}]*/