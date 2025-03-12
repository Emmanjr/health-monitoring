// src/AdminDashboard.tsx
import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { User, Appointment } from "../types";

// Custom hook for managing users
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const userData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<User, "id">),
        }));
        setUsers(userData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load users");
        setLoading(false);
        console.error("Error fetching users:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  };

  return { users, loading, error, deleteUser };
};

// Custom hook for managing appointments
const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const appointmentData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Appointment, "id">),
        }));
        setAppointments(appointmentData);
        setLoading(false);
      },
      (err) => {
        setError("Failed to load appointments");
        setLoading(false);
        console.error("Error fetching appointments:", err);
      }
    );

    return () => unsubscribe();
  }, []);

  const deleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await deleteDoc(doc(db, "appointments", appointmentId));
      setAppointments((prev) => prev.filter((app) => app.id !== appointmentId));
    } catch (err) {
      console.error("Error deleting appointment:", err);
      alert("Failed to delete appointment");
    }
  };

  return { appointments, loading, error, deleteAppointment };
};

export default function AdminDashboard() {
  const {
    users,
    loading: usersLoading,
    error: usersError,
    deleteUser,
  } = useUsers();

  const {
    appointments,
    loading: appsLoading,
    error: appsError,
    deleteAppointment,
  } = useAppointments();

  if (usersLoading || appsLoading) {
    return <div className="loading">Loading data...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      {usersError && <div className="error">{usersError}</div>}
      {appsError && <div className="error">{appsError}</div>}

      {/* Users Section */}
      <div className="table-container">
        <h2>Manage Users ({users.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <button onClick={() => deleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Appointments Section */}
      <div className="table-container">
        <h2>Manage Appointments ({appointments.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((app) => (
              <tr key={app.id}>
                <td>{app.patientName}</td>
                <td>{app.doctorName}</td>
                <td>
                  {app.appointmentDate?.toDate().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>{app.status}</td>
                <td>
                  <button onClick={() => deleteAppointment(app.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}