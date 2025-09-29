
CREATE TABLE assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_age INTEGER,
  user_job TEXT,
  preferred_country TEXT,
  preferred_city TEXT,
  location_preference TEXT,
  immigration_policies_importance INTEGER,
  healthcare_importance INTEGER,
  safety_importance INTEGER,
  internet_importance INTEGER,
  emigration_process_importance INTEGER,
  ease_of_immigration_importance INTEGER,
  local_acceptance_importance INTEGER,
  climate_importance INTEGER,
  overall_score INTEGER,
  match_level TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
