import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Main from "./Main.js"
import Sections from "./components/Sections";
import Rooms from "./components/Rooms";
import React from 'react';

function App() {
	return (
	  <Router>
		<Routes>
		  <Route path="/" element={<Main />} />
		  <Route path="/sections" element={<Sections />} />
		  <Route path="/rooms" element={<Rooms />} />
		</Routes>
	  </Router>
	);
  }

export default App;
