import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext = createContext();

export const ChatProvider = ({children}) => {
    
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessage, setUnseenMessage] = useState({});

    const {socket, axios} = useContext(AuthContext);

    //function to get all users for sidebar
    const getUser = async () => {
        try{

            const {data} = await axios.get("/api/messages/users");
            if(data.success){
                setUsers(data.users);
                setUnseenMessage(data.unseenMessage);
            }

        }catch(err){
            toast.err(err.message);
        }
    }

    //function to get messages for selected user
    const getMessages = async (userId) => {
        try{
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                setMessages(data.messages);
            }
        }catch(err){
            toast.error(err.message);
        }
    }

    //function to send message to selected user

    const sendMessage = async (messageData) => {
        try{
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
            if(data.success){
                setMessages((prevMessages) => [...prevMessages,data.newMessage]);
            }
            else{
                toast.error(data.message);
            }


        }catch(err){
            toast.error(err.message);

        }
    }

    //function to subscribe to message for selected user

    const subscribeToMessages = async () => {
        if(!socket) return;
        socket.on("newMessage", (newMessage) => {
            if(selectedUser && newMessage.senderId === selectedUser._id){
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark.${newMessage._id}`);
            }else{
                setUnseenMessage((prevUnseenMessages) =>({
                    ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1

                }))
            }

        })
    }

    //function to unsubscribe from messages
    const unsubscribeFromMessages = async () => {
        if(socket) socket.off("newMessage");   
    }

    useEffect (() =>{
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [socket, selectedUser])

    const value = {
        messages,
        users,
        selectedUser,
        getUser,
        setMessages,
        sendMessage,
        setSelectedUser,
        unseenMessage,
        setUnseenMessage,
        getMessages


    }
    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )

}