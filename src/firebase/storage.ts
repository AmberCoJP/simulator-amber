import { getStorage } from "firebase/storage";
import app from "./config.ts";

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app); 