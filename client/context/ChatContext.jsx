// import { createContext, useContext, useEffect, useState } from "react";
// import { AuthContext } from "./AuthContext";
// import toast from "react-hot-toast";


// export const ChatContext = createContext();

// export const ChatProvider = ({children}) => {

    
//     const [messages, setMessages] = useState([]);
//     const [users, setUsers] = useState([]);
//     const [selectedUser, setSelectedUser] = useState(null);
//     const [unseenMessage, setUnseenMessage] = useState({});

//     const {socket, axios} = useContext(AuthContext);

//     //function to get all users for sidebar
//     const getUser = async () => {
//         try{

//             const {data} = await axios.get("/api/messages/users");
//             if(data.success){
//                 setUsers(data.users);
//                 setUnseenMessage(data.unseenMessage);
//             }

//         }catch(err){
//             toast.err(err.message);
//         }
//     }

//     //function to get messages for selected user
//     const getMessages = async (userId) => {
//         try{
//             const {data} = await axios.get(`/api/messages/${userId}`);
//             if(data.success){
//                 setMessages(data.messages);
//             }
//         }catch(err){
//             toast.error(err.message);
//         }
//     }

//     //function to send message to selected user

//     const sendMessage = async (messageData) => {
//         try{
//             const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
//             if(data.success){
//                 setMessages((prevMessages) => [...prevMessages,data.newMessage]);
//             }
//             else{
//                 toast.error(data.message);
//             }


//         }catch(err){
//             toast.error(err.message);

//         }
//     }

//     //function to subscribe to message for selected user

//     const subscribeToMessages = async () => {
//         if(!socket) return;
//         socket.on("newMessage", (newMessage) => {
//             if(selectedUser && newMessage.senderId === selectedUser._id){
//                 newMessage.seen = true;
//                 setMessages((prevMessages) => [...prevMessages, newMessage]);
//                 axios.put(`/api/messages/mark/${newMessage._id}`);
//             }else{
//                 setUnseenMessage((prevUnseenMessages) =>({
//                     ...prevUnseenMessages, [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId] + 1 : 1

//                 }))
//             }

//         })
//     }

//     //function to unsubscribe from messages
//     const unsubscribeFromMessages = async () => {
//         if(socket) socket.off("newMessage");   
//     }

//     useEffect (() =>{
//         subscribeToMessages();
//         return () => unsubscribeFromMessages();
//     }, [socket, selectedUser])

//     const value = {
//         messages,
//         users,
//         selectedUser,
//         getUser,
//         setMessages,
//         sendMessage,
//         setSelectedUser,
//         unseenMessage,
//         setUnseenMessage,
//         getMessages


//     }
//     return (
//         <ChatContext.Provider value={value}>
//             {children}
//         </ChatContext.Provider>
//     )
// }

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  if (!auth) {
    console.error("AuthContext not available inside ChatProvider.");
    return null; // or a fallback UI
  }

  const { socket, axios } = auth;

  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessage, setUnseenMessage] = useState({});

  // -------- API calls --------
  const getUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if(!token) return toast.error("Login First");
    try {
      const { data } = await axios.get("/api/messages/users",{
        headers:{
          authorization: `Bearer ${token}`
        }
      });
      if (data?.success) {
        setUsers(data.users || []);
        setUnseenMessage(data.unseenMessage || {});
      }
    } catch (err) {
      toast.error(err?.message || "Failed to fetch users");
    }
  }, [axios]);

  const getMessages = useCallback(
    async (userId) => {
      if (!userId) return;
      // const userToken = localStorage.getItem('jwtToken'); // Get token for each request
      const userToken = localStorage.getItem("token")
      if (!userToken) {
          toast.error("Not authenticated. Please log in.");
          // Optionally redirect to login
          return;
      }
      try {
        const { data } = await axios.get(`/api/messages/${userId}`);
        if(data?.success) setMessages(data.message || []);
      } catch (err) {
        toast.error(err?.messages || "Failed to fetch messages");
      }
    },
    [axios]
  );

  const sendMessage = useCallback(
    async (messageData) => {
      if (!selectedUser?._id) {
        toast.error("No user selected.");
        return;
      }
      try {
        const { data } = await axios.post(`/api/messages/send/${selectedUser._id}`, messageData);
        if (data?.success) {
          setMessages((prev) => [...prev, data.newMessage]);
        } else {
          toast.error(data?.message || "Failed to send message");
        }
      } catch (err) {
        toast.error(err?.message || "Failed to send message");
      }
    },
    [axios, selectedUser?._id]
  );

  // Mark a single message as seen (server)
  const markSeen = useCallback(
    async (messageId) => {
      try {
        if (messageId) {
          await axios.put(`/api/messages/mark/${messageId}`);
        }
      } catch (err) {
        console.error("Failed to mark seen:", err?.message || err);
      }
    },
    [axios]
  );

  // (Optional) Mark entire conversation as seen when opening a chat
  const markConversationSeen = useCallback(
    async (userId) => {
      try {
        if (userId) {
          await axios.put(`/api/messages/markAll/${userId}`);
          setUnseenMessage((prev) => ({ ...prev, [userId]: 0 }));
        }
      } catch (err) {
        console.error("Failed to mark conversation seen:", err?.message || err);
      }
    },
    [axios]
  );

  // -------- Socket handling --------
  const handleNewMessage = useCallback(
    (msg) => {
      if (!msg) return;

      const isActiveChat = !!selectedUser && msg.senderId === selectedUser._id;

      if (isActiveChat) {
        // append without mutating
        setMessages((prev) => [...prev, { ...msg, seen: true }]);
        // fire & forget
        markSeen(msg._id);
        // clear badge for this sender
        setUnseenMessage((prev) => ({ ...prev, [msg.senderId]: 0 }));
      } else {
        // increment unseen badge for sender
        setUnseenMessage((prev) => ({
          ...prev,
          [msg.senderId]: (prev[msg.senderId] || 0) + 1,
        }));
      }
    },
    [selectedUser?._id, markSeen]
  );

  useEffect(() => {
    if (!socket) return;
    // Ensure no duplicate listener; always pair the same handler
    socket.off("newMessage", handleNewMessage);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, handleNewMessage]);

  // Load users on mount
  // useEffect(() => {
  //   getUser();
  // }, [getUser]);
  useEffect(() => {
  if (localStorage.getItem("token")) {
    getUser();
  }
}, [getUser]);


  // When selecting a user: fetch messages & clear badge & (optionally) mark-all seen
  useEffect(() => {
    const uid = selectedUser?._id;
    if (!uid) return;

    getMessages(uid);
    setUnseenMessage((prev) => ({ ...prev, [uid]: 0 }));
    // If you want server-side mark-all, uncomment:
    // markConversationSeen(uid);
  }, [selectedUser?._id, getMessages /*, markConversationSeen */]);

  const value = {
    messages,
    users,
    selectedUser,
    setSelectedUser,
    getUser,
    getMessages,
    setMessages,
    sendMessage,
    unseenMessage,
    setUnseenMessage,
    markConversationSeen, // exposed if you want to call from Sidebar (optional)
  };

  return (
  <ChatContext.Provider value={value}>
    {children}
    </ChatContext.Provider>
  )

};
