	// RUN : mongoimport --db movie-recommender --collection movies --file /media/abhishek/AC9A1D089A1CD126/4th\ Year\ Project/Temp\ Backend/Movie_Details_Upto_2016.json



	var fs = require('fs')
	var mongoose = require('mongoose');
	var Movie = require('./models/movie.js')

	movieDetails = fs.readFileSync('movieDetails16Sorted.json', {encoding: 'utf8'})
	movies = JSON.parse(movieDetails)
	console.log('Movies read from file')
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

 //NOTE BEFORE SAVING REMOVE CREW FROM SCHEMA
	var i=0;

		for(key in movies){
			if(movies[key].genres==" "){
				movies[key].genres = []
			}
		// console.log(movies[key])
		var newMovie = new Movie({
			budget: movies[key].budget,
			genres: movies[key].genres,
			homepage: movies[key].homepage,
			id: Math.round(movies[key].id),
			imdb_id: movies[key].imdb_id,
			original_language: movies[key].original_language,
			original_title: movies[key].original_title,
			overview: movies[key].overview,
			poster_path: movies[key].poster_path,
			release_date: movies[key].release_date,
			revenue: movies[key].revenue,
			runtime: movies[key].runtime,
			status: movies[key].status,
			title: movies[key].title,
			tagline: movies[key].tagline,
			vote_average: movies[key].vote_average,
			vote_count: movies[key].vote_count,
			popularity: movies[key].popularity,
			belongs_to_collection: movies[key].belongs_to_collection,
			cast: []
			})

			var request = new Promise(function(resolve, reject) {
				   //do an ajax call here. or a database request or whatever.
				   //depending on its results, either call resolve(value) or reject(error)
				   //where value is the thing which the operation's successful execution returns and
				   //error is the thing which the operation's failure returns.
	 				newMovie.save((err,savedMovie)=>{
							if(err){
								console.log('Movie with ID: '+movies[key].id+'could not be saved')
								return reject(err)
								}
							i++;
							return resolve({saved: savedMovie, i: i})
						})
				 });
			/*newMovie.save((err)=>{
				if(err)
			console.log('Movie with ID: '+movies[key].id+'could not be saved')
			})
			i++;*/
			request.then(function successHandler(result) {
			   			console.log('Saved : '+result.i)
			 }, function failureHandler(error) {
			  //handle
			  console.log(error)
			 });

	}



//Find Using db.movies.findOne({'id':410803})

	var request = new Promise(function(resolve, reject) {
	   //do an ajax call here. or a database request or whatever.
	   //depending on its results, either call resolve(value) or reject(error)
	   //where value is the thing which the operation's successful execution returns and
	   //error is the thing which the operation's failure returns.
	 
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