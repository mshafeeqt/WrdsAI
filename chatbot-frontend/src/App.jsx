// -----------------------------------------------------------------------------
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import ChatUI from "./ChatUi";
import Login from "./login";
import Register from "./register";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";
import TestMain from "./features/Test/TestMain";
import MyProgress from "./features/Progress/MyProgress";
import PracticeMain from "./features/Practice/PracticeMain";
import TeacherHome from "./features/Teacher/pages/TeacherHome";
import TeacherProgress from "./features/Teacher/pages/TeacherProgress";
import RequireAuth from "./features/auth/RequireAuth";
import { USER_ROLES } from "./features/auth/roleAccess";
// -----------------------------------------------------------------------------

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/home"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.STUDENT]}>
              <ChatUI />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher-home"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.TEACHER]}>
              <TeacherHome />
            </RequireAuth>
          }
        />
        <Route
          path="/test-prep"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.STUDENT]}>
              <TestMain />
            </RequireAuth>
          }
        />
        <Route
          path="/practice"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.STUDENT]}>
              <PracticeMain />
            </RequireAuth>
          }
        />
        <Route
          path="/my-progress"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.STUDENT]}>
              <MyProgress />
            </RequireAuth>
          }
        />
        <Route
          path="/teacher-progress"
          element={
            <RequireAuth allowedRoles={[USER_ROLES.TEACHER]}>
              <TeacherProgress />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
}

export default App;

// import { ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { Routes, Route, Navigate } from "react-router-dom";
// import ChatUI from "./ChatUi";
// import Login from "./login";
// import Register from "./register";
// import { useSelector } from "react-redux";

// function App() {
//   const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

//   return (
//     <>
//       <Routes>
//         <Route
//           path="/register"
//           element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
//         />
//         <Route
//           path="/login"
//           element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
//         />
//         <Route
//           path="/"
//           element={isAuthenticated ? <ChatUI /> : <Navigate to="/login" />}
//         />
//       </Routes>
//       <ToastContainer />
//     </>
//   );
// }

// export default App;
