	// RUN : mongoimport --db movie-recommender --collection movies --file /media/abhishek/AC9A1D089A1CD126/4th\ Year\ Project/Temp\ Backend/Movie_Details_Upto_2016.json

	//NOT USING TILL THIS COMMIT

	var fs = require('fs')
	var mongoose = require('mongoose');
	var Movie = require('./models/movie.js')
	var async = require('async')
	var http = require('http')

	movieDetails = fs.readFileSync('movieDetails16Sorted.json', {encoding: 'utf8'})
	movies = JSON.parse(movieDetails)
	mongoose.connect('mongodb://localhost/movie-recommender',(err)=>{
        if(err){
            console.log('Connection to MongoDB Failed!')
            console.log(err)
          }
          else{
            console.log('Connection to MongoDB Successfull!')
          }
    })

    var db = mongoose.connection
	var i=0;


//STARTING WATERFALL

	async.waterfall([(callback)=>{
		var arr = []
		for(key in movies){
			arr.push(movies[key])
		}
		callback(null, arr)
	},(moviesArr, callback)=>{
		for(i=0;i<3;i++)
			console.log(moviesArr[i])
		//Loop for each movie and fetch its cast and crew
		async.each(moviesArr, (movie, cb)=>{
			var newMovie = new Movie({
			budget: movie.budget,
			genres: movie.genres,
			homepage: movie.homepage,
			id: Math.round(movie.id),
			imdb_id: movie.imdb_id,
			original_language: movie.original_language,
			original_title: movie.original_title,
			overview: movie.overview,
			poster_path: movie.poster_path,
			release_date: movie.release_date,
			revenue: movie.revenue,
			runtime: movie.runtime,
			status: movie.status,
			title: movie.title,
			tagline: movie.tagline,
			vote_average: movie.vote_average,
			vote_count: movie.vote_count,
			popularity: movie.popularity,
			belongs_to_collection: movie.belongs_to_collection
			})

			newMovie.save((err)=>{
				if(err){
					console.log('Movie Could not be saved')
				}
				else{
					console.log('Saved Movie '+movie.id)
				}
				cb()
			})

	},(err)=>{
		// All cast data has been retrieved till now
		//Call next function
		callback(null)
	})

	}],(err)=>{
		console.log('Saved all Movies!')
		console.log('Over!')
	})