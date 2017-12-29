	// RUN : mongoimport --db movie-recommender --collection movies --file /media/abhishek/AC9A1D089A1CD126/4th\ Year\ Project/Temp\ Backend/Movie_Details_Upto_2016.json


//USE THIS ONE 22/5/17
	var fs = require('fs')
	var mongoose = require('mongoose');
	var User = require('./models/user.js')
	var shortid = require('shortid')
	var random = require('random-world')
	var async = require('async')

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
			var i = 0
			async.waterfall([(cb)=>{

				async.each(users, (user, cb1)=>{

					var name = random.fullname(),
						email = random.email(),
						city = random.city(),
						country = random.country(),
						dob = random.date({start:'01/01/1980', end: '01/01/2010'});

					var newUser = new User({
						local: {
								name: name ,
								email: email,
								password: 'abc123',
								username: (user.UserID).toString(),
								city: city,
						        country: country,
						        dob: dob,
						        id: (user.UserID).toString()
								},
						facebook: {

						}
					})
						User.createUser(newUser, (err,savedUser)=>{
							if(err||!savedUser){
								console.log('Movie with ID: '+user.UserID+'could not be saved')
								cb1()
								}
								i++;
								console.log('Saved User '+user.UserID+'\t'+i)
								cb1()
						})
				}, (err)=>{
					if(err){
						cb(err)
					}
					cb(null)
				})

			}], (err, finalResult)=>{
				console.log('Operation Complete')
			})

