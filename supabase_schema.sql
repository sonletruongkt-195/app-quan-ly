-- Bảng 1: Thông tin người dùng cơ bản và tiến độ trồng cây
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  email TEXT,
  photo_url TEXT,
  
  -- Điểm tiến trình cây
  plant_accumulated_points INT DEFAULT 0,
  flowers INT DEFAULT 0,
  fruits INT DEFAULT 0,
  saved_trees INT DEFAULT 0,
  is_plant_dead BOOLEAN DEFAULT false,
  
  -- Tracking thời gian
  last_watered_date DATE,
  last_opened_date DATE,
  consecutive_missed_days INT DEFAULT 0,
  
  -- Điểm game & streak
  total_game_points INT DEFAULT 0,
  current_win_streak INT DEFAULT 0,
  longest_win_streak INT DEFAULT 0,
  
  -- Mục tiêu doanh thu
  daily_revenue_target NUMERIC DEFAULT 0,
  revenue_target_month TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng 2: Thành tích trồng cây (Rừng cây)
CREATE TABLE IF NOT EXISTS forest_trees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  saved_at DATE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Bảng 3: Ghi nhận công việc hàng ngày
CREATE TABLE IF NOT EXISTS daily_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Tracking tưới cây
  watered_today BOOLEAN DEFAULT false,
  watered_at TIMESTAMPTZ,
  
  -- Task Data
  normal_tasks_done INT DEFAULT 0,
  normal_tasks_total INT DEFAULT 0,
  hard_tasks_done INT DEFAULT 0,
  hard_tasks_total INT DEFAULT 0,
  
  -- Revenue Data
  revenue_dien_lanh NUMERIC DEFAULT 0,
  revenue_chay NUMERIC DEFAULT 0,
  revenue_lai_xe NUMERIC DEFAULT 0,
  revenue_total NUMERIC DEFAULT 0,
  revenue_target NUMERIC DEFAULT 0,
  
  -- Tracking Thách thức và Bonus
  challenge_id INTEGER,
  challenge_status TEXT DEFAULT 'none',
  challenge_bonus INT DEFAULT 0,

  -- Trạng thái chốt ngày
  submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  
  -- Điểm số chi tiết ngày hôm đó
  watering_pts INT DEFAULT 0,
  task_pts NUMERIC DEFAULT 0,
  revenue_pts NUMERIC DEFAULT 0,
  streak_multiplier NUMERIC DEFAULT 1.0,
  total_day_score NUMERIC DEFAULT 0,
  task_percent NUMERIC DEFAULT 0,
  revenue_percent NUMERIC DEFAULT 0,
  
  -- Kết quả thắng/thua
  is_win BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ràng buộc 1 User chỉ có 1 Entry mỗi ngày
  UNIQUE(profile_id, date)
);

-- THIẾT LẬP BẢO MẬT: ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE forest_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Policy cho bảng Profiles: User chỉ xem/sửa profile của chính mình
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can select their own profile." ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policy cho rừng cây
CREATE POLICY "Users can manage their own forest." ON forest_trees FOR ALL USING (auth.uid() = profile_id);

-- Policy cho Daily Entries
CREATE POLICY "Users can manage their own entries." ON daily_entries FOR ALL USING (auth.uid() = profile_id);
