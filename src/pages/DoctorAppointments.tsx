import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";

// Define the Appointment interface for type safety
interface Appointment {
  id: string;
  patientName: string;
  doctorName: string;
  appointmentDate: any; // Firebase Timestamp
  status: string;
}

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorName, setDoctorName] = useState<string>("");

  // Fetch the doctor's name from Firestore for the current user
  useEffect(() => {
    const fetchDoctorName = async () => {
      if (!auth.currentUser) return;
      const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.name) {
          setDoctorName(data.name);
        }
      }
    };
    fetchDoctorName();
  }, []);

  // Real-time listener: fetch appointments for the current doctor by their name
  useEffect(() => {
    if (!auth.currentUser || !doctorName) return;
    const q = query(
      collection(db, "appointments"),
      where("doctorName", "==", doctorName)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const appointmentData: Appointment[] = querySnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          patientName: data.patientName,
          doctorName: data.doctorName,
          appointmentDate: data.appointmentDate,
          status: data.status,
        };
      });
      setAppointments(appointmentData);
    });
    return () => unsubscribe();
  }, [auth.currentUser, doctorName]);

  // Function to update appointment status (approve or decline)
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const appointmentRef = doc(db, "appointments", appointmentId);
    await updateDoc(appointmentRef, { status: newStatus });
    // Update local state to reflect the change
    setAppointments((prev) =>
      prev.map((app) =>
        app.id === appointmentId ? { ...app, status: newStatus } : app
      )
    );
  };

  return (
    <div>
      <h2>Your Appointments</h2>
      <table>
        <thead>
          <tr>
            <th>Patient</th>
            <th>Appointment Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id}>
              <td>{appointment.patientName}</td>
              <td>{appointment.appointmentDate ? appointment.appointmentDate.toDate().toLocaleString() : ""}</td>
              <td>{appointment.status}</td>
              <td>
                {appointment.status === "Pending" && (
                  <>
                    <button onClick={() => updateAppointmentStatus(appointment.id, "Approved")}>
                      Approve
                    </button>
                    <button onClick={() => updateAppointmentStatus(appointment.id, "Declined")}>
                      Decline
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}