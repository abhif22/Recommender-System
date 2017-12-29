const request = require('http');

const getUpcomingMovies = async() =>{
    var data;
    http.request('http://api.themoviedb.org/3/movie/upcoming?api_key=068e3f59f93f5c2aa67262e9e9f3db73&page=1', (result)=>{
        result.on('data', (chunk)=>{
            data+=chunk;
        });
    await result.on('end', ()=>{
            console.log(data);
        })
   })
}