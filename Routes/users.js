var router = require('express').Router()
var User = require('../models/user.js')
var Movie = require('../models/movie.js')

var passport = require('passport')
var LocalStrategy = require('passport-local').Strategy
var FacebookStrategy = require('passport-facebook').Strategy
var fs = require('fs')

var ensureAuthentication = (req,res,next)=>{
		if(req.isAuthenticated())
			next()
		else{
			req.flash('error_msg', 'You are not Logged In. Login First')
			return res.redirect('/users/login')
		}
	}

router.post('/favorite',ensureAuthentication,(req,res)=>{
	// console.log(req.body.movieId)
	// console.log(req.user)
	/*req.user.favorites.push({movieId: req.body.movieId})
	req.user.save((err, updatedUser)=>{
		if(err){
			res.end('Not Acknowledged!')
		}
		else{
			console.log(updatedUser)
			res.end('Acknowledged!')
		}
	})*/
	if(!req.body.wasFavorite){
	User.findByIdAndUpdate(req.user._id,{$addToSet:{'favorites':{'movieId':req.body.movieId}}},{safe: true, upsert: true},(err,updatedUser)=>{
		if(err){
			console.log(err)
			res.end(' Not Acknowledged!')
		}
		else{
			// console.log(updatedUser)
			res.end('Acknowledged!')
		}
	})
	}
	else{
		User.findByIdAndUpdate(req.user._id,{$pull:{'favorites':{'movieId':req.body.movieId}}},{safe: true, upsert: true},(err,updatedUser)=>{
		if(err){
			console.log(err)
			res.end(' Not Acknowledged!')
		}
		else{
			// console.log(updatedUser)
			res.end('Acknowledged!')
		}
	})
	}
})

router.get('/register',(req,res)=>{
	res.render('register',{
		errors: {},
	})
})
router.post('/register',(req,res)=>{
	var name = req.body.name,
		username = req.body.username,
		email = req.body.email,
		password1 = req.body.password1,
		password2 = req.body.password2,
		dob = req.body.dob
		city = req.body.city
		country = req.body.country
	// console.log(name)
	// console.log(username)
	// console.log(email)
	// console.log(password1)
	// console.log(password2)
	// console.log(dob)
	// console.log(city)
	// console.log(country)

	req.checkBody('name','Name is Required').notEmpty()
	req.checkBody('email','Email Address is Required').notEmpty()
	req.checkBody('email','Email Address is Not Valid').isEmail()
	req.checkBody('password1','Password is Required').notEmpty()
	req.checkBody('password2','Please Confirm the Password').notEmpty()
	req.checkBody('password2','Passwords Do Not Match').equals(password1) 

	errors = req.validationErrors();
	if(errors){
		console.log('YES ERORRS '+errors.toString())
		res.render('register',{
			errors: errors
		});
	}
	else{
		console.log('NO ERORRS!')
		var newUser = new User({
			local: {
					name: name,
					email: email,
					password: password1,
					username: username,
					city: city,
					country: country,
					dob: dob,
					id: Math.floor(Math.random() * 899999 + 100000)
					},
			facebook: {

			}
		})
		User.getUserByUsername(username,email,(err, existingUser)=>{
			if(err)
				throw err
			console.log('EXISTING USER'+existingUser)
			if(existingUser){
				if(existingUser.local.username == username){
					req.flash('error_msg', 'UserName not Available')
				}
				else
					req.flash('error_msg', 'Email Already Registered')
				return res.redirect('/users/register')
			}
			else{
				User.createUser(newUser,(err,user)=>{
					if(err)
						throw err;
					// console.log(user)
					req.flash('success_msg','You are Now Registered. Login Now')
					fs.appendFileSync('./my_vir_env/flask1/Project/users.dat', `\n${newUser.local.id}::M::25::9::55455`)
					return res.redirect('/users/login')
				})
			}
		})
	}
})

passport.use(new LocalStrategy((username, password, done)=>{
	console.log('UserName '+username+'\t'+'Password '+password)
	User.getUserByUsername(username,'',(err, user)=>{
		if(err)
			throw(err)
		if(!user)
			return done(null, false, {message: 'Incorrect Username'})
		User.comparePassword(password, user.local.password, (err, isMatch)=>{
			if(err)
				throw err
			if(isMatch)
				return done(null, user)
			else
				return done(null, false, {message: 'Incorrect Password'})
		})
	})
}))

passport.serializeUser((user, done)=>{
	done(null, user.id)
})

passport.deserializeUser((id, done)=>{
	User.getUserById(id,(err, user)=>{
		done(err, user)
	})
})

router.get('/login',(req, res)=>{
	res.render('login')
}).post('/login',passport.authenticate('local',{
	successRedirect: '/',
	failureRedirect: '/users/login',
	failureFlash: true
	}),(req,res)=>{
		return res.redirect('/')
	})

router.get('/logout',(req,res)=>{
	req.logout();
	req.flash('success_msg','Successfully Logged Out!')
	return res.redirect('/users/login')
})

module.exports = router;