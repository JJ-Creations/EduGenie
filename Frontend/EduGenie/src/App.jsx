import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout";

import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Chat from "./pages/Chat";
import Summaries from "./pages/Summaries";
import FlashCards from "./pages/FlashCards";
import QuizGenerator from "./pages/QuizGenerator";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="documents" element={<Documents />} />
          <Route path="chat" element={<Chat />} />
          <Route path="summaries" element={<Summaries />} />
          <Route path="flashcards" element={<FlashCards />} />
          <Route path="quiz" element={<QuizGenerator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;