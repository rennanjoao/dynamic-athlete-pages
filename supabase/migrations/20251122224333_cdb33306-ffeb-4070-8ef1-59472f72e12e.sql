-- Create student_profiles table
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  height DECIMAL(5,2), -- in cm
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create body_measurements table (for amateur mode)
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight DECIMAL(5,2), -- in kg
  waist DECIMAL(5,2), -- in cm
  hip DECIMAL(5,2),
  arm DECIMAL(5,2),
  thigh DECIMAL(5,2),
  chest DECIMAL(5,2),
  back DECIMAL(5,2),
  calf DECIMAL(5,2),
  forearm DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2), -- calculated
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skinfold_measurements table (for professional mode)
CREATE TABLE IF NOT EXISTS public.skinfold_measurements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weight DECIMAL(5,2), -- in kg
  -- Essential points
  triceps DECIMAL(5,2), -- in mm
  subscapular DECIMAL(5,2),
  suprailiac DECIMAL(5,2),
  abdominal DECIMAL(5,2),
  thigh DECIMAL(5,2),
  -- Optional points
  biceps DECIMAL(5,2),
  chest DECIMAL(5,2),
  midaxillary DECIMAL(5,2),
  calf DECIMAL(5,2),
  -- Calculated values
  body_fat_percentage DECIMAL(4,2),
  protocol_used TEXT, -- 'jackson_pollock_3', 'jackson_pollock_4', 'jackson_pollock_7'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create avatar_customization table
CREATE TABLE IF NOT EXISTS public.avatar_customization (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skin_color TEXT NOT NULL DEFAULT '#f5d0b0',
  eye_color TEXT NOT NULL DEFAULT '#8B4513',
  hair_color TEXT NOT NULL DEFAULT '#2C1810',
  hair_style TEXT NOT NULL DEFAULT 'short',
  clothing_color TEXT NOT NULL DEFAULT '#000000',
  nail_color TEXT, -- for female avatars
  shoe_color TEXT NOT NULL DEFAULT '#FFFFFF',
  shoe_accent_color TEXT NOT NULL DEFAULT '#FF0000',
  water_bottle_color TEXT NOT NULL DEFAULT '#4A90E2',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skinfold_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avatar_customization ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_profiles
CREATE POLICY "Users can view their own profile"
  ON public.student_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.student_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.student_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON public.student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for body_measurements
CREATE POLICY "Users can view their own measurements"
  ON public.body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements"
  ON public.body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
  ON public.body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all measurements"
  ON public.body_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for skinfold_measurements
CREATE POLICY "Users can view their own skinfold measurements"
  ON public.skinfold_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skinfold measurements"
  ON public.skinfold_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skinfold measurements"
  ON public.skinfold_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all skinfold measurements"
  ON public.skinfold_measurements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for avatar_customization
CREATE POLICY "Users can view their own avatar customization"
  ON public.avatar_customization FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own avatar customization"
  ON public.avatar_customization FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar customization"
  ON public.avatar_customization FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_body_measurements_user_date ON public.body_measurements(user_id, measurement_date DESC);
CREATE INDEX idx_skinfold_measurements_user_date ON public.skinfold_measurements(user_id, measurement_date DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_student_profiles_updated_at
  BEFORE UPDATE ON public.student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_avatar_customization_updated_at
  BEFORE UPDATE ON public.avatar_customization
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();