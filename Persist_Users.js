	// RUN : mongoimport --db movie-recommender --collection movies --file /media/abhishek/AC9A1D089A1CD126/4th\ Year\ Project/Temp\ Backend/Movie_Details_Upto_2016.json



	var fs = require('fs')
	var mongoose = require('mongoose');
	var User = require('./models/user.js')
	var shortid = require('shortid')
	var random = require('random-world')

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

	users = fs.readFileSync('userdata.json', {encoding: 'utf8'})
	users = JSON.parse(users)

			var name = [],email=[],city=[],country=[],dob=[];
			for(key in users){
		// console.log(movies[key])
			name.push(random.fullname())
			email.push(random.email())
			city.push(random.city())
			country.push(random.country())
			dob.push(random.date({start:'01/01/1980', end: '01/01/2010'}))
			}

	var i=0;
		for(key in users){
		// console.log(movies[key])
			var randPromise = new Promise((resolve, reject)=>{
				var name = random.fullname(),
				email = random.email(),
				city = random.city(),
				country = random.country(),
				dob = random.date({start:'01/01/1980', end: '01/01/2010'});

				resolve({
					name: name,
					email: email,
					city: city,
					country: country,
					dob: dob
				})
			})

			randPromise.then((result)=>{
				var request = new Promise(function(resolve, reject) {
				   //do an ajax call here. or a database request or whatever.
				   //depending on its results, either call resolve(value) or reject(error)
				   //where value is the thing which the operation's successful execution returns and
				   //error is the thing which the operation's failure returns.
				   // console.log(reviews[key].results)


				   	var newUser = new User({
						local: {
								name: result.name ,
								email: result.email,
								password: 'abc123',
								username: (users[key].UserID).toString(),
								city: result.city,
						        country: result.country,
						        dob: result.dob,
						        id: (users[key].UserID).toString()
								},
						facebook: {

						}
					})
						newUser.save((err,savedUser)=>{
							if(err){
								console.log('Movie with ID: '+users[key].id+'could not be saved')
								return reject(err)
								}
								i++;
								return resolve({saved: savedUser, i: i})
						})
					})
							request.then(function successHandler(result) {
				   			// console.log('Saved : '+result.i)
							 }, function failureHandler(error) {
							  //handle
							  console.log(error)
							 });
			},
			(err)=>{
				console.log('Error in Generating Random Data')
			})		
	}



//Find Using db.reviews.findOne({'id':410803})
