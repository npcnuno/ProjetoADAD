//ENDPOINT 2
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users = await db.collection('users').find({}).toArray();
    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
});

//ENDPOINT 8
app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id, 10); 

    if (isNaN(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid User ID format. Must be a number.',
      });
    }
    
    const result = await db.collection('users').deleteOne({
      _id: userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`,
      });
    }
    res.status(204).send();

  } catch (error: any) {
    console.error(`Error deleting user with ID ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message,
    });
  }
});