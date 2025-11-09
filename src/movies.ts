// ENDPOINT 1
app.get('/api/movies', async (req: Request, res: Response) => {
  try {
    const movies = await db.collection('movies').find({}).toArray();
    res.status(200).json({
      success: true,
      count: movies.length,
      data: movies,
    });
  } catch (error: any) {
    console.error('Error fetching movies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movies',
      error: error.message,
    });
  }
});


//ENDPOINT 13
app.get('/api/movies/star', async (req: Request, res: Response) => {
  try {
    const minFiveStarReviews = 5;

    const pipeline = [
  
      { $unwind: "$movies" },
      
      //Filtra os movies com ratings de 5
      { $match: { "movies.rating": 5 } },
      
      //Agrupa por movieid e conta o número de 5 estrelas
      { $group: {
          _id: "$movies.movieid",
          fiveStarCount: { $sum: 1 }
      }},
      
      //Filtra apenas os grupos que têm o rating minimo
      { $match: { fiveStarCount: { $gte: minFiveStarReviews } } },
      
      { $lookup: {
          from: "movies",
          localField: "_id",
          foreignField: "_id",
          as: "movieDetails"
      }},
      
      { $unwind: "$movieDetails" },
    
      { $project: {
          _id: 0, 
          movieDetails: "$movieDetails", 
          numberOfFiveStarReviews: "$fiveStarCount" 
      }}
    ];

    const results = await db.collection('users').aggregate(pipeline).toArray();

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error('Error fetching star movies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch star movies',
      error: error.message,
    });
  }
});

//ENDPOINT 14
app.get('/api/movies/:year', async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const targetYear = parseInt(year, 10);

    if (isNaN(targetYear)) {
      return res.status(400).json({ success: false, message: 'Invalid year format.' });
    }

    const results = await db.collection('movies').find({ year: targetYear }).toArray();

    if (results.length === 0) {
        return res.status(404).json({ success: false, message: `No movies found with release year ${targetYear}.` });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error: any) {
    console.error(`Error fetching movies for release year ${req.params.year}:`, error);
    res.status(500).json({ success: false, message: 'Failed to fetch movies', error: error.message });
  }
}); 

//ENDPOINT 9
app.delete('/api/movies/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieId = parseInt(id, 10); 
    
    if (isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Movie ID format. Must be a number.',
      });
    }

    const result = await db.collection('movies').deleteOne({
      _id: movieId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `Movie with ID ${id} not found`,
      });
    }
    res.status(204).send(); 

  } catch (error: any) {
    console.error(`Error deleting movie with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete movie',
      error: error.message,
    });
  }
});