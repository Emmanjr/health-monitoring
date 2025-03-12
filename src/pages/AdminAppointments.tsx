import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// Define the Appointment interface
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
}

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      const appointmentsData: Appointment[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          patientName: data.patientName,
          doctorName: data.doctorName,
          date: data.date,
        };
      });
      setAppointments(appointmentsData);
    };
    fetchAppointments();
  }, []);

  const deleteAppointment = async (appointmentId: string) => {
    await deleteDoc(doc(db, "appointments", appointmentId));
    setAppointments(appointments.filter(app => app.id !== appointmentId));
  };

  return (
    <div>
      <h2>Manage Appointments</h2>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Doctor</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.patientName}</td>
              <td>{appointment.doctorName}</td>
              <td>{appointment.date}</td>
              <td>
                <button onClick={() => deleteAppointment(appointment.id)}>
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
