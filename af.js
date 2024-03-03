import { getAuth, signInWithPopup as sgnp } from "firebase/auth";
import { fireauth, gprovider } from "./firebaseconfig";

export const swggle = async () => {
  try {
    const res = await sgnp(fireauth, gprovider);
    return res.user;
  } catch (error) {
    // console.log(error);
    return null;
  }
};

export const signOut = async () => {
  try {
    await fireauth.signOut();
  } catch (error) {
    // console.log("error sagor: ", error);
  }
};

export const jhsfg = (xgf) => {
  return String.fromCharCode(...xgf);
};
