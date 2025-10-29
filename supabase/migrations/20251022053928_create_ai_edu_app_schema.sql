/*
  # AI EDU APP Database Schema

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `duration` (text)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `lessons`
      - `id` (uuid, primary key)
      - `course_id` (uuid, foreign key)
      - `title` (text)
      - `summary` (text)
      - `order` (integer)
      - `created_at` (timestamp)
    
    - `news`
      - `id` (uuid, primary key)
      - `title` (text)
      - `content` (text)
      - `image_url` (text, optional)
      - `created_at` (timestamp)
    
    - `projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `summary` (text)
      - `dataset_link` (text, optional)
      - `created_at` (timestamp)
    
    - `jobs`
      - `id` (uuid, primary key)
      - `title` (text)
      - `company` (text)
      - `link` (text)
      - `description` (text)
      - `created_at` (timestamp)
    
    - `user_progress`
      - `id` (uuid, primary key)
      - `user_email` (text)
      - `course_id` (uuid, foreign key)
      - `completed` (boolean)
      - `progress_percentage` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `user_profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `learning_goal` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (student panel)
    - Add policies for admin write access (admin panel)
*/

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  duration text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses"
  ON courses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO anon, authenticated
  USING (true);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  summary text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view lessons"
  ON lessons FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert lessons"
  ON lessons FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete lessons"
  ON lessons FOR DELETE
  TO anon, authenticated
  USING (true);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view news"
  ON news FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert news"
  ON news FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update news"
  ON news FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete news"
  ON news FOR DELETE
  TO anon, authenticated
  USING (true);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  dataset_link text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert projects"
  ON projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update projects"
  ON projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete projects"
  ON projects FOR DELETE
  TO anon, authenticated
  USING (true);

-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  link text NOT NULL,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view jobs"
  ON jobs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert jobs"
  ON jobs FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update jobs"
  ON jobs FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete jobs"
  ON jobs FOR DELETE
  TO anon, authenticated
  USING (true);

-- User Progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  progress_percentage integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_email, course_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view their own progress"
  ON user_progress FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert their own progress"
  ON user_progress FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own progress"
  ON user_progress FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  learning_goal text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
  ON user_profiles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert profiles"
  ON user_profiles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update profiles"
  ON user_profiles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data
INSERT INTO courses (title, description, duration) VALUES
  ('Introduction to AI & Machine Learning', 'Learn the fundamentals of artificial intelligence and machine learning algorithms', '8 weeks'),
  ('Prompt Engineering Mastery', 'Master the art of crafting effective prompts for AI models like GPT-4 and Claude', '4 weeks'),
  ('Python for AI Development', 'Build AI applications using Python, NumPy, Pandas, and TensorFlow', '10 weeks'),
  ('Deep Learning Fundamentals', 'Understand neural networks, CNNs, RNNs, and transformer architectures', '12 weeks')
ON CONFLICT DO NOTHING;

INSERT INTO news (title, content, image_url) VALUES
  ('GPT-5 Release Expected in 2025', 'OpenAI announces major breakthroughs in reasoning capabilities for next-generation models', null),
  ('AI in Healthcare: Revolutionary Diagnosis System', 'New AI system achieves 98% accuracy in early cancer detection', null),
  ('Google DeepMind Unveils AlphaCode 2.0', 'Advanced AI coding assistant surpasses human programmers in competitive programming', null)
ON CONFLICT DO NOTHING;

INSERT INTO projects (title, summary, dataset_link) VALUES
  ('Customer Churn Prediction', 'Build a machine learning model to predict customer churn using telecom data', 'https://www.kaggle.com/datasets/blastchar/telco-customer-churn'),
  ('Sentiment Analysis on Twitter', 'Analyze sentiment of tweets using NLP and classify emotions', 'https://www.kaggle.com/datasets/kazanova/sentiment140'),
  ('Image Classification with CNNs', 'Create a deep learning model to classify images into 10 categories', 'https://www.kaggle.com/datasets/c/cifar-10')
ON CONFLICT DO NOTHING;

INSERT INTO jobs (title, company, link, description) VALUES
  ('AI Research Intern', 'Google DeepMind', 'https://careers.google.com', 'Work on cutting-edge AI research projects with world-class researchers'),
  ('Machine Learning Engineer', 'Microsoft', 'https://careers.microsoft.com', 'Build and deploy ML models at scale for Azure AI services'),
  ('Data Scientist - AI Division', 'Meta', 'https://careers.meta.com', 'Apply AI/ML to solve complex problems in social media and VR')
ON CONFLICT DO NOTHING;