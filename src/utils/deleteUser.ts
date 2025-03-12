// src/utils/deleteUser.ts
import { db } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";

export const deleteUser = async (userId: string) => {
  try {
    await deleteDoc(doc(db, "users", userId));
    console.log(`User with ID ${userId} deleted successfully.`);
  } catch (error) {
    console.error("Error deleting user:", error);
  }
};
