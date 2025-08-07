import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Regie from "./Regie";
import Spieler from "./Spieler";
import Viewer from "./Viewer";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      <Route path="/regie" element={<Regie />} />
      <Route path="/spieler" element={<Spieler />} />
      <Route path="/viewer" element={<Viewer />} />
    </Routes>
  </BrowserRouter>
);
