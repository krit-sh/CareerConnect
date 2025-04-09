import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./login";
import Signup from "./signup";
import Home from "./home";
import Chatbot from "./chatbot";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/signup",
        element: <Signup />,
    },
    {
        path: "/home",
        element: <Home />,
    },
    {
        path: "/chatbot",
        element: <Chatbot />,
    },
    {
        path: "*",
        element: <Login />,
    }
], {
    future: {
        v7_startTransition: true,
        v7_relativeSplatPath: true
    }
});

function App() {
    return <RouterProvider router={router} />;
}

export default App;
