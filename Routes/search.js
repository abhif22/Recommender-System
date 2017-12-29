var router = require('express').Router()
var Movie = require('../models/movie.js')
//FOR SEARCH RESULT TO REDIRECT
/*router.get('/',(req, res)=>{
	return res.redirect(`search?q=${req.body.q}`)
})

router.post('/', (req, res)=>{
	if(req.query.q){
		Movie.search({
			query_string: {
				query: req.query.q
			}
		},(err, result)=>{
			if(err){
				return next(err)
			}
			var data = result.hits.hits.map((hit)=>{
				return hit
			})
			//Now Do whatever you want with data
		})
	}
})*/

//FOR INSTANT SEARCH

router.post('/',(req, res)=>{
	console.log(req.body.search_term)
	Movie.search({
		query_string: {
			query: req.body.search_term
		}
	},(err, result)=>{
		if(err)
			return next(err)
		res.json(result)
	})
})

router.post('/advanced',(req,res)=>{
	console.log(req.body)
	return res.render('search_advanced.ejs')
})

router.get('/advanced',(req,res)=>{
	// console.log(req.body)
	return res.render('advanced_search.ejs')
})

module.exports = router