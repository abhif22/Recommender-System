	// RUN : mongoimport --db movie-recommender --collection movies --file /media/abhishek/AC9A1D089A1CD126/4th\ Year\ Project/Temp\ Backend/Movie_Details_Upto_2016.json



	var fs = require('fs')
	var mongoose = require('mongoose');
	var Review = require('./models/review.js')

	reviews = fs.readFileSync('reviews.json', {encoding: 'utf8'})
	reviews = JSON.parse(reviews)
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
		for(key in reviews){
		// console.log(movies[key])
			var request = new Promise(function(resolve, reject) {
				   //do an ajax call here. or a database request or whatever.
				   //depending on its results, either call resolve(value) or reject(error)
				   //where value is the thing which the operation's successful execution returns and
				   //error is the thing which the operation's failure returns.
				   // console.log(reviews[key].results)
				   		var newReview = new Review({
							key: key,
							id: reviews[key].id,
							review_collection: reviews[key].results
						})
				   newReview.save((err,savedReview)=>{
						if(err){
								console.log('Movie with ID: '+movies[key].id+'could not be saved')
								return reject(err)
								}
							i++;
							return resolve({saved: savedReview, i: i})
						})
					})

			request.then(function successHandler(result) {
			   			// console.log('Saved : '+result.i)
			 }, function failureHandler(error) {
			  //handle
			  console.log(error)
			 });			
	}

//Find Using db.reviews.findOne({'id':410803})
