var mongoose = require('mongoose')
var bcrypt = require('bcrypt')

var Schema = mongoose.Schema

var ReviewSchema = new Schema({
	key: Number,
	id: Number,
	review_collection: [
		{
			content: String,
			url: String,
			id: String,
			author: String
		}
	]
})

var Review = mongoose.model('Review', ReviewSchema)

module.exports = Review