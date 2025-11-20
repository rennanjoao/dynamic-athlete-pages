-- Create tables for tracking workout and diet progress

-- Workout progress tracking
CREATE TABLE public.workout_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  workout_id text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Diet progress tracking
CREATE TABLE public.diet_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  meal_id text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Performance tracking for graphs
CREATE TABLE public.performance_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  workouts_completed integer NOT NULL DEFAULT 0,
  meals_completed integer NOT NULL DEFAULT 0,
  total_workouts integer NOT NULL DEFAULT 0,
  total_meals integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_progress
CREATE POLICY "Users can view their own workout progress"
  ON public.workout_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout progress"
  ON public.workout_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout progress"
  ON public.workout_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout progress"
  ON public.workout_progress FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for diet_progress
CREATE POLICY "Users can view their own diet progress"
  ON public.diet_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet progress"
  ON public.diet_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diet progress"
  ON public.diet_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet progress"
  ON public.diet_progress FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for performance_logs
CREATE POLICY "Users can view their own performance logs"
  ON public.performance_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own performance logs"
  ON public.performance_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own performance logs"
  ON public.performance_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at triggers
CREATE TRIGGER update_workout_progress_updated_at
  BEFORE UPDATE ON public.workout_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diet_progress_updated_at
  BEFORE UPDATE ON public.diet_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX idx_workout_progress_user_id ON public.workout_progress(user_id);
CREATE INDEX idx_diet_progress_user_id ON public.diet_progress(user_id);
CREATE INDEX idx_performance_logs_user_id_date ON public.performance_logs(user_id, date DESC);