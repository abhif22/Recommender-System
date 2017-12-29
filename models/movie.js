var mongoose = require('mongoose')
var mongoosastic = require('mongoosastic')
var bcrypt = require('bcrypt')

var Schema = mongoose.Schema

var MovieSchema = new Schema({
	budget: String,
	genres: [{
				name: String,
				id: Number
			}
	],
	homepage: String,
	id: {
		type: Number,
		es_indexed: true
	},
	imdb_id: String,
	original_language: String,
	original_title: {
		type: String
	},
	overview: {
		type: String,
		es_indexed: false
	},
	poster_path: {
		type: String,
		es_indexed: true
	},
	release_date: {
		type: Date,
		es_indexed: true
	},
	revenue: Number,
	runtime: Number,
	status: String,
	title: {
		type: String,
		es_indexed: true
	},
	tagline: {
		type: String
	},
	vote_average: Number,
	vote_count: Number,
	popularity: Number,
	belongs_to_collection: {
		poster_path: String,
		backdrop_path: String,
		name: String
	},
	cast: [
		{
		cast_id: Number,
		credit_id: String,
		character: String,
		id: Number,
		name: {
			type: String,
			es_indexed: true
		},
		profile_path: String,
		order: Number
		}
	],
	crew: {
			director:{
				name: {
					type: String,
					es_indexed: true
				}
			},
			producer:{
				name: {
					type: String
				}
			},
			writer:{
				name: {
					type: String
				}
			},
		}
})

MovieSchema.plugin(mongoosastic,{
	hosts:[
		'localhost:9200'
	]
})

var Movie = mongoose.model('Movie', MovieSchema)

module.exports = Movie