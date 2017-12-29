from flask import Flask
from flask import jsonify
from flask import request
import graphlab as gl
import pandas as pd
import numpy as np
import json

RatingsData = gl.SFrame.read_csv('./ml-latest-small-for-practice/ratings.csv')
RatingsData.head(20)

userData = gl.SFrame.read_csv('./users.dat', delimiter='::')
print userData.head()

movieData = gl.SFrame.read_csv('./ml-latest-small-for-practice/movies.csv')
print movieData.head()

userData.rename({'UserID':'userId'})
userIds = userData['userId']
print userIds.shape

print 'Starting Recommendations Training'
MatrixModel = gl.recommender.factorization_recommender.create(RatingsData, user_id='userId', item_id='movieId', target='rating', user_data=userData,item_data=movieData, max_iterations=100)
print 'Recommendations Training Ends'

recommendations = MatrixModel.recommend(users=userIds, k=30).sort(['userId','rank'])
print recommendations.head()
recommendations.export_json('./recommendations.json')
with open('recommendations.json') as json_data:
    data = json.load(json_data)

# This model will be updated when entire Recommender will be updated
PopularityModel = gl.recommender.popularity_recommender.create(observation_data= RatingsData, user_id='userId', item_id='movieId', target='rating')
print 'Popularity model constructed'

print 'Training Ranking Model'
RankingModel = gl.recommender.ranking_factorization_recommender.create(observation_data=RatingsData, user_id='userId', user_data=userData, item_id='movieId', item_data=movieData,target='rating', max_iterations=100)
print 'Trained Ranking Model'

app = Flask(__name__)

@app.route('/')
def index():
	return "hello flask"

@app.route('/get-recommendations')
def getAllRecommendations():
	return jsonify(data)

@app.route('/get-recommendations/user/<string:userId>')
def getRecommendationsForUser(userId):
	print 'Request for userid '+userId
	user_id = gl.SArray([12])
	rec = MatrixModel.recommend(users=user_id, k=20).sort(['userId','rank'])
	rec.export_json('./recommendations_'+userId+'.json')
	with open('recommendations_'+userId+'.json') as json_data:
		r = json.load(json_data)    
	return jsonify(r)

@app.route('/get-popular/<string:userId>')
def getPopular(userId):
	rec = PopularityModel.recommend(gl.SArray([userId]), k=20).sort(['rank'])
	rec.export_json('./popular.json')
	with open('popular.json') as json_data:
		popularMovies = json.load(json_data)    
	return jsonify(popularMovies)

@app.route('/get-recommendations-from-interactions/user/<string:userId>')
def getRecommendationsFromInteractions(userId):
	interactions = gl.SFrame.read_csv('./ml-latest-small-for-practice/interactions_'+userId+'.csv')
	InteractiveRec = MatrixModel.recommend_from_interactions(observed_items=interactions, k=10).sort(['rank'])
	InteractiveRec.export_json('./recommendations_'+userId+'.json')
	with open('recommendations_'+userId+'.json') as json_data:
		ri = json.load(json_data)    
	return jsonify(ri)

@app.route('/get-ranking-recommendations-from-interactions/user/<string:userId>')
def getRankingRecommendationsFromInteractions(userId):
	interactions = gl.SFrame.read_csv('./ml-latest-small-for-practice/interactions_'+userId+'.csv')
	InteractiveRankRec = RankingModel.recommend_from_interactions(observed_items=interactions, k=20).sort(['rank'])
	InteractiveRankRec.export_json('./recommendations_'+userId+'.json')
	with open('recommendations_'+userId+'.json') as json_data:
		ri = json.load(json_data)    
	return jsonify(ri)

if __name__ == "__main__":
	app.run()
