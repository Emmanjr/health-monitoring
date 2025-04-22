import { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { collection, query, where, getDocs, DocumentData } from "firebase/firestore";


export default function HealthRecords() {
  
  // ...
  const [records, setRecords] = useState<DocumentData[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      const q = query(collection(db, "healthRecords"), where("userId", "==", auth.currentUser?.uid));
      const querySnapshot = await getDocs(q);
      setRecords(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchRecords();
  }, []);

  return (
    <div>
      <h2>Health Records</h2>
      <table>
        <thead>
          <tr><th>BP</th><th>Heart Rate</th><th>Temperature</th><th>Date</th></tr>
        </thead>
        <tbody>
          {records.map((rec, index) => (
            <tr key={index}>
              <td>{rec.bp}</td>
              <td>{rec.heartRate}</td>
              <td>{rec.temperature}</td>
              <td>{rec.timestamp && typeof rec.timestamp.toDate === 'function' ? 
                rec.timestamp.toDate().toLocaleString() : 'No date available'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
