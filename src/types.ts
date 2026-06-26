export type Student = {
  id: string;
  teacher_id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  whatsapp: string | null;
  subject: string | null;
  days_of_week: number[];
  class_time: string | null;
  duration_minutes: number;
  classes_per_week: number | null;
  classes_per_month: number | null;
  price_per_class: number;
  status: 'active' | 'paused' | 'inactive';
};

export type ClassSchedule = {
  id: string;
  teacher_id: string;
  student_id: string;
  student_user_id: string | null;
  subject: string | null;
  class_date: string;
  class_time: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'absence';
  student_confirmed: boolean;
  started_at?: string | null;
  finished_at?: string | null;
  actual_duration_minutes?: number | null;
  teacher_present?: boolean;
  smart_status?: 'not_started' | 'in_progress' | 'completed';
  meeting_provider?: string | null;
  meeting_url?: string | null;
  external_meeting_id?: string | null;
  students?: { full_name: string } | null;
};

export type LessonReportStatus = 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

export type LessonReport = {
  id: string;
  lesson_id: string;
  teacher_id: string;
  student_id: string;
  student_user_id: string | null;
  title: string;
  summary: string | null;
  taught_content: string | null;
  student_questions: string | null;
  reinforcement_points: string | null;
  exercises_done: string | null;
  homework: string | null;
  next_recommendation: string | null;
  parent_message: string | null;
  raw_transcript: string | null;
  status: LessonReportStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  class_schedules?: { class_date: string; class_time: string; subject: string | null; duration_minutes: number | null; actual_duration_minutes: number | null } | null;
  students?: { full_name: string; subject?: string | null } | null;
};

export type Activity = {
  id: string;
  teacher_id: string;
  student_id: string | null;
  student_user_id: string | null;
  title: string;
  description: string;
  subject: string | null;
  due_date: string | null;
  points: number;
  file_url: string | null;
  status: 'pending' | 'submitted' | 'corrected' | 'expired';
  visible_to_student: boolean;
  students?: { full_name: string } | null;
};

export type ActivitySubmission = {
  id: string;
  activity_id: string;
  teacher_id: string;
  student_id: string;
  student_user_id: string | null;
  answer_text: string | null;
  answer_file_url: string | null;
  grade: number | null;
  feedback: string | null;
  status: 'submitted' | 'corrected';
  activities?: { title: string } | null;
  students?: { full_name: string } | null;
};

export type Message = {
  id: string;
  teacher_id: string;
  student_id: string;
  sender_id: string;
  sender_role: 'teacher' | 'student';
  text: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  is_read: boolean;
  created_at: string;
};
