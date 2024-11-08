import React, { useState } from "react";
import { Client, over } from "stompjs";
import SockJS from 'sockjs-client';
import ChatBox from "./ChatBox";
import Register from "./Register";

const  WS_URL  = import.meta.env.WS_URL;
let stompClient: Client;

type Payload = {
  senderName: string;
  receiverName: string;
  message: string;
  status: string;
}

const MessageArea: React.FC = () => {
  const [privateMessage, setPrivateMessage] = useState<Map<string, Payload[]>>(new Map());
  const [publicMessage, setPublicMessage] = useState<Payload[]>([]);
  const [chatArea, setChatArea] = useState<string>("PUBLIC");
  const [userData, setUserData] = useState({
    username: "",
    recievername: "",
    message: "",
    connected: false,
  });

  const registerUser = () => {
    connect();
  };

  const connect = () => {
    console.info("Try to connect in: " + WS_URL as string)
    let sock = new SockJS("http://localhost:8080/ws");
    stompClient = over(sock);
    stompClient.connect({}, onConnect, onError);
  };

  const onConnect = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived);
    stompClient.subscribe("/user/" + userData.username + "/private", onPrivateMessageReceived);
    userJoin();
  };

  const onError = (error: any) => {
    console.log(error);
  };

  const onPublicMessageReceived = (payload: { body: string }) => {
    let payloadData: Payload = JSON.parse(payload.body);
    switch (payloadData.status) {
      case "JOIN":
        if (!privateMessage.get(payloadData.senderName)) {
          privateMessage.set(payloadData.senderName, []);
          setPrivateMessage(new Map(privateMessage));
        }
        break;
      case "MESSAGE":
        publicMessage.push(payloadData);
        setPublicMessage([...publicMessage]);
        break;
    }
  };

  const onPrivateMessageReceived = (payload: { body: string }) => {
    var payloadData = JSON.parse(payload.body);
    if (!privateMessage.get(payloadData.senderName)) {
      privateMessage.set(payloadData.senderName, []);
    }
    privateMessage.get(payloadData.senderName)?.push(payloadData);
    setPrivateMessage(new Map(privateMessage));
  };

  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      status: "JOIN",
    };
    stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
  };

  const sendPublicMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        message: userData.message,
        status: "MESSAGE",
      };
      stompClient.send("/app/message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const sendPrivateMessage = () => {
    if (stompClient) {
      let chatMessage = {
        senderName: userData.username,
        receiverName: chatArea,
        message: userData.message,
        status: "MESSAGE",
      };
      if (!privateMessage.get(chatArea)) {
        privateMessage.set(chatArea, []);
      }
      privateMessage.get(chatArea)?.push(chatMessage);
      setPrivateMessage(new Map(privateMessage));
      stompClient.send("/app/private-message", {}, JSON.stringify(chatMessage));
      setUserData({ ...userData, message: "" });
    }
  };

  const handleMessageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setUserData({ ...userData, message: value });
  };

  const handleUsernameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setUserData({ ...userData, username: value });
  };

  return (
    <div className="container">
      {userData.connected ? (
        <ChatBox
          chatArea={chatArea}
          setChatArea={setChatArea}
          privateMessage={privateMessage}
          publicMessage={publicMessage}
          userData={userData}
          handleMessageInput={handleMessageInput}
          sendPublicMessage={sendPublicMessage}
          sendPrivateMessage={sendPrivateMessage}
        />
      ) : (
        <Register
          userData={userData}
          handleUsernameInput={handleUsernameInput}
          registerUser={registerUser}
        />
      )}
    </div>
  );
};

export default MessageArea;