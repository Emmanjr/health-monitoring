// src/types.ts
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: Timestamp;
  status: string;
}