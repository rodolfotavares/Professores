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
  students?: { full_name: string } | null;
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
  is_read: boolean;
  created_at: string;
};
