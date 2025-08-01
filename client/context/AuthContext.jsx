import { Children, createContext, use, useEffect, useState } from "react";
import axios from "axios"
import toast from "react-hot-toast";
import {io} from "socket.io-client"
import { data, useNavigate } from "react-router-dom";

const backendUrl=import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL=backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const navigate = useNavigate();
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [authUser, setAuthUser] = useState(null);
    const [onlineUser, setOnlineUser] = useState([]);
    const [socket, setSocket] = useState(null);
    
    //check is the user is authencticated . if so, set the user data and connect the socket

    const checkAuth = async () => {
        try{
            const { data } = await axios.get("/api/auth/check",{
                headers:{
                    Authorization:`Bearer ${token}`
                }
            });
            if(data?.success){
                setAuthUser(data.user);
                connectSocket(data.user);
            }
        }
        catch(err){
            if(err.response && err.response.status === 401){
                toast.error("Session Expired or unauthorized. Please log in.");
                // navigate('/login');
            }
            else{
                toast.error(err.message)

            }
            

        }
    }

    //Login function to handle user authentication and socket connection
    const login = async (state, credentials) => {
        try{
            const {data} = await axios.post(`/api/auth/${state}`, credentials);
            if(data.success){
                setAuthUser(data.userData);
                connectSocket(data.userData);
                axios.defaults.headers.common["token"] = data.token;

                setToken(data.token);
                localStorage.setItem("token", data.token);
                toast.success(data.message);

            }
            else{
                toast.error(data.message);
            }

        }catch(err){
            toast.error(err.message);

        }
    }

    //logout funtion to handle user logout and socket disconnection
    const logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([])
        axios.defaults.headers.common["token" ] = null;
        toast.success("Logged out successfullty");
        socket.disconnect();
    }

    // proupdatefile fucntion to handle user profile updates
     const updateProfile = async (body) => {
        const userToken = localStorage.getItem('token');
        if(!userToken){
            toast.error("Not authenticated. please log in");
            return;
        }
        try{
            const {data}= await axios.put("/api/auth/update-profile", body,{
                headers:{
                    Authorization: `Bearer ${userToken}`
                }
            });
            if(data.success){
                setAuthUser(data.user);
                toast.success("Profile updates Successfully");
            }
            else{
                toast.error(data.message);
            }

        }catch(err){
            toast.error(err.message);

        }
     }

    //connect socket function to handle socket connection online users updates
    const connectSocket = (userData) => {
        if(!userData || socket?.connected) return;
        const newSocket = io(backendUrl, {
            query: {
                userId: userData._id,

            }
        });
        newSocket.connect();
        setSocket(newSocket);
        newSocket.on("getOnlineUsers", (userIds) => {
            setOnlineUser(userIds);
        })
    }

    useEffect(() => {
        if(token){
            axios.defaults.headers.common["token"] = data.token;
        }
        checkAuth();

    },[])


    const value = {
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile
    } 
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}