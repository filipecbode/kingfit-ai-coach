-- Add a field to track completed exercises indices
ALTER TABLE workouts 
ADD COLUMN IF NOT EXISTS completed_exercises_indices INTEGER[] DEFAULT ARRAY[]::INTEGER[];

COMMENT ON COLUMN workouts.completed_exercises_indices IS 'Array of exercise indices that have been completed';
