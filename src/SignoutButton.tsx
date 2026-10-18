import { useNavigate } from "react-router-dom";

export default function Signoutbutton(){
    
    const navigate = useNavigate()
    const handleSignOut = () => {
    localStorage.removeItem("token");
     localStorage.removeItem("user");
    localStorage.clear();
    navigate("/home" , { replace: true })
     window.dispatchEvent(new Event("auth-change"));
    console.log("cleared")
    };

    return(
    <button type="button" onClick={handleSignOut} 
    className="bg-red-500 text-amber-50 hover:bg-red-600 cursor-pointer w-fit rounded-3xl px-4 py-2">Sign Out</button>    
)
};
