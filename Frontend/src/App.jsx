
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminApp from "./AdminApp";
import CustomerHome from "./CustomerHome";
import CustomerQueue from "./CustomerQueue";
import QueueConfirmation from "./QueueConfirmation";
import QueueStatus from "./QueueStatus";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerHome />} />
        <Route path="/queue/join" element={<CustomerQueue />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/queue/status" element={<QueueConfirmation />} />
        <Route path="/queue/check" element={<QueueStatus />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
