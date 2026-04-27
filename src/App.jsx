import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import NavBar         from "./components/NavBar";
import SprintReview   from "./pages/SprintReview";
import TimeLog        from "./pages/TimeLog";
import Setup          from "./pages/Setup";
import Dashboard      from "./pages/Dashboard";
import QuarterlyGoals from "./pages/QuarterlyGoals";
import TeamWorkload   from "./pages/TeamWorkload";
import ProductLeads   from "./pages/ProductLeads";
import ChatFAB        from "./components/ChatFAB";
import ChatPanel      from "./components/ChatPanel";

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  function handleChatToggle() {
    setChatOpen(o => !o);
    if (!chatOpen) setHasUnread(false);
  }

  return (
    <div style={{ fontFamily: "system-ui,-apple-system,sans-serif", minHeight: "100vh", background: "#f8fafc" }}>
      <NavBar />
      <div style={{ marginRight: chatOpen ? 400 : 0, transition: "margin-right 0.25s ease" }}>
        <Routes>
          <Route path="/"                element={<SprintReview />} />
          <Route path="/time-log"        element={<TimeLog />} />
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/quarterly-goals" element={<QuarterlyGoals />} />
          <Route path="/team-workload"   element={<TeamWorkload />} />
          <Route path="/product-leads"   element={<ProductLeads />} />
          <Route path="/setup"           element={<Setup />} />
        </Routes>
      </div>
      <ChatFAB onClick={handleChatToggle} isOpen={chatOpen} hasUnread={hasUnread} />
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
