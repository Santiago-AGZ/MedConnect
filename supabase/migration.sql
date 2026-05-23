-- MedConnect - Esquema de Base de Datos
-- DB Password: 1XTElMxZhq7Uzw9p
-- Ejecutar en: Supabase SQL Editor

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TABLE public.doctors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  years_experience INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO public.doctors (name, specialty, years_experience) VALUES
  ('Dra. María Torres', 'Medicina General', 15),
  ('Dr. Carlos Ruiz', 'Pediatría', 10),
  ('Dr. Andrés Maya', 'Cardiología', 20),
  ('Dra. Laura Ríos', 'Dermatología', 8);

CREATE TABLE public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  doctor_id INT REFERENCES public.doctors(id) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','completed','cancelled')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own appointments" ON public.appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON public.appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.appointments FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID REFERENCES public.appointments(id) NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read messages for their appointments" ON public.chat_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM appointments WHERE id = chat_messages.appointment_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert messages for their appointments" ON public.chat_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM appointments WHERE id = chat_messages.appointment_id AND user_id = auth.uid()));
