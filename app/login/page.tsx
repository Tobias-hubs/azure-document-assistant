"use client"; 

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() { 
    const router = useRouter(); 
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState(""); 

    const handleLogin = () => { 
        if (username && password === "tobias") { 
            localStorage.setItem("loggedIn", "true");
            localStorage.setItem("username", username);
            router.push("/"); 
        } else { 
            router.push("/login-error"); 
        }

    }; 

    return ( 
        <div className="min-h-screen flex items-center justify-center bg-zinc-900">
      <div className="bg-zinc-800 p-6 rounded w-80">
        <h1 className="mb-4 text-lg font-semibold">Logga in</h1>


<form
  onSubmit={(e) => {
    e.preventDefault();
    handleLogin();
  }}
>
        <input
          type="text"
          placeholder="Användarnamn"
          className="w-full p-2 mb-3 bg-zinc-700 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Lösenord"
          className="w-full p-2 mb-4 bg-zinc-700 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
        type="submit"
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 rounded"
        >
          Logga in
        </button>
        </form>
      </div>
    </div>
  );
    
}
